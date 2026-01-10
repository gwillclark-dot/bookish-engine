# Vibe Coding Examples

Real projects, vibe-coded from scratch. Each one demonstrates key principles.

## The Examples

### 01-quote-machine.js
**Time to build:** 5-10 minutes
**Vibe level:** 🌊 Beginner

A motivational quote CLI tool.

**What it teaches:**
- Start with hardcoded data (arrays are fine!)
- Make it work first, optimize never (or later)
- Single file = perfectly valid
- Comments can be casual and fun

**Run it:**
```bash
node 01-quote-machine.js
```

**Next vibes:**
- Add chalk for colors
- Fetch quotes from an API
- Save favorite quotes
- Daily quote feature

---

### 02-color-vibes.html
**Time to build:** 30-45 minutes
**Vibe level:** 🌊🌊 Intermediate

A random color palette generator. Single HTML file, no build step.

**What it teaches:**
- Single-file apps are totally valid
- Inline CSS/JS for small projects = fine
- Build UI first, make it pretty as you go
- Add features incrementally (started with colors, added copy-to-clipboard)

**Run it:**
```bash
# Just open it in a browser
open 02-color-vibes.html
# or
python -m http.server 8000
# then visit http://localhost:8000/02-color-vibes.html
```

**Next vibes:**
- Save palettes to localStorage
- Export as CSS variables
- Add color theory rules (complementary, triadic)
- Share palette via URL

---

### 03-vibe-tracker.py
**Time to build:** 45-60 minutes
**Vibe level:** 🌊🌊🌊 Intermediate+

Track your vibe coding sessions. A meta tool for tracking vibes!

**What it teaches:**
- CLI interfaces can be simple
- JSON file = database for small projects
- Add features as you need them
- Good enough > perfect

**Run it:**
```bash
chmod +x 03-vibe-tracker.py
./03-vibe-tracker.py
# or
python3 03-vibe-tracker.py
```

**Next vibes:**
- Add time tracking
- Tags for projects
- Export to markdown
- Graph of sessions over time

---

## The Vibe Coding Pattern

Notice the pattern in all these?

1. **Start with the core** (random colors, show quotes, save data)
2. **Make it work** (ugly is fine)
3. **Add one feature** (copy to clipboard, stats)
4. **Ship it** (it works, you're done)
5. **List "next vibes"** (but don't build them yet!)

That's vibe coding.

## Quick Start Template

Want to start your own vibe project? Use the template:

```bash
cp quick-start-template.js my-new-vibe.js
# Edit it and go!
```

## Your Turn

Pick one of these and modify it:
- Change the quotes to insults
- Make color vibes generate only dark/light colors
- Add emoji support to vibe tracker

Or build something completely new. The vibe is yours.
