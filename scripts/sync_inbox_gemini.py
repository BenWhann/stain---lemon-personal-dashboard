"""
Lemon & Stain - Gemini Inbox & Text Scanner CLI
------------------------------------------------
A CLI tool to test or run Gemini action item extraction and push tasks
directly to your Lemon & Stain dashboard.

Usage:
  # 1. Test extraction on a snippet of text:
  python scripts/sync_inbox_gemini.py --text "Aretta, please review the thesis draft by Friday Nov 20 and email your notes."

  # 2. Extract from an email or notes file:
  python scripts/sync_inbox_gemini.py --file email.txt

  # 3. Dry-run without saving to database:
  python scripts/sync_inbox_gemini.py --text "Remember to pay electric bill on Monday" --dry-run
"""

import argparse
import json
import os
import sys
import httpx

DEFAULT_API_URL = os.environ.get("DASHBOARD_URL", "http://localhost:8000")
DEFAULT_KEY = os.environ.get("INTEGRATION_KEY", "")


def scan_text(
    content: str,
    api_url: str = DEFAULT_API_URL,
    integration_key: str = DEFAULT_KEY,
    gemini_key: str = None,
    dry_run: bool = False,
    context: str = "CLI Scan",
):
    url = f"{api_url.rstrip('/')}/api/integrations/extract-task"
    headers = {
        "Content-Type": "application/json",
        "X-Requested-With": "lemon-stain",
    }
    if integration_key:
        headers["X-Integration-Key"] = integration_key

    payload = {
        "content": content,
        "context": context,
        "auto_save": not dry_run,
        "source": "Gemini CLI",
    }
    if gemini_key:
        payload["api_key"] = gemini_key

    print(f"Sending text ({len(content)} chars) to {url}...")
    try:
        with httpx.Client(timeout=45.0) as client:
            resp = client.post(url, json=payload, headers=headers)
    except Exception as exc:
        print(f"Error connecting to dashboard: {exc}")
        sys.exit(1)

    if resp.status_code != 200:
        print(f"Extraction failed [{resp.status_code}]: {resp.text}")
        sys.exit(1)

    data = resp.json()
    print("\n--- Gemini Extraction Result ---")
    print(f"Action items found: {data.get('has_action_items')}")
    print(f"Summary: {data.get('summary')}")
    tasks = data.get("extracted_tasks", [])
    print(f"Total tasks extracted: {len(tasks)}")

    for idx, t in enumerate(tasks, 1):
        print(f"\nTask {idx}:")
        print(f"  Title:    {t.get('title')}")
        print(f"  Category: {t.get('category')}")
        print(f"  Priority: {t.get('priority')}")
        print(f"  Due Date: {t.get('due_date') or 'None'}")
        if t.get("subtasks"):
            print(f"  Steps:    {', '.join(t.get('subtasks'))}")
        if t.get("notes"):
            print(f"  Notes:    {t.get('notes')[:120]}...")

    if not dry_run and data.get("saved_tasks"):
        print(f"\n Successfully saved {len(data['saved_tasks'])} task(s) into your dashboard!")
    elif dry_run:
        print("\n [Dry Run] No tasks were saved to the database.")


def main():
    parser = argparse.ArgumentParser(description="Lemon & Stain Gemini Task Extractor")
    parser.add_argument("--text", "-t", type=str, help="Text or email snippet to analyze")
    parser.add_argument("--file", "-f", type=str, help="Path to text or email file to analyze")
    parser.add_argument("--api-url", default=DEFAULT_API_URL, help=f"Dashboard base URL (default: {DEFAULT_API_URL})")
    parser.add_argument("--key", default=DEFAULT_KEY, help="X-Integration-Key for authentication")
    parser.add_argument("--gemini-key", default=os.environ.get("GEMINI_API_KEY"), help="Gemini API Key override")
    parser.add_argument("--dry-run", action="store_true", help="Extract without saving into database")

    args = parser.parse_args()

    content = ""
    if args.text:
        content = args.text
    elif args.file:
        with open(args.file, "r", encoding="utf-8") as f:
            content = f.read()
    else:
        print("Please provide either --text \"...\" or --file <path>.")
        sys.exit(1)

    scan_text(
        content=content,
        api_url=args.api_url,
        integration_key=args.key,
        gemini_key=args.gemini_key,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
