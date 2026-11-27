# stylist
Handle global tokens and motion with a visual editor. Target css, shadcn or radix as destination and kickstart your UI styling in minutes

## What it does
Stylist sits above any design system. It defines what can be styled (colour, type, letter spacing, corners, shadows, focus and control heights, spacing, icons, motion, and brand assets), lets you tweak it with a live preview, and exports a package for **CSS**, **shadcn** or **Radix Themes**. Open the package again later to keep restyling: edits made in the app since are listed, and you can match, pin or revert each one.

## Using it with your app
Your app keeps its Stylist files in its own repo: `stylist.json` (your settings), `stylist-theme.css`, `app-tokens.css`, `stylist-icons.css`, `components.json` and `brand/`. Any AI assistant that can work in that repo and run commands (Claude, Codex, Cursor…), or you in a terminal, keeps them up to date.

### Style a new app
1. Design the style at https://g-ab.github.io/stylist/. Pick the app's library at the top of the panel: CSS, shadcn or Radix.
2. Share → **Send to your agent…**, then **Copy** or **Download file**.
3. Paste it in your app's AI chat: nothing else to type. (A downloaded file: attach it and say **"apply this"**.)

The setup's first line asks the AI to apply it and links to [APPLY.md](APPLY.md), the steps any AI follows: it gets Stylist and runs `export.py`, which adds the Stylist files and a Stylist section to the app's `AGENTS.md` (so "restyle the app" and "upgrade Stylist" work later, with any AI). Then it connects the app's styles to the tokens one area at a time (colours, corners, shadows, spacing…) without changing the layout. Logos you added in the Brand tab travel with it.

### Restyle an app
1. Load its current style: Share menu (or the Custom view) → **Open from GitHub…**, type the repo (e.g. `g-ab/cast`) or paste its link, then **Open**.
2. Change the style.
3. Share → **Send to your agent…**, then paste it in the app's AI chat (or attach the file and say **"apply this"**).

The AI runs `export.py` with your setup, shows which values changed, and commits. It stops if someone edited the theme file by hand, so nothing is overwritten.

**Logos:** only the ones you changed in Stylist travel with the setup; the app keeps the others as they are. The panel shows what's included. The export stops instead of overwriting if a logo arrived damaged or changed in the app since you loaded it. Very large logos (over 30 KB in total) don't fit: the panel says so, and you use Brand tab → **Download brand files** instead.

Stylist remembers the repo, so loading it again is one click. **Copy link** in that dialog gives an address that opens Stylist with the app already loaded. Public repos only, and only on the Stylist website. No repo? Share → **Open app style…** and pick the files yourself.

### Upgrade an app
1. In the app's AI chat, say **"upgrade Stylist"**.

The AI runs `export.py` with no new settings: the files are rewritten in Stylist's latest format and the app looks exactly the same. It tells you what's new, then commits.

### Without an AI
Run the same thing yourself from a copy of this repo:
```
python3 build.py
python3 export.py path/to/your-app setup.md   # style a new app, or restyle (setup.md = what you copied or downloaded)
python3 export.py path/to/your-app            # upgrade
```
For a new app, you then connect its styles to the tokens yourself.

### How your app's AI knows what to do
Requests like "restyle the app" only work because the app's instructions file explains them. `export.py` takes care of it: the first time, it adds a Stylist section to the app's `AGENTS.md` (read by most AI tools) and, if the app has no `CLAUDE.md`, creates one that points to it (Claude reads that name). Every later run refreshes that section, so it follows Stylist's updates. Your own notes in those files are never touched: only the part between the `stylist:start` and `stylist:end` markers. The text it adds: [templates/agents-block.md](templates/agents-block.md).

## Working on it
```
pip install -r requirements-dev.txt && python3 -m playwright install chromium
python3 build.py          # src/ → dist/index.html
python3 tests/run.py      # the checks; all must pass before publishing
python3 export.py APP_DIR [SETUP]   # style, restyle or upgrade an app from "Send to your agent"
```
`dist/index.html` is a single self-contained page; open it in a browser to try it locally.

See `CLAUDE.md` for the rules (publishing, compatibility) and `docs/interface.md` for how Stylist works and what it exports.
