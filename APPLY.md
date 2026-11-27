# Applying a Stylist setup

For AI assistants and agents (and people in a terminal). A **Stylist setup** is a message or a `.md` file that
starts with "Apply this Stylist setup to <app>". It holds the app's style settings as JSON, and sometimes logos
changed in Stylist after it. Applying it means writing the app's Stylist files from it.

## Steps
1. **Get Stylist:** clone https://github.com/g-ab/stylist and run `python3 build.py` in it.
   Needs Python 3, `pip install playwright` and `python3 -m playwright install chromium`
   (or an installed Chrome, with `STYLIST_CHROME=/path/to/chrome`).
2. **Save the setup** to a file exactly as it is (a pasted message: save it verbatim; an attached file: use it as is).
3. **Run** `python3 <stylist>/export.py <app folder> <setup file>` (the app folder is usually the repo root).
4. **Read what it printed** and act on it:
   - **Exit code 0, app already styled:** it lists every token value that changed and the files it updated.
     Check the app in light and dark mode, show the user the "Changed tokens" list, then commit
     (one restyle per commit, the list in the message).
   - **Exit code 0, first time** (the app had no `stylist.json`): it added the Stylist files and a Stylist
     section to the app's `AGENTS.md`. Then connect the app to them, below.
   - **Exit code 2:** something in the app changed since the setup was made (the theme file edited by hand,
     a logo replaced), or a logo arrived damaged. Show the message to the user and stop. Never overwrite.
     They resolve it in Stylist (Share → Open from GitHub…) and send a new setup.
   - **"Removed in Stylist":** those logos were removed in Stylist but are still in the app. Ask before deleting.

## First time: connecting the app
1. Load the files before the app's own styles, in this order: `stylist-theme.css`, `app-tokens.css`,
   `stylist-icons.css`, then `brand/brand.css` if there is one.
2. Switch the app's styles to the tokens **one area per commit**, without changing its layout:
   colours, corners (`--radius-*`), shadows (`--shadow-*`), control heights (`--control-*`, `--bar`),
   spacing (`--space-*`, `--gap`), focus (`--focus-ring`), letter spacing (`letter-spacing: var(--tracking)` on body),
   motion (`--motion-*`, `--ease-*`), icons, logos.
3. Values the app needs that aren't Stylist's (a brand colour for one feature, say) go in `app-tokens.css`.
   Never edit `stylist-theme.css` by hand: it's regenerated.
4. With shadcn or Radix, the theme file uses the library's own variable names: import it after the library's styles.

## Other requests
- **"upgrade Stylist":** run `python3 <stylist>/export.py <app folder>` with no setup. The look must not change:
  if it lists changed tokens, show them before committing.
- **A brand .zip** (Stylist's "Download brand files"): replace the files in the app's `brand/` with it.
