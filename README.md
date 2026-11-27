# stylist
Handle global tokens and motion with a visual editor. Target css, shadcn or radix as destination and kickstart your UI styling in minutes

## What it does
Stylist sits above any design system. It defines what can be styled (colour, type, letter spacing, corners, shadows, focus and control heights, spacing, icons, motion, and brand assets), lets you tweak it with a live preview, and exports a package for **CSS**, **shadcn** or **Radix Themes**. Open the package again later to keep restyling: edits made in the app since are listed, and you can match, pin or revert each one.

## Using it with your app
Your app keeps its Stylist files in its own repo: `stylist.json` (your settings), `stylist-theme.css`, `app-tokens.css`, `stylist-icons.css`, `components.json` and `brand/`. Any AI assistant that can work in that repo and run commands (Claude, Codex, Cursor…), or you in a terminal, keeps them up to date.

### Style a new app
1. Design the style at https://g-ab.github.io/stylist/. Pick the app's library at the top of the panel: No library, shadcn or Radix.
2. Share → **Copy setup for AI**.
3. Paste it in your app's AI chat and say **"style this app with Stylist"**.
4. Add the block from [Teach your app's AI](#teach-your-apps-ai) to the app's `AGENTS.md` or `CLAUDE.md`, so restyling and upgrading work later.

The setup explains itself, so any AI can follow it: it gets Stylist and runs `export.py`, which adds the Stylist files. Then it connects the app's styles to the tokens one area at a time (colours, corners, shadows, spacing…) without changing the layout. Logos aren't in the setup: for those, Share → **Export package** and give the AI its `brand/` folder.

### Restyle an app
1. Load its current style: Share menu (or the Custom view) → **Open from GitHub…**, type the repo (e.g. `g-ab/cast`) or paste its link, then **Open**.
2. Change the style.
3. Share → **Copy setup for AI**, paste it in the app's AI chat and say **"restyle the app"**.

The AI runs `export.py` with your setup, shows which values changed, and commits. It stops if someone edited the theme file by hand, so nothing is overwritten.

Stylist remembers the repo, so loading it again is one click. **Copy link** in that dialog gives an address that opens Stylist with the app already loaded. Public repos only, and only on the Stylist website. No repo? Share → **Open app style…** and pick the files yourself.

### Upgrade an app
1. In the app's AI chat, say **"upgrade Stylist"**.

The AI runs `export.py` with no new settings: the files are rewritten in Stylist's latest format and the app looks exactly the same. It tells you what's new, then commits.

### Without an AI
Run the same thing yourself from a copy of this repo:
```
python3 build.py
python3 export.py path/to/your-app setup.txt  # style a new app, or restyle (setup.txt = what you copied)
python3 export.py path/to/your-app            # upgrade
```
For a new app, you then connect its styles to the tokens yourself.

### Teach your app's AI
The words only work if the app's instructions file says what to do. Paste this into its `AGENTS.md` (most AI tools) or `CLAUDE.md` (Claude):
```
## Stylist
This app's look comes from Stylist (https://github.com/g-ab/stylist). Its files: stylist.json,
stylist-theme.css (generated: never edit by hand), app-tokens.css, stylist-icons.css, components.json, brand/.
To run Stylist: clone it, run `python3 build.py`, and have playwright + Chromium installed.
- "restyle the app" + a pasted Stylist setup: save the setup to a file, run
  `python3 <stylist>/export.py <this repo> <that file>`.
- "upgrade Stylist": run `python3 <stylist>/export.py <this repo>` (no setup). The look must not change.
If it stops (exit code 2), the theme was edited by hand: show the list and stop. Otherwise show the
"Changed tokens" list, check the app in light and dark mode, and commit (one restyle or upgrade per commit).
```

## Working on it
```
pip install -r requirements-dev.txt && python3 -m playwright install chromium
python3 build.py          # src/ → dist/index.html
python3 tests/run.py      # the checks; all must pass before publishing
python3 export.py APP_DIR [SETUP]   # style, restyle or upgrade an app from a pasted "Copy setup for AI"
```
`dist/index.html` is a single self-contained page; open it in a browser to try it locally.

See `CLAUDE.md` for the rules (publishing, compatibility) and `docs/interface.md` for how Stylist works and what it exports.
