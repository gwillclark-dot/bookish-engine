"""
Research Engine for Garrett

Handles:
- Generating smart research queries with Claude
- Web search via SerpAPI
- Analyzing search results for relevance
- Extracting key information (parts, prices, techniques)
- Generating daily digest
"""

import os
import re
import logging
import time
from typing import Optional

import requests
from anthropic import Anthropic

logger = logging.getLogger('garrett.research')


class ResearchEngine:
    """Handles research queries, web search, and AI analysis."""

    def __init__(self):
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not set in environment")

        self.claude = Anthropic(api_key=api_key)
        self.serpapi_key = os.getenv('SERPAPI_KEY')

        # Model to use for research (Haiku for speed/cost, Sonnet for quality)
        self.model = 'claude-sonnet-4-20250514'

    def generate_queries(
        self,
        car_description: str,
        projects: list,
        max_queries: int = 3,
        exclude: list = None
    ) -> list:
        """
        Use Claude to generate specific research queries based on current projects.

        Args:
            car_description: e.g. "1968 Chevrolet Chevelle SS 396"
            projects: List of current project dicts with name, status, notes
            max_queries: Maximum number of queries to generate
            exclude: List of previously researched queries to avoid

        Returns:
            List of search query strings
        """
        exclude = exclude or []

        # Format projects for the prompt
        project_list = "\n".join([
            f"- {p['name']} ({p.get('status', 'Unknown')}): {p.get('notes', 'No notes')}"
            for p in projects
        ])

        # Format exclusions
        exclude_text = ""
        if exclude:
            exclude_text = f"""

Previously researched queries (AVOID similar topics):
{chr(10).join('- ' + q for q in exclude[-20:])}
"""

        prompt = f"""You are a research assistant helping restore a classic car: {car_description}

Current restoration projects:
{project_list}
{exclude_text}

Generate {max_queries} specific, actionable research queries that would help with these projects.

Focus on:
- Specific part numbers and sourcing
- Technical procedures and torque specs
- Common problems and solutions
- Vendor comparisons and pricing
- Forum discussions with real-world experience
- Factory specifications and documentation

Format: Return ONLY the queries, one per line. No numbering, no explanations.
Make queries specific enough to find useful results (include year, part names, etc.)

Example good queries:
- 1968 Chevelle SS 396 L78 engine rebuild torque specifications
- GM part number 3917291 intake manifold identification
- Best vendors for 1968 Chevelle weatherstripping reproduction

Example bad queries (too vague):
- Chevelle parts
- how to restore a car
- engine specs"""

        try:
            response = self.claude.messages.create(
                model=self.model,
                max_tokens=500,
                messages=[{'role': 'user', 'content': prompt}]
            )

            # Parse response into individual queries
            text = response.content[0].text
            queries = [
                line.strip()
                for line in text.strip().split('\n')
                if line.strip() and not line.strip().startswith('-')
            ]

            # If lines started with -, strip them
            if not queries:
                queries = [
                    line.strip().lstrip('- ').lstrip('* ')
                    for line in text.strip().split('\n')
                    if line.strip()
                ]

            return queries[:max_queries]

        except Exception as e:
            logger.error(f"Error generating queries: {e}")
            # Fallback queries
            return [f"{car_description} restoration tips and part sources"]

    def search_web(self, query: str) -> list:
        """
        Search the web using SerpAPI.

        Returns list of results with: title, link, snippet
        """
        if not self.serpapi_key:
            logger.warning("SERPAPI_KEY not set - using mock results")
            return self._mock_search(query)

        params = {
            'api_key': self.serpapi_key,
            'q': query,
            'engine': 'google',
            'num': 10,
            # Focus on restoration forums and parts sites
            'gl': 'us',
            'hl': 'en'
        }

        for attempt in range(3):
            try:
                response = requests.get(
                    'https://serpapi.com/search',
                    params=params,
                    timeout=30
                )

                if response.status_code == 429:
                    wait_time = 2 ** attempt
                    logger.warning(f"Rate limited, waiting {wait_time}s...")
                    time.sleep(wait_time)
                    continue

                response.raise_for_status()
                data = response.json()

                # Extract organic results
                results = []
                for item in data.get('organic_results', []):
                    results.append({
                        'title': item.get('title', ''),
                        'link': item.get('link', ''),
                        'snippet': item.get('snippet', ''),
                        'source': item.get('displayed_link', '')
                    })

                return results

            except requests.exceptions.RequestException as e:
                if attempt < 2:
                    time.sleep(2 ** attempt)
                    continue
                logger.error(f"Search failed: {e}")
                return []

        return []

    def _mock_search(self, query: str) -> list:
        """Return mock search results for testing without API key."""
        return [
            {
                'title': f'Mock Result 1 for: {query}',
                'link': 'https://example.com/result1',
                'snippet': 'This is a mock search result for testing purposes.',
                'source': 'example.com'
            },
            {
                'title': f'Mock Result 2 for: {query}',
                'link': 'https://example.com/result2',
                'snippet': 'Another mock result with some restoration info.',
                'source': 'example.com'
            }
        ]

    def analyze_result(
        self,
        query: str,
        result: dict,
        car_description: str
    ) -> Optional[dict]:
        """
        Use Claude to analyze a search result for relevance and extract key info.

        Args:
            query: The original search query
            result: Search result dict with title, link, snippet
            car_description: The car being researched

        Returns:
            Dict with: relevant (bool), title, summary, category, tags,
                       part_number, price, vendor, key_info, source_url
        """
        prompt = f"""Analyze this search result for relevance to restoring a {car_description}.

Search query: {query}

Result:
Title: {result.get('title', '')}
URL: {result.get('link', '')}
Snippet: {result.get('snippet', '')}
Source: {result.get('source', '')}

Determine:
1. Is this result relevant and useful for the restoration? (yes/no)
2. What category does it fit? (Parts, Techniques, Forum Discussion, Documentation, Vendor, Other)
3. Extract any part numbers mentioned (GM casting numbers, vendor SKUs, etc.)
4. Extract any prices mentioned
5. Identify the vendor/source if it's a parts listing
6. Summarize the key useful information in 2-3 sentences
7. List 2-3 relevant tags for categorization

Respond in this exact JSON format:
{{
    "relevant": true/false,
    "category": "Parts|Techniques|Forum Discussion|Documentation|Vendor|Other",
    "part_number": "extracted part number or null",
    "price": "extracted price or null",
    "vendor": "vendor name or null",
    "summary": "2-3 sentence summary of useful info",
    "key_info": ["key point 1", "key point 2"],
    "tags": ["tag1", "tag2", "tag3"]
}}

If the result is not relevant (spam, unrelated content, broken link indicators), set relevant to false and provide minimal other fields."""

        try:
            response = self.claude.messages.create(
                model=self.model,
                max_tokens=500,
                messages=[{'role': 'user', 'content': prompt}]
            )

            text = response.content[0].text

            # Extract JSON from response (handle markdown code blocks)
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                import json
                analysis = json.loads(json_match.group())

                # Add source URL
                analysis['source_url'] = result.get('link', '')
                analysis['title'] = result.get('title', 'Untitled')

                return analysis

        except Exception as e:
            logger.error(f"Error analyzing result: {e}")

        return None

    def generate_digest(self, findings: list, car_description: str) -> dict:
        """
        Generate a daily digest summarizing all findings.

        Returns dict with: subject, html_body, text_body
        """
        if not findings:
            return {
                'subject': f'Garrett: No new findings for your {car_description}',
                'html_body': '<p>No new relevant information found today.</p>',
                'text_body': 'No new relevant information found today.'
            }

        # Group findings by category
        by_category = {}
        for f in findings:
            cat = f.get('category', 'Other')
            if cat not in by_category:
                by_category[cat] = []
            by_category[cat].append(f)

        # Build summary prompt
        findings_text = ""
        for cat, items in by_category.items():
            findings_text += f"\n## {cat}\n"
            for item in items:
                findings_text += f"- {item.get('title', 'Untitled')}: {item.get('summary', 'No summary')}\n"
                if item.get('part_number'):
                    findings_text += f"  Part #: {item['part_number']}\n"
                if item.get('price'):
                    findings_text += f"  Price: {item['price']}\n"

        prompt = f"""Create a friendly, concise daily digest email for a classic car enthusiast restoring a {car_description}.

Today's findings:
{findings_text}

Write:
1. A catchy email subject line (include the date and car)
2. A brief HTML email body that:
   - Opens with a friendly greeting
   - Summarizes the most important findings
   - Highlights any parts or deals found
   - Groups information logically
   - Includes source links
   - Ends with an encouraging sign-off from "Garrett"

Keep it scannable - use bullet points, bold for important items, and short paragraphs.
The tone should be helpful and enthusiastic, like a knowledgeable car buddy."""

        try:
            response = self.claude.messages.create(
                model=self.model,
                max_tokens=1500,
                messages=[{'role': 'user', 'content': prompt}]
            )

            text = response.content[0].text

            # Extract subject and body
            # Look for subject line
            subject_match = re.search(r'Subject:?\s*(.+?)(?:\n|$)', text, re.IGNORECASE)
            subject = subject_match.group(1).strip() if subject_match else f"Garrett: Daily Research Digest - {car_description}"

            # The rest is the body
            html_body = text
            if subject_match:
                html_body = text[subject_match.end():].strip()

            # Convert to basic HTML if not already
            if '<html>' not in html_body.lower():
                # Convert markdown-ish to HTML
                html_body = html_body.replace('\n\n', '</p><p>')
                html_body = html_body.replace('\n- ', '</li><li>')
                html_body = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', html_body)
                html_body = f'<html><body style="font-family: sans-serif;"><p>{html_body}</p></body></html>'

            return {
                'subject': subject,
                'html_body': html_body,
                'text_body': text  # Plain text version
            }

        except Exception as e:
            logger.error(f"Error generating digest: {e}")
            # Fallback simple digest
            return {
                'subject': f'Garrett: Found {len(findings)} items for your {car_description}',
                'html_body': f'<p>Found {len(findings)} new items today. Check Notion for details.</p>',
                'text_body': f'Found {len(findings)} new items today. Check Notion for details.'
            }


# Quick test
if __name__ == '__main__':
    from dotenv import load_dotenv
    load_dotenv()

    engine = ResearchEngine()

    print("Testing query generation...")
    queries = engine.generate_queries(
        car_description="1968 Chevrolet Chevelle SS 396",
        projects=[
            {'name': 'Engine Rebuild', 'status': 'In Progress', 'notes': 'Rebuilding the 396 big block'},
            {'name': 'Interior', 'status': 'Planning', 'notes': 'Need new door panels and carpet'}
        ],
        max_queries=3
    )

    print("Generated queries:")
    for q in queries:
        print(f"  - {q}")

    print("\nTesting web search...")
    if queries:
        results = engine.search_web(queries[0])
        print(f"Found {len(results)} results")
        for r in results[:3]:
            print(f"  - {r['title'][:50]}...")
