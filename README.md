# stylist
Handle global tokens and motion with a visual editor. Target css, shadcn or radix as destination and kickstart your UI styling in minutes



## What it does
Stylist sits above any design system. It defines what can be styled (colour, type, letter spacing, corners, shadows, focus and control heights, spacing, icons, motion, and brand assets), lets you tweak it with a live preview, and exports a package for **CSS**, **shadcn** or **Radix Themes**. Open the package again later to keep restyling: edits made in the app since are listed, and you can match, pin or revert each one.

## Working on it
```
pip install -r requirements-dev.txt && python3 -m playwright install chromium
python3 build.py          # src/ → dist/index.html
python3 tests/run.py      # the checks; all must pass before publishing
python3 export.py APP_DIR [SETUP]   # restyle an app's files from a pasted "Copy setup for Claude"
```
`dist/index.html` is a single self-contained page; open it in a browser to try it locally.

See `CLAUDE.md` for the rules (publishing, compatibility) and `docs/interface.md` for how Stylist works and what it exports.
