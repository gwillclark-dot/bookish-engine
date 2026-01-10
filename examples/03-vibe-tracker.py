#!/usr/bin/env python3

"""
VIBE TRACKER - Track your vibe coding sessions

This is META: We're vibe coding a tool to track vibe coding.

VIBE JOURNEY:
1. Started with: "I want to log what I'm building"
2. First version: Just print to console
3. Added: Save to JSON file
4. Added: View history, stats
5. Could add: Tags, time tracking, graphs... LATER

Current state: Good enough to use. Ship it.
"""

import json
import os
from datetime import datetime
from pathlib import Path

VIBE_FILE = Path.home() / '.vibe-tracker.json'

def load_vibes():
    """Load vibe history from file"""
    if VIBE_FILE.exists():
        with open(VIBE_FILE, 'r') as f:
            return json.load(f)
    return []

def save_vibes(vibes):
    """Save vibes to file"""
    with open(VIBE_FILE, 'w') as f:
        json.dump(vibes, f, indent=2)

def add_vibe(project_name, description):
    """Log a new vibe coding session"""
    vibes = load_vibes()

    new_vibe = {
        'project': project_name,
        'description': description,
        'timestamp': datetime.now().isoformat(),
        'vibe_level': '🌊'  # All vibes are wave level
    }

    vibes.append(new_vibe)
    save_vibes(vibes)

    print(f"\n✨ Vibe logged: {project_name}")
    print(f"   {description}")
    print(f"   {new_vibe['vibe_level']} Keep the flow going!\n")

def view_vibes():
    """Show all vibe sessions"""
    vibes = load_vibes()

    if not vibes:
        print("\n📭 No vibes logged yet. Start coding something!\n")
        return

    print(f"\n🌊 Your Vibe Coding Journey ({len(vibes)} sessions)\n")
    print("=" * 60)

    for i, vibe in enumerate(reversed(vibes[-10:]), 1):
        date = datetime.fromisoformat(vibe['timestamp']).strftime('%Y-%m-%d %H:%M')
        print(f"\n{vibe['vibe_level']} {vibe['project']}")
        print(f"   {vibe['description']}")
        print(f"   {date}")

    print("\n" + "=" * 60)
    print(f"Total projects vibe-coded: {len(vibes)}")
    print()

def show_stats():
    """Show vibe stats"""
    vibes = load_vibes()

    if not vibes:
        print("\n📊 No stats yet. Log your first vibe!\n")
        return

    projects = {}
    for vibe in vibes:
        project = vibe['project']
        projects[project] = projects.get(project, 0) + 1

    print("\n📊 Vibe Stats\n")
    print("=" * 60)
    print(f"Total sessions: {len(vibes)}")
    print(f"Unique projects: {len(projects)}")
    print(f"\nMost vibe-coded project: {max(projects, key=projects.get)}")
    print("=" * 60)
    print()

def main():
    """Main CLI interface"""
    print("\n🌊 VIBE TRACKER 🌊\n")
    print("1. Log a new vibe")
    print("2. View vibe history")
    print("3. Show stats")
    print("4. Exit")

    choice = input("\nWhat's the vibe? (1-4): ").strip()

    if choice == '1':
        project = input("Project name: ").strip()
        description = input("What are you building? ").strip()
        add_vibe(project, description)
    elif choice == '2':
        view_vibes()
    elif choice == '3':
        show_stats()
    elif choice == '4':
        print("\n✌️ Keep coding, keep vibing!\n")
    else:
        print("\n❌ Invalid choice. Try again!\n")
        main()

if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n✌️ Vibe interrupted. That's cool too.\n")

"""
WHAT WE LEARNED FROM VIBE CODING THIS:

✅ Started simple (just print statements)
✅ Added features as needed (file storage, stats)
✅ Used simple data structures (JSON, not a database)
✅ Made it functional, not perfect
✅ Shipped it when it was "good enough"

WHAT WE DIDN'T DO:

❌ Plan every feature upfront
❌ Use a "proper" database
❌ Write tests (maybe later if we actually use this)
❌ Make it configurable for 100 edge cases
❌ Overthink the UI/UX

RESULT: A working tool in ~30-45 mins that actually does the thing.
That's vibe coding.
"""
