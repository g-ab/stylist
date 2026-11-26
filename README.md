# stylist
Handle global tokens and motion with a visual editor. Target css, shadcn or radix as destination and kickstart your UI styling in minutes

**Use it:** https://g-ab.github.io/stylist/

## What it does
Stylist sits above any design system. It defines what can be styled (colour, type, letter spacing, corners, shadows, focus and control heights, spacing, icons, motion, and brand assets), lets you tweak it with a live preview, and exports a package for **CSS**, **shadcn** or **Radix Themes**. Open the package again later to keep restyling: edits made in the app since are listed, and you can match, pin or revert each one.

## Using it with your app
Your app keeps its Stylist files in its own repo: `stylist.json` (your settings), `stylist-theme.css`, `app-tokens.css`, `stylist-icons.css`, `components.json` and `brand/`. An AI assistant with access to that repo, or you in a terminal, keeps them up to date.

**Restyle the app**
1. Change the style at https://g-ab.github.io/stylist/.
2. Share → **Copy setup for Claude**.
3. Paste it in your app's AI chat and say **"restyle the app"**.

The AI runs `export.py` with your setup, shows which values changed, and commits. It stops if someone edited the theme file by hand, so nothing is overwritten.

**Upgrade the app to the latest Stylist**
1. In your app's AI chat, say **"upgrade Stylist"**.

The AI runs `export.py` with no new settings: the files are rewritten in the latest format and the app looks exactly the same. It tells you what's new, then commits.

**Without an AI**, run the same thing yourself from a copy of this repo:
```
python3 build.py
python3 export.py path/to/your-app            # upgrade
python3 export.py path/to/your-app setup.txt  # restyle, setup.txt = what you copied
```

**Teach your app's AI these commands.** The words only work if the app's instructions file says what to do. Paste this into its `CLAUDE.md` (Claude) or `AGENTS.md` (most other AI tools):
```
## Stylist
This app's look comes from Stylist (https://github.com/g-ab/stylist). Its files: stylist.json,
stylist-theme.css (generated: never edit by hand), app-tokens.css, stylist-icons.css, components.json, brand/.
To run Stylist: clone it, run `python3 build.py`, and have playwright + Chromium installed.
- "restyle the app" + a pasted Stylist setup: save the setup to a file, run
  `python3 <stylist>/export.py <this repo> <that file>`.
- "upgrade Stylist": run `python3 <stylist>/export.py <this repo>` (no setup).
If it stops (exit code 2), the theme was edited by hand: show the list and stop. Otherwise show the
"Changed tokens" list, check the app in light and dark mode, and commit (one restyle or upgrade per commit).
```

## Working on it
```
pip install -r requirements-dev.txt && python3 -m playwright install chromium
python3 build.py          # src/ → dist/index.html
python3 tests/run.py      # the checks; all must pass before publishing
python3 export.py APP_DIR [SETUP]   # restyle an app's files from a pasted "Copy setup for Claude"
```
`dist/index.html` is a single self-contained page; open it in a browser to try it locally.

See `CLAUDE.md` for the rules (publishing, compatibility) and `docs/interface.md` for how Stylist works and what it exports.
