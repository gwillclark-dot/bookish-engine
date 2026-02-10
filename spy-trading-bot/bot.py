#!/usr/bin/env python3
"""
SPY News Trading Bot — Main runner.

Continuously monitors financial news feeds and flags high-conviction
catalysts that are likely to cause significant SPY moves.

Usage:
    python bot.py              # run continuously (polls every N minutes)
    python bot.py --once       # run a single scan and exit
    python bot.py --test       # run with a handful of test headlines
"""

from __future__ import annotations

import argparse
import logging
import signal
import sys
import time
from datetime import datetime, timezone

import schedule

import config
import feeds
import alerts
from impact import score_headlines, ScoredEvent


# ── Logging setup ────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.DEBUG if config.VERBOSE else logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
log = logging.getLogger("bot")


# ── Graceful shutdown ────────────────────────────────────────────────────
_running = True

def _shutdown(sig, frame):
    global _running
    print("\nShutting down...")
    _running = False

signal.signal(signal.SIGINT, _shutdown)
signal.signal(signal.SIGTERM, _shutdown)


# ── Core scan logic ──────────────────────────────────────────────────────

def scan() -> list[ScoredEvent]:
    """
    Fetch latest headlines, score them, and alert on anything above threshold.
    Returns the list of events that triggered alerts.
    """
    log.info("Scanning feeds...")

    # 1. Fetch new headlines from RSS
    items = feeds.fetch_all()

    # 2. Also pull in economic calendar context
    items.extend(feeds.fetch_economic_calendar())

    if not items:
        log.info("No new headlines.")
        return []

    # 3. Score everything
    scored = score_headlines(items)
    log.info("Scored %d matching events out of %d total headlines",
             len(scored), len(items))

    # 4. Filter to high-conviction only
    hot = [e for e in scored if e.score >= config.ALERT_THRESHOLD]

    if hot:
        log.info("==> %d event(s) above threshold (%d)", len(hot), config.ALERT_THRESHOLD)
        alerts.send_batch(hot)
    else:
        log.info("Nothing above threshold this cycle.")

    return hot


# ── Test mode ────────────────────────────────────────────────────────────

TEST_HEADLINES = [
    {"title": "Fed announces emergency rate cut of 50bps amid market turmoil",
     "source": "reuters", "link": "https://example.com/1"},
    {"title": "CPI comes in shockingly hot, inflation surges to 9.1%",
     "source": "bloomberg", "link": "https://example.com/2"},
    {"title": "Russia launches military strike on NATO ally",
     "source": "reuters", "link": "https://example.com/3"},
    {"title": "Circuit breaker triggered as S&P 500 drops 7%",
     "source": "cnbc", "link": "https://example.com/4"},
    {"title": "Apple beats earnings expectations, guides higher",
     "source": "yahoo", "link": "https://example.com/5"},
    {"title": "New tariffs announced on all Chinese imports, trade war escalates",
     "source": "wsj", "link": "https://example.com/6"},
    {"title": "Major bank fails, FDIC steps in to seize assets",
     "source": "bloomberg", "link": "https://example.com/7"},
    {"title": "Powell press conference: dovish Fed signals rate cuts ahead",
     "source": "cnbc", "link": "https://example.com/8"},
    {"title": "Debt ceiling deadline passes, US faces potential default crisis",
     "source": "reuters", "link": "https://example.com/9"},
    {"title": "Local weather is nice today in Springfield",
     "source": "local-news", "link": "https://example.com/10"},  # should be filtered out
    {"title": "VIX spikes above 45 as volatility surges",
     "source": "marketwatch", "link": "https://example.com/11"},
    {"title": "Stimulus package passes Congress, $2 trillion approved",
     "source": "cnbc", "link": "https://example.com/12"},
]


def run_test():
    """Score the test headlines and print results."""
    print("\n" + "=" * 70)
    print("  SPY NEWS BOT — TEST MODE")
    print("=" * 70 + "\n")

    scored = score_headlines(TEST_HEADLINES)

    print(f"Matched {len(scored)} of {len(TEST_HEADLINES)} headlines:\n")
    for ev in scored:
        marker = " ** ALERT **" if ev.score >= config.ALERT_THRESHOLD else ""
        print(f"  {ev}{marker}")

    # Now show full alerts for items above threshold
    hot = [e for e in scored if e.score >= config.ALERT_THRESHOLD]
    if hot:
        print(f"\n{'=' * 70}")
        print(f"  {len(hot)} event(s) would trigger alerts:\n")
        alerts.send_batch(hot)
    else:
        print(f"\nNo events above threshold ({config.ALERT_THRESHOLD}).")


# ── Entry point ──────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="SPY News Trading Bot")
    parser.add_argument("--once", action="store_true",
                        help="Run a single scan and exit")
    parser.add_argument("--test", action="store_true",
                        help="Run with test headlines")
    parser.add_argument("--threshold", type=int, default=None,
                        help=f"Override alert threshold (default: {config.ALERT_THRESHOLD})")
    args = parser.parse_args()

    if args.threshold is not None:
        config.ALERT_THRESHOLD = args.threshold
        log.info("Threshold overridden to %d", config.ALERT_THRESHOLD)

    if args.test:
        run_test()
        return

    banner = f"""
╔══════════════════════════════════════════════════════════════════════╗
║                    SPY NEWS TRADING BOT                            ║
║                                                                    ║
║  Monitoring {len(config.NEWS_FEEDS)} feeds every {config.POLL_INTERVAL_MINUTES} min                                  ║
║  Alert threshold: {config.ALERT_THRESHOLD}/100                                          ║
║  Webhook: {'configured' if config.WEBHOOK_URL else 'not configured (console only)'}                             ║
║                                                                    ║
║  Only the most surefire, high-conviction setups will be flagged.   ║
║  Press Ctrl+C to stop.                                             ║
╚══════════════════════════════════════════════════════════════════════╝
"""
    print(banner)

    if args.once:
        scan()
        return

    # Run first scan immediately, then schedule
    scan()
    schedule.every(config.POLL_INTERVAL_MINUTES).minutes.do(scan)

    while _running:
        schedule.run_pending()
        time.sleep(1)

    log.info("Bot stopped.")


if __name__ == "__main__":
    main()
