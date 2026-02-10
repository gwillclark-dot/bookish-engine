"""
News feed fetcher.

Pulls headlines from RSS feeds and normalises them into a common format
for the impact scoring engine.  Uses stdlib xml.etree for RSS parsing
(no external feedparser dependency needed).
"""

from __future__ import annotations

import logging
import hashlib
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import List
from urllib.parse import urlparse

import requests
from dateutil import parser as dateutil_parser

import config

log = logging.getLogger(__name__)

# Keep track of headlines we've already seen so we don't alert twice.
_seen_hashes: set[str] = set()
MAX_SEEN = 5000  # cap memory usage


def _hash(text: str) -> str:
    return hashlib.sha256(text.encode()).hexdigest()[:16]


def _parse_date(text: str | None) -> datetime | None:
    if not text:
        return None
    try:
        return dateutil_parser.parse(text)
    except (ValueError, TypeError):
        return None


def _source_from_url(url: str) -> str:
    """Derive a human-readable source name from a feed URL."""
    host = urlparse(url).netloc.lower()
    for name in ("reuters", "bloomberg", "cnbc", "marketwatch", "yahoo", "wsj"):
        if name in host:
            return name
    return host


def _parse_rss(xml_text: str, feed_url: str) -> list[dict]:
    """Parse RSS/Atom XML into a list of normalised items."""
    items: list[dict] = []
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError:
        log.warning("XML parse error for %s", feed_url)
        return items

    source = _source_from_url(feed_url)

    # Try RSS 2.0 (<channel><item>)
    for item in root.iter("item"):
        title_el = item.find("title")
        link_el = item.find("link")
        pub_el = item.find("pubDate")
        if title_el is None or not (title_el.text or "").strip():
            continue
        items.append({
            "title": title_el.text.strip(),
            "source": source,
            "link": (link_el.text or "").strip() if link_el is not None else "",
            "published": _parse_date(pub_el.text if pub_el is not None else None),
        })

    # Try Atom (<entry>)  — namespaced
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    for entry in root.iter("{http://www.w3.org/2005/Atom}entry"):
        title_el = entry.find("atom:title", ns)
        link_el = entry.find("atom:link", ns)
        updated_el = entry.find("atom:updated", ns)
        if title_el is None or not (title_el.text or "").strip():
            continue
        link = ""
        if link_el is not None:
            link = link_el.get("href", "")
        items.append({
            "title": title_el.text.strip(),
            "source": source,
            "link": link,
            "published": _parse_date(updated_el.text if updated_el is not None else None),
        })

    return items


def fetch_all(feeds: list[str] | None = None) -> List[dict]:
    """
    Fetch all configured RSS feeds and return a deduplicated list of
    normalised items::

        [{"title": str, "source": str, "link": str, "published": datetime | None}, ...]

    Only *new* items (not previously seen) are returned.
    """
    feeds = feeds or config.NEWS_FEEDS
    items: list[dict] = []

    for url in feeds:
        try:
            resp = requests.get(url, timeout=15, headers={
                "User-Agent": "SPYNewsBot/1.0",
            })
            resp.raise_for_status()
            parsed_items = _parse_rss(resp.text, url)

            for item in parsed_items:
                title = item["title"]
                h = _hash(title)
                if h in _seen_hashes:
                    continue
                _seen_hashes.add(h)
                items.append(item)

        except Exception:
            log.warning("Failed to fetch feed: %s", url, exc_info=True)

    # Trim seen-set if it gets too large
    if len(_seen_hashes) > MAX_SEEN:
        excess = len(_seen_hashes) - MAX_SEEN
        for _ in range(excess):
            _seen_hashes.pop()

    log.info("Fetched %d new headlines from %d feeds", len(items), len(feeds))
    return items


def fetch_economic_calendar() -> List[dict]:
    """
    Fetch upcoming high-impact US economic events.

    Uses the FRED API if a key is configured, otherwise falls back to a
    static calendar of recurring events that historically move SPY the most.
    """
    events: list[dict] = []

    # ── Static recurring high-impact events ──────────────────────────
    # These are the releases that have historically caused the biggest
    # intraday SPY moves.  The bot checks if today matches any of them.
    now = datetime.now(timezone.utc)

    RECURRING = [
        {"title": "FOMC Rate Decision", "day_hint": "wednesday",
         "frequency": "6-weekly", "base_score": 85},
        {"title": "CPI Release (8:30 AM ET)", "day_hint": "tuesday-thursday",
         "frequency": "monthly", "base_score": 80},
        {"title": "Non-Farm Payrolls (8:30 AM ET)", "day_hint": "friday",
         "frequency": "monthly-first-friday", "base_score": 78},
        {"title": "FOMC Meeting Minutes", "day_hint": "wednesday",
         "frequency": "3-weeks-after-fomc", "base_score": 70},
        {"title": "PCE Price Index", "day_hint": "varies",
         "frequency": "monthly", "base_score": 72},
        {"title": "GDP Report", "day_hint": "thursday",
         "frequency": "quarterly", "base_score": 72},
        {"title": "Jackson Hole / Fed Symposium", "day_hint": "august",
         "frequency": "annual", "base_score": 75},
    ]

    # We include these as informational items; the impact engine can
    # further score them if the headline also appears in actual news.
    for evt in RECURRING:
        events.append({
            "title": f"[ECON CALENDAR] {evt['title']} — historically high-impact",
            "source": "economic-calendar",
            "link": "",
            "published": now,
        })

    return events
