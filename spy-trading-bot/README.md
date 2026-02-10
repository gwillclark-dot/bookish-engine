# SPY News Trading Bot

Monitors financial news feeds in real-time and flags only the **highest-conviction catalysts** — events that have historically caused significant SPY moves (1%+). Designed to cut through noise so you only get alerted on setups that matter.

## What gets flagged

The bot scores headlines on a 0-100 scale. Only events scoring **70+** trigger alerts (configurable). Categories:

| Category | Example | Typical SPY impact |
|---|---|---|
| **Fed / FOMC** | Emergency rate cut, surprise hawkish pivot | 1-3% |
| **Geopolitical** | Military strikes, tariff escalation, debt ceiling crisis | 1-4% |
| **Macro data** | CPI shock, NFP miss, recession confirmation | 0.5-2% |
| **Market structure** | Circuit breaker, flash crash, VIX spike >35 | 2-7% |
| **Banking** | Bank failure, credit crisis | 1-3% |
| **Earnings** | Mag 7 earnings miss/beat, guidance shock | 0.5-1.5% |
| **Fiscal** | Stimulus bill passed, major tax reform | 0.5-1.5% |

## Quick start

```bash
cd spy-trading-bot
pip install -r requirements.txt

# Test mode — see how scoring works with sample headlines
python bot.py --test

# Single scan — check feeds once and exit
python bot.py --once

# Continuous monitoring (default: every 2 minutes)
python bot.py
```

## Configuration

Edit `config.py` to tune:

- **`ALERT_THRESHOLD`** (default 70) — minimum score to trigger an alert. Raise to 80+ if you want only extreme events.
- **`POLL_INTERVAL_MINUTES`** (default 2) — how often to check feeds.
- **`NEWS_FEEDS`** — list of RSS feed URLs to monitor.
- **`WEBHOOK_URL`** — Discord/Slack webhook for push notifications.

Or override at runtime:

```bash
python bot.py --threshold 80   # only alert on 80+ events
```

## How scoring works

Each headline is matched against ~30 regex patterns derived from historically market-moving catalysts. The raw match score (0-100) is then adjusted by:

1. **Source credibility** — Reuters/Bloomberg/WSJ get a slight boost; unknown sources get a penalty
2. **Market timing** — News breaking during market hours scores higher than overnight
3. **Category severity** — Fed decisions and market structure events inherently score higher

## Architecture

```
bot.py          — Main runner, scheduling, CLI
feeds.py        — RSS fetching, deduplication, economic calendar
impact.py       — Headline scoring engine (regex patterns + multipliers)
alerts.py       — Console formatting, webhook delivery
config.py       — All tunable parameters
```

## Adding webhook notifications

Set `WEBHOOK_URL` in `config.py` to a Discord or Slack incoming webhook URL:

```python
WEBHOOK_URL = "https://discord.com/api/webhooks/YOUR/WEBHOOK"
```

## Disclaimer

This bot is an informational tool only. It does not execute trades. News-based signals are inherently uncertain — always do your own analysis, manage risk, and never trade more than you can afford to lose.
