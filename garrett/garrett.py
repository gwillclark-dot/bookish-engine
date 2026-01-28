#!/usr/bin/env python3
"""
GARRETT - Daily Research Agent for Classic Car Restoration

Your tireless research assistant for the 1968 Chevelle SS 396 build.
Runs daily at 6am, finds what you need, and keeps you moving.

Usage:
    python garrett.py              # Full daily run
    python garrett.py --test       # Single query test mode
    python garrett.py --digest     # Just send the digest (no new research)

Schedule with cron:
    0 6 * * * cd /path/to/garrett && python garrett.py >> garrett.log 2>&1
"""

import argparse
import json
import logging
import os
import sys
from datetime import datetime
from pathlib import Path

from dotenv import load_dotenv

# Local modules
from notion_client import NotionClient
from research import ResearchEngine
from email_digest import EmailDigest

# Load environment variables
load_dotenv()

# Setup logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger('garrett')

# Track what we've researched to avoid duplicates
RESEARCH_HISTORY_FILE = Path(__file__).parent / '.research_history.json'


def load_research_history() -> dict:
    """Load the history of what we've already researched."""
    if RESEARCH_HISTORY_FILE.exists():
        with open(RESEARCH_HISTORY_FILE) as f:
            return json.load(f)
    return {'queries': [], 'sources': []}


def save_research_history(history: dict):
    """Save research history to avoid duplicates."""
    with open(RESEARCH_HISTORY_FILE, 'w') as f:
        json.dump(history, f, indent=2)


def is_duplicate(query: str, url: str, history: dict) -> bool:
    """Check if we've already researched this query or source."""
    # Normalize for comparison
    query_lower = query.lower().strip()

    # Check if query is too similar to previous ones
    for past_query in history.get('queries', []):
        if query_lower == past_query.lower():
            return True

    # Check if we've already scraped this URL
    if url in history.get('sources', []):
        return True

    return False


def run_daily_research(test_mode: bool = False):
    """
    Main research flow:
    1. Get current projects from Notion
    2. Generate research queries with Claude
    3. Search the web for each query
    4. Analyze and extract relevant info
    5. Store findings in Notion
    6. Generate and send digest
    """
    logger.info("=" * 60)
    logger.info("GARRETT waking up... Time to do some research!")
    logger.info("=" * 60)

    # Get car details from config
    car_year = os.getenv('CAR_YEAR', '1968')
    car_make = os.getenv('CAR_MAKE', 'Chevrolet')
    car_model = os.getenv('CAR_MODEL', 'Chevelle SS 396')
    car_description = f"{car_year} {car_make} {car_model}"

    logger.info(f"Researching: {car_description}")

    # Initialize clients
    try:
        notion = NotionClient()
        research = ResearchEngine()
        email = EmailDigest()
    except Exception as e:
        logger.error(f"Failed to initialize clients: {e}")
        sys.exit(1)

    # Load research history
    history = load_research_history()

    # Step 1: Get current projects from Notion
    logger.info("Fetching current projects from Notion...")
    try:
        projects = notion.get_current_projects()
        logger.info(f"Found {len(projects)} active projects")
        for p in projects:
            logger.info(f"  - {p['name']} ({p['status']})")
    except Exception as e:
        logger.error(f"Failed to fetch projects: {e}")
        # Use fallback if Notion fails
        projects = [{
            'name': 'General Restoration',
            'status': 'In Progress',
            'notes': 'Engine rebuild, body work, interior restoration'
        }]

    # Step 2: Generate research queries based on projects
    logger.info("Generating research queries...")
    max_queries = int(os.getenv('MAX_QUERIES', '3'))
    if test_mode:
        max_queries = 1

    queries = research.generate_queries(
        car_description=car_description,
        projects=projects,
        max_queries=max_queries,
        exclude=history.get('queries', [])[-50:]  # Exclude last 50 queries
    )
    logger.info(f"Generated {len(queries)} research queries")

    # Step 3-4: Search and analyze each query
    all_findings = []

    for query in queries:
        logger.info(f"\nResearching: {query}")

        try:
            # Search the web
            search_results = research.search_web(query)
            logger.info(f"  Found {len(search_results)} search results")

            # Analyze each result
            for result in search_results[:5]:  # Top 5 results per query
                url = result.get('link', '')

                # Skip duplicates
                if is_duplicate(query, url, history):
                    logger.debug(f"  Skipping duplicate: {url}")
                    continue

                # Analyze the result
                finding = research.analyze_result(
                    query=query,
                    result=result,
                    car_description=car_description
                )

                if finding and finding.get('relevant'):
                    all_findings.append(finding)
                    history['sources'].append(url)
                    logger.info(f"  Found relevant info: {finding['title'][:50]}...")

        except Exception as e:
            logger.error(f"  Error researching '{query}': {e}")
            continue

        # Track the query
        history['queries'].append(query)

    # Keep history manageable
    history['queries'] = history['queries'][-200:]
    history['sources'] = history['sources'][-500:]
    save_research_history(history)

    # Step 5: Store findings in Notion
    logger.info(f"\nStoring {len(all_findings)} findings in Notion...")
    stored_count = 0

    for finding in all_findings:
        try:
            notion.add_research_finding(finding)
            stored_count += 1

            # If it's a part, add to wishlist
            if finding.get('part_number') or finding.get('category') == 'Parts':
                notion.add_to_wishlist(finding)
                logger.info(f"  Added to wishlist: {finding['title']}")

        except Exception as e:
            logger.error(f"  Failed to store finding: {e}")

    logger.info(f"Stored {stored_count} findings in Notion")

    # Step 6: Generate and send digest
    if all_findings:
        logger.info("\nGenerating daily digest...")
        try:
            digest = research.generate_digest(
                findings=all_findings,
                car_description=car_description
            )
            email.send_digest(digest)
            logger.info("Daily digest sent!")
        except Exception as e:
            logger.error(f"Failed to send digest: {e}")
    else:
        logger.info("No new findings today - skipping digest")

    logger.info("\n" + "=" * 60)
    logger.info("GARRETT signing off. See you tomorrow!")
    logger.info("=" * 60)

    return all_findings


def send_digest_only():
    """Just send a digest of recent findings (no new research)."""
    logger.info("Sending digest of recent findings...")

    notion = NotionClient()
    research = ResearchEngine()
    email = EmailDigest()

    # Get recent findings from Notion
    findings = notion.get_recent_findings(days=1)

    if findings:
        car_description = f"{os.getenv('CAR_YEAR', '1968')} {os.getenv('CAR_MAKE', 'Chevrolet')} {os.getenv('CAR_MODEL', 'Chevelle SS 396')}"
        digest = research.generate_digest(findings, car_description)
        email.send_digest(digest)
        logger.info("Digest sent!")
    else:
        logger.info("No recent findings to digest")


def main():
    parser = argparse.ArgumentParser(
        description='GARRETT - Daily Research Agent for Classic Car Restoration'
    )
    parser.add_argument(
        '--test',
        action='store_true',
        help='Run in test mode (single query only)'
    )
    parser.add_argument(
        '--digest',
        action='store_true',
        help='Just send digest of recent findings'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='Run without storing to Notion or sending email'
    )

    args = parser.parse_args()

    if args.digest:
        send_digest_only()
    else:
        run_daily_research(test_mode=args.test)


if __name__ == '__main__':
    main()
