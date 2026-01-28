"""
Notion Client for Garrett Research Agent

Handles all interactions with Notion databases:
- Current Projects: Read what you're working on
- Research Findings: Store what Garrett discovers
- Parts Wishlist: Track parts with numbers/prices
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional

import requests

logger = logging.getLogger('garrett.notion')

# Notion API base URL
NOTION_API_URL = 'https://api.notion.com/v1'
NOTION_VERSION = '2022-06-28'


class NotionClient:
    """Client for interacting with Notion databases."""

    def __init__(self):
        self.api_key = os.getenv('NOTION_API_KEY')
        if not self.api_key:
            raise ValueError("NOTION_API_KEY not set in environment")

        self.research_db = os.getenv('NOTION_RESEARCH_DB')
        self.parts_db = os.getenv('NOTION_PARTS_DB')
        self.projects_db = os.getenv('NOTION_PROJECTS_DB')

        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'Notion-Version': NOTION_VERSION
        }

    def _request(self, method: str, endpoint: str, data: dict = None) -> dict:
        """Make a request to the Notion API with retry logic."""
        url = f"{NOTION_API_URL}/{endpoint}"

        for attempt in range(3):
            try:
                if method == 'GET':
                    response = requests.get(url, headers=self.headers, timeout=30)
                elif method == 'POST':
                    response = requests.post(url, headers=self.headers, json=data, timeout=30)
                elif method == 'PATCH':
                    response = requests.patch(url, headers=self.headers, json=data, timeout=30)
                else:
                    raise ValueError(f"Unsupported method: {method}")

                # Handle rate limiting
                if response.status_code == 429:
                    retry_after = int(response.headers.get('Retry-After', 2 ** attempt))
                    logger.warning(f"Rate limited, waiting {retry_after}s...")
                    import time
                    time.sleep(retry_after)
                    continue

                response.raise_for_status()
                return response.json()

            except requests.exceptions.RequestException as e:
                if attempt < 2:
                    import time
                    time.sleep(2 ** attempt)
                    continue
                raise

        return {}

    def get_current_projects(self) -> list:
        """
        Fetch current active projects from Notion.

        Returns list of dicts with: name, status, priority, notes
        """
        if not self.projects_db:
            logger.warning("NOTION_PROJECTS_DB not configured")
            return []

        # Query for active projects (not completed)
        query = {
            'filter': {
                'property': 'Status',
                'status': {
                    'does_not_equal': 'Completed'
                }
            },
            'sorts': [
                {
                    'property': 'Priority',
                    'direction': 'ascending'
                }
            ]
        }

        try:
            result = self._request('POST', f'databases/{self.projects_db}/query', query)
            projects = []

            for page in result.get('results', []):
                props = page.get('properties', {})

                # Extract project details
                project = {
                    'id': page['id'],
                    'name': self._get_title(props.get('Project Name', props.get('Name', {}))),
                    'status': self._get_status(props.get('Status', {})),
                    'priority': self._get_select(props.get('Priority', {})),
                    'notes': self._get_rich_text(props.get('Notes', {}))
                }
                projects.append(project)

            return projects

        except Exception as e:
            logger.error(f"Error fetching projects: {e}")
            return []

    def add_research_finding(self, finding: dict) -> Optional[str]:
        """
        Add a research finding to the Research Findings database.

        Args:
            finding: dict with title, category, source_url, summary, tags

        Returns:
            Page ID if successful, None otherwise
        """
        if not self.research_db:
            logger.warning("NOTION_RESEARCH_DB not configured")
            return None

        # Build the page properties
        properties = {
            'Title': {
                'title': [{'text': {'content': finding.get('title', 'Untitled Finding')[:100]}}]
            },
            'Category': {
                'select': {'name': finding.get('category', 'General')}
            },
            'Date Found': {
                'date': {'start': datetime.now().isoformat()}
            },
            'Source': {
                'url': finding.get('source_url', '')
            },
            'Status': {
                'status': {'name': 'New'}
            }
        }

        # Add tags if present
        if finding.get('tags'):
            properties['Tags'] = {
                'multi_select': [{'name': tag} for tag in finding['tags'][:5]]
            }

        # Create the page with content
        page_data = {
            'parent': {'database_id': self.research_db},
            'properties': properties,
            'children': [
                {
                    'object': 'block',
                    'type': 'heading_2',
                    'heading_2': {
                        'rich_text': [{'text': {'content': 'Summary'}}]
                    }
                },
                {
                    'object': 'block',
                    'type': 'paragraph',
                    'paragraph': {
                        'rich_text': [{'text': {'content': finding.get('summary', '')[:2000]}}]
                    }
                }
            ]
        }

        # Add key information if present
        if finding.get('key_info'):
            # Add heading
            page_data['children'].append({
                'object': 'block',
                'type': 'heading_2',
                'heading_2': {
                    'rich_text': [{'text': {'content': 'Key Information'}}]
                }
            })
            # Add bullet points for each key info item
            for info in finding['key_info'][:10]:
                page_data['children'].append({
                    'object': 'block',
                    'type': 'bulleted_list_item',
                    'bulleted_list_item': {
                        'rich_text': [{'text': {'content': info[:2000]}}]
                    }
                })

        # Add part number if found
        if finding.get('part_number'):
            page_data['children'].append({
                'object': 'block',
                'type': 'callout',
                'callout': {
                    'rich_text': [{'text': {'content': f"Part Number: {finding['part_number']}"}}],
                    'icon': {'emoji': '🔧'}
                }
            })

        try:
            result = self._request('POST', 'pages', page_data)
            return result.get('id')
        except Exception as e:
            logger.error(f"Error adding finding: {e}")
            return None

    def add_to_wishlist(self, finding: dict) -> Optional[str]:
        """
        Add a part to the Parts Wishlist database.

        Args:
            finding: dict with title, part_number, vendor, price, source_url
        """
        if not self.parts_db:
            logger.warning("NOTION_PARTS_DB not configured")
            return None

        properties = {
            'Part Name': {
                'title': [{'text': {'content': finding.get('title', 'Unknown Part')[:100]}}]
            },
            'Priority': {
                'select': {'name': 'Medium'}
            }
        }

        # Add optional fields if present
        if finding.get('part_number'):
            properties['Part Number'] = {
                'rich_text': [{'text': {'content': finding['part_number']}}]
            }

        if finding.get('vendor'):
            properties['Vendor'] = {
                'rich_text': [{'text': {'content': finding['vendor']}}]
            }

        if finding.get('price'):
            # Try to parse price as number
            try:
                price_str = finding['price'].replace('$', '').replace(',', '').strip()
                price = float(price_str)
                properties['Price'] = {'number': price}
            except (ValueError, AttributeError):
                pass

        if finding.get('source_url'):
            properties['URL'] = {'url': finding['source_url']}

        page_data = {
            'parent': {'database_id': self.parts_db},
            'properties': properties
        }

        try:
            result = self._request('POST', 'pages', page_data)
            return result.get('id')
        except Exception as e:
            logger.error(f"Error adding to wishlist: {e}")
            return None

    def get_recent_findings(self, days: int = 1) -> list:
        """Get findings from the last N days."""
        if not self.research_db:
            return []

        cutoff = (datetime.now() - timedelta(days=days)).isoformat()

        query = {
            'filter': {
                'property': 'Date Found',
                'date': {
                    'on_or_after': cutoff
                }
            },
            'sorts': [
                {'property': 'Date Found', 'direction': 'descending'}
            ]
        }

        try:
            result = self._request('POST', f'databases/{self.research_db}/query', query)
            findings = []

            for page in result.get('results', []):
                props = page.get('properties', {})
                findings.append({
                    'title': self._get_title(props.get('Title', {})),
                    'category': self._get_select(props.get('Category', {})),
                    'source_url': props.get('Source', {}).get('url', ''),
                    'tags': self._get_multi_select(props.get('Tags', {}))
                })

            return findings

        except Exception as e:
            logger.error(f"Error fetching recent findings: {e}")
            return []

    def check_duplicate(self, source_url: str) -> bool:
        """Check if a URL has already been stored."""
        if not self.research_db or not source_url:
            return False

        query = {
            'filter': {
                'property': 'Source',
                'url': {
                    'equals': source_url
                }
            }
        }

        try:
            result = self._request('POST', f'databases/{self.research_db}/query', query)
            return len(result.get('results', [])) > 0
        except Exception:
            return False

    # Property extraction helpers
    def _get_title(self, prop: dict) -> str:
        """Extract title text from a title property."""
        title_list = prop.get('title', [])
        if title_list:
            return title_list[0].get('plain_text', '')
        return ''

    def _get_rich_text(self, prop: dict) -> str:
        """Extract text from a rich_text property."""
        rich_text = prop.get('rich_text', [])
        if rich_text:
            return rich_text[0].get('plain_text', '')
        return ''

    def _get_select(self, prop: dict) -> str:
        """Extract value from a select property."""
        select = prop.get('select')
        if select:
            return select.get('name', '')
        return ''

    def _get_status(self, prop: dict) -> str:
        """Extract value from a status property."""
        status = prop.get('status')
        if status:
            return status.get('name', '')
        return ''

    def _get_multi_select(self, prop: dict) -> list:
        """Extract values from a multi_select property."""
        multi = prop.get('multi_select', [])
        return [item.get('name', '') for item in multi]


# Quick test
if __name__ == '__main__':
    from dotenv import load_dotenv
    load_dotenv()

    client = NotionClient()
    print("Testing Notion connection...")

    projects = client.get_current_projects()
    print(f"Found {len(projects)} projects:")
    for p in projects:
        print(f"  - {p['name']}: {p['status']}")
