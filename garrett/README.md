# Garrett - Daily Research Agent

Your tireless research assistant for classic car restoration. Garrett wakes up every morning, reads your current projects from Notion, searches the web for relevant information, and delivers a digest to your inbox.

## Features

- **Smart Query Generation**: Uses Claude to generate specific, actionable research queries based on your active projects
- **Web Search**: Searches via SerpAPI for parts, techniques, forum discussions, and documentation
- **Relevance Analysis**: Claude analyzes each result to extract useful information
- **Notion Integration**: Stores findings in your Research Findings database, adds parts to your wishlist
- **Daily Digest**: Sends a friendly email summary of what was found
- **Duplicate Detection**: Tracks what's been researched to avoid repeating work

## Quick Start

### 1. Install Dependencies

```bash
cd garrett
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your API keys and database IDs
```

You'll need:
- **Anthropic API Key**: From https://console.anthropic.com/
- **Notion API Key**: From https://www.notion.so/my-integrations
- **SerpAPI Key**: From https://serpapi.com/ (100 free searches/month)
- **Email Config**: Gmail app password or SendGrid API key

### 3. Set Up Notion Databases

Create these databases in Notion and share them with your integration:

**Research Findings:**
- Title (title)
- Category (select): Parts, Techniques, Forum Discussion, Documentation, Vendor, Other
- Date Found (date)
- Source (url)
- Status (status): New, Reviewed, Acted On
- Tags (multi-select)

**Parts Wishlist:**
- Part Name (title)
- Part Number (text)
- Vendor (text)
- Price (number)
- URL (url)
- Priority (select): High, Medium, Low

**Current Projects:**
- Project Name (title)
- Status (status): Not Started, In Progress, On Hold, Completed
- Priority (select): High, Medium, Low
- Notes (text)

### 4. Test It

```bash
# Run a single query test
python garrett.py --test

# Full daily run
python garrett.py
```

### 5. Schedule Daily Runs

Add to your crontab (`crontab -e`):

```bash
# Run Garrett at 6am every day
0 6 * * * cd /path/to/garrett && /usr/bin/python3 garrett.py >> garrett.log 2>&1
```

## Usage

```bash
# Full daily research run
python garrett.py

# Test mode - single query only
python garrett.py --test

# Just send digest of recent findings (no new research)
python garrett.py --digest
```

## Configuration

Edit `.env` to customize:

- `MAX_QUERIES`: How many research queries per run (default: 3)
- `LOG_LEVEL`: DEBUG, INFO, WARNING, ERROR
- `CAR_YEAR`, `CAR_MAKE`, `CAR_MODEL`: Your car details

## Module Testing

Each module can be tested independently:

```bash
# Test Notion connection
python notion_client.py

# Test research engine
python research.py

# Test email
python email_digest.py
```

## How It Works

1. **Morning Wake-up**: Garrett runs at 6am (or whenever you schedule it)
2. **Project Check**: Fetches your active projects from Notion
3. **Query Generation**: Claude generates 3-5 specific research queries based on what you're working on
4. **Web Search**: Searches Google via SerpAPI for each query
5. **Analysis**: Claude analyzes each result for relevance, extracts part numbers, prices, techniques
6. **Storage**: Relevant findings go into your Notion Research Findings database
7. **Parts Detection**: If a part number or price is found, it's added to your Parts Wishlist
8. **Digest**: A summary email is sent to you with the day's findings
9. **History**: Queries and sources are tracked to avoid researching the same things

## Customization

Want to research something other than a 1968 Chevelle? Just update the `.env`:

```bash
CAR_YEAR=1970
CAR_MAKE=Plymouth
CAR_MODEL=Barracuda 440
```

Garrett will adapt all queries and analysis to your specific vehicle.

## Troubleshooting

**"NOTION_API_KEY not set"**: Make sure you copied `.env.example` to `.env` and filled in your keys.

**Rate limiting**: Garrett automatically retries with exponential backoff. If you're hitting limits often, reduce `MAX_QUERIES`.

**Gmail won't send**: You need an App Password, not your regular password. See: https://support.google.com/accounts/answer/185833

**No results found**: Try running with `LOG_LEVEL=DEBUG` to see what's happening.

---

Built with Claude, Python, and a love for classic iron.
