"""
Configuration for the SPY News Trading Bot.

Tune these values to control sensitivity. The defaults are deliberately
conservative — only the highest-conviction setups will fire.
"""

# ---------------------------------------------------------------------------
# Minimum score (0-100) an event must reach to trigger an alert.
# 70+ = only the most historically-impactful catalysts get through.
# ---------------------------------------------------------------------------
ALERT_THRESHOLD = 70

# ---------------------------------------------------------------------------
# How often (in minutes) to poll news sources.
# ---------------------------------------------------------------------------
POLL_INTERVAL_MINUTES = 2

# ---------------------------------------------------------------------------
# RSS / news feed URLs.  Add or remove feeds as needed.
# ---------------------------------------------------------------------------
NEWS_FEEDS = [
    # Major financial news
    "https://feeds.finance.yahoo.com/rss/2.0/headline?s=SPY&region=US&lang=en-US",
    "https://www.cnbc.com/id/100003114/device/rss/rss.html",          # CNBC top news
    "https://www.cnbc.com/id/10001147/device/rss/rss.html",           # CNBC economy
    "https://feeds.marketwatch.com/marketwatch/topstories/",
    "https://feeds.marketwatch.com/marketwatch/marketpulse/",
    "https://www.reutersagency.com/feed/?best-topics=business-finance&post_type=best",
    "https://feeds.bloomberg.com/markets/news.rss",
]

# ---------------------------------------------------------------------------
# Economic calendar: FRED (Federal Reserve Economic Data) series IDs for
# high-impact releases.  The bot checks whether a release is imminent.
# ---------------------------------------------------------------------------
FRED_API_KEY = ""  # optional — set for FRED economic data lookups

# ---------------------------------------------------------------------------
# Webhook / notification URL.  Leave empty to print to stdout only.
# Supports Discord, Slack, or any service that accepts a JSON POST
# with a {"text": "..."} body.
# ---------------------------------------------------------------------------
WEBHOOK_URL = ""

# ---------------------------------------------------------------------------
# Console output settings
# ---------------------------------------------------------------------------
ENABLE_COLOR = True
VERBOSE = False
