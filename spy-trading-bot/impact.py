"""
Impact analysis engine.

Scores news headlines on a 0-100 scale based on:
  1. Keyword / phrase matching against historically market-moving catalysts
  2. Source credibility weighting
  3. Timing relevance (market hours vs. off-hours)
  4. Category classification (Fed, geopolitical, earnings, macro data, etc.)

Only events scoring >= ALERT_THRESHOLD are considered "surefire" setups.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import List, Tuple


# ── Catalyst categories with base scores and direction bias ──────────────
# Each tuple: (regex_pattern, base_score, direction_bias, category)
#   direction_bias: "bearish", "bullish", or "neutral" (could go either way hard)
#   base_score: 0-100, will be modified by multipliers

CATALYST_PATTERNS: List[Tuple[re.Pattern, int, str, str]] = []

_RAW_PATTERNS = [
    # ── Federal Reserve / Monetary Policy (highest impact on SPY) ─────
    (r"\b(emergency|unscheduled)\b.{0,30}\b(rate\s*(cut|hike)|fed\s*meet)", 95, "neutral", "fed"),
    (r"\bfed\b.{0,20}\b(surprise|unexpected|shock)", 90, "neutral", "fed"),
    (r"\b(rate\s*(cut|hike|increase|decrease))", 80, "neutral", "fed"),
    (r"\bfomc\b.{0,30}\b(decision|statement|minutes|announce)", 78, "neutral", "fed"),
    (r"\b(powell|fed\s*chair)\b.{0,30}\b(speak|press\s*conference|testimony|remarks)", 75, "neutral", "fed"),
    (r"\bquantitative\s*(easing|tightening)", 72, "neutral", "fed"),
    (r"\b(hawkish|dovish)\b.{0,20}\b(fed|fomc|powell)", 70, "neutral", "fed"),

    # ── Geopolitical / Black-swan events ─────────────────────────────
    (r"\b(war\s*declar|military\s*strike|nuclear|invasion)\b", 92, "bearish", "geopolitical"),
    (r"\b(tariff|trade\s*war|sanction)\b.{0,30}\b(announce|impose|new|escalat)", 85, "bearish", "geopolitical"),
    (r"\b(ceasefire|peace\s*(deal|agreement|treaty))\b", 80, "bullish", "geopolitical"),
    (r"\b(government\s*shutdown)\b", 72, "bearish", "geopolitical"),
    (r"\b(debt\s*ceiling|default)\b.{0,20}\b(crisis|deadline|breach|fail)", 88, "bearish", "geopolitical"),

    # ── Macro economic data releases ─────────────────────────────────
    (r"\b(non-?farm\s*payroll|nfp|jobs\s*report)\b.{0,20}\b(shock|miss|blow|surge|crash)", 82, "neutral", "macro"),
    (r"\bcpi\b.{0,20}\b(shock|surprise|spike|plunge|unexpect|hot|cool)", 85, "neutral", "macro"),
    (r"\b(gdp)\b.{0,20}\b(contract|recession|negative|shock|surprise)", 80, "bearish", "macro"),
    (r"\b(recession)\b.{0,15}\b(official|confirm|declar)", 88, "bearish", "macro"),
    (r"\b(inflation)\b.{0,20}\b(surge|spike|record|unexpect|shock)", 82, "bearish", "macro"),
    (r"\b(unemployment)\b.{0,20}\b(surge|spike|jump|record|shock)", 78, "bearish", "macro"),

    # ── Major earnings / corporate (SPY component weight matters) ────
    (r"\b(apple|aapl|microsoft|msft|amazon|amzn|nvidia|nvda|google|goog|meta|tsla)\b.{0,30}\b(miss|beat|warn|guid(ance|e)\s*(cut|lower|raise))", 75, "neutral", "earnings"),
    (r"\b(mag\s*7|magnificent\s*seven|big\s*tech)\b.{0,20}\b(sell|crash|plunge|rip|surge)", 78, "neutral", "earnings"),

    # ── Market structure / circuit breaker events ────────────────────
    (r"\b(circuit\s*breaker|trading\s*halt|market\s*halt)\b", 95, "bearish", "structure"),
    (r"\b(flash\s*crash|liquidity\s*crisis)\b", 90, "bearish", "structure"),
    (r"\b(margin\s*call)\b.{0,20}\b(massive|record|cascade)", 85, "bearish", "structure"),
    (r"\bvix\b.{0,15}\b(spike|surge|above\s*(3[5-9]|[4-9]\d))", 80, "bearish", "structure"),

    # ── Fiscal / legislative ─────────────────────────────────────────
    (r"\b(stimulus|relief)\s*(package|bill|act)\b.{0,20}\b(pass|sign|approv)", 76, "bullish", "fiscal"),
    (r"\b(tax\s*(cut|reform|hike))\b.{0,15}\b(pass|sign|approv|propos)", 72, "neutral", "fiscal"),

    # ── Banking / credit events ──────────────────────────────────────
    (r"\b(bank)\b.{0,15}\b(fail|collaps|run|seiz|bail)", 88, "bearish", "banking"),
    (r"\b(credit\s*(crisis|crunch|freeze))\b", 85, "bearish", "banking"),
    (r"\b(svb|silicon\s*valley\s*bank|first\s*republic|credit\s*suisse)\b.{0,20}\b(fail|collaps)", 84, "bearish", "banking"),
]

for _pat, _score, _dir, _cat in _RAW_PATTERNS:
    CATALYST_PATTERNS.append((re.compile(_pat, re.IGNORECASE), _score, _dir, _cat))


# ── Source credibility multipliers ───────────────────────────────────────
# Higher = more trustworthy for market-moving news
SOURCE_WEIGHTS = {
    "reuters": 1.10,
    "bloomberg": 1.10,
    "cnbc": 1.05,
    "marketwatch": 1.00,
    "yahoo": 0.95,
    "wsj": 1.10,
    "ft.com": 1.05,
    "associated press": 1.05,
}

# ── Timing multiplier ───────────────────────────────────────────────────
# News breaking during / right before market hours has more urgency.
MARKET_HOURS_MULTIPLIER = 1.10
OFF_HOURS_MULTIPLIER = 0.95


@dataclass
class ScoredEvent:
    """A news event that has been scored by the impact engine."""
    headline: str
    source: str
    url: str
    published: datetime | None
    score: int                      # 0-100 final score
    raw_score: int                  # before multipliers
    direction: str                  # bullish / bearish / neutral
    category: str                   # fed, geopolitical, macro, ...
    matched_patterns: list = field(default_factory=list)

    def __str__(self) -> str:
        arrow = {"bullish": "^", "bearish": "v", "neutral": "~"}.get(self.direction, "?")
        return (
            f"[{self.score:3d}/100 {arrow}] ({self.category.upper()}) "
            f"{self.headline[:90]}"
        )


def _source_multiplier(source: str) -> float:
    src = source.lower()
    for key, mult in SOURCE_WEIGHTS.items():
        if key in src:
            return mult
    return 0.90  # unknown source gets a slight penalty


def _timing_multiplier() -> float:
    """Return a multiplier based on current time vs US market hours (ET)."""
    now = datetime.now(timezone.utc)
    et_hour = (now.hour - 5) % 24  # rough UTC->ET
    # Pre-market 7-9:30, market 9:30-16:00, after-hours 16-18
    if 7 <= et_hour < 18:
        return MARKET_HOURS_MULTIPLIER
    return OFF_HOURS_MULTIPLIER


def score_headline(headline: str, source: str = "", url: str = "",
                   published: datetime | None = None) -> ScoredEvent | None:
    """
    Score a single headline.  Returns a ScoredEvent if any catalyst pattern
    matches, otherwise None (headline is irrelevant noise).
    """
    best_score = 0
    best_dir = "neutral"
    best_cat = ""
    matched = []

    for pattern, base_score, direction, category in CATALYST_PATTERNS:
        if pattern.search(headline):
            matched.append(pattern.pattern)
            if base_score > best_score:
                best_score = base_score
                best_dir = direction
                best_cat = category

    if best_score == 0:
        return None

    # Apply multipliers
    raw = best_score
    adjusted = best_score * _source_multiplier(source) * _timing_multiplier()
    final = min(100, int(round(adjusted)))

    return ScoredEvent(
        headline=headline,
        source=source,
        url=url,
        published=published,
        score=final,
        raw_score=raw,
        direction=best_dir,
        category=best_cat,
        matched_patterns=matched,
    )


def score_headlines(items: list[dict]) -> list[ScoredEvent]:
    """
    Score a batch of news items.  Each item should have at minimum:
      {"title": str}
    and optionally: {"source": str, "link": str, "published": datetime}

    Returns only items that matched at least one catalyst pattern,
    sorted by score descending.
    """
    results = []
    for item in items:
        ev = score_headline(
            headline=item.get("title", ""),
            source=item.get("source", ""),
            url=item.get("link", ""),
            published=item.get("published"),
        )
        if ev is not None:
            results.append(ev)
    results.sort(key=lambda e: e.score, reverse=True)
    return results
