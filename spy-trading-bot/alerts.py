"""
Alert / notification system.

Formats scored events into human-readable alerts and delivers them via:
  - Console (always)
  - Webhook (Discord / Slack / custom — if configured)
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timezone

import requests

import config
from impact import ScoredEvent

log = logging.getLogger(__name__)


# ── ANSI colours for terminal output ─────────────────────────────────────
_RED = "\033[91m"
_GREEN = "\033[92m"
_YELLOW = "\033[93m"
_CYAN = "\033[96m"
_BOLD = "\033[1m"
_RESET = "\033[0m"


def _c(code: str, text: str) -> str:
    if not config.ENABLE_COLOR:
        return text
    return f"{code}{text}{_RESET}"


def _direction_display(direction: str) -> str:
    if direction == "bullish":
        return _c(_GREEN, "BULLISH ^")
    elif direction == "bearish":
        return _c(_RED, "BEARISH v")
    return _c(_YELLOW, "VOLATILE ~")


def _score_bar(score: int) -> str:
    filled = score // 5  # 0-20 blocks
    bar = "█" * filled + "░" * (20 - filled)
    if score >= 85:
        return _c(_RED, bar)
    elif score >= 70:
        return _c(_YELLOW, bar)
    return bar


def format_console(event: ScoredEvent) -> str:
    """Format a single event for terminal display."""
    now_str = datetime.now(timezone.utc).strftime("%H:%M:%S UTC")
    lines = [
        "",
        _c(_BOLD, "═" * 70),
        _c(_BOLD, f"  SPY ALERT  |  {now_str}  |  Score: {event.score}/100"),
        f"  {_score_bar(event.score)}",
        _c(_BOLD, "═" * 70),
        f"  Direction : {_direction_display(event.direction)}",
        f"  Category  : {_c(_CYAN, event.category.upper())}",
        f"  Headline  : {event.headline}",
        f"  Source    : {event.source}",
    ]
    if event.url:
        lines.append(f"  Link      : {event.url}")
    if event.published:
        lines.append(f"  Published : {event.published.strftime('%Y-%m-%d %H:%M UTC')}")

    # Action guidance
    lines.append("")
    if event.score >= 90:
        lines.append(_c(_RED, "  >>> EXTREME impact expected. Watch for 2%+ SPY move. <<<"))
    elif event.score >= 80:
        lines.append(_c(_YELLOW, "  >>> High impact expected. Watch for 1-2% SPY move. <<<"))
    else:
        lines.append("  >>> Notable catalyst. Watch for 0.5-1% SPY move. <<<")

    if event.direction == "bullish":
        lines.append("  Setup: Calls / long bias. Wait for confirmation on 5m chart.")
    elif event.direction == "bearish":
        lines.append("  Setup: Puts / short bias. Wait for confirmation on 5m chart.")
    else:
        lines.append("  Setup: Straddle / strangle. Expect big move, direction TBD.")
        lines.append("  Wait for first 5m candle after news for directional entry.")

    lines.append(_c(_BOLD, "═" * 70))
    lines.append("")
    return "\n".join(lines)


def format_webhook(event: ScoredEvent) -> str:
    """Format for Discord / Slack webhook (plain text, no ANSI)."""
    arrow = {"bullish": "^", "bearish": "v", "neutral": "~"}[event.direction]
    msg = (
        f"**SPY ALERT** [{event.score}/100 {arrow}]\n"
        f"**{event.category.upper()}** — {event.headline}\n"
        f"Direction: {event.direction.upper()} | Source: {event.source}\n"
    )
    if event.url:
        msg += f"Link: {event.url}\n"

    if event.score >= 90:
        msg += ">>> EXTREME impact expected. Watch for 2%+ SPY move.\n"
    elif event.score >= 80:
        msg += ">>> High impact expected. Watch for 1-2% SPY move.\n"
    else:
        msg += ">>> Notable catalyst. Watch for 0.5-1% SPY move.\n"

    return msg


def send(event: ScoredEvent) -> None:
    """Print to console and optionally fire a webhook."""
    print(format_console(event))

    if config.WEBHOOK_URL:
        try:
            payload = {"text": format_webhook(event), "content": format_webhook(event)}
            resp = requests.post(
                config.WEBHOOK_URL,
                data=json.dumps(payload),
                headers={"Content-Type": "application/json"},
                timeout=10,
            )
            if resp.status_code >= 400:
                log.warning("Webhook returned %d: %s", resp.status_code, resp.text[:200])
        except Exception:
            log.warning("Webhook delivery failed", exc_info=True)


def send_batch(events: list[ScoredEvent]) -> None:
    """Send alerts for a list of events."""
    for event in events:
        send(event)
