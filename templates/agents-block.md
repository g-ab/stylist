## Stylist
This app's look comes from Stylist (https://github.com/g-ab/stylist). Its files: stylist.json (the settings),
stylist-theme.css (generated: never edit by hand), app-tokens.css (the app's own tokens), stylist-icons.css,
components.json and brand/. Load order: stylist-theme.css → app-tokens.css → stylist-icons.css → brand/brand.css,
before the app's own styles.

To run Stylist: clone https://github.com/g-ab/stylist, run `python3 build.py` in it, and have Python 3,
`pip install playwright` and `python3 -m playwright install chromium`.

- **"restyle the app"** + a pasted "Stylist setup": save the setup to a file, then run
  `python3 <stylist>/export.py <this repo> <that file>`.
- **"upgrade Stylist"**: run `python3 <stylist>/export.py <this repo>` (no setup). The look must not change:
  if "Changed tokens" lists anything, show it before committing.
- **New brand files** (a .zip from Stylist's "Download brand files"): replace the files in brand/ with it.

If export.py stops (exit code 2), the theme file was edited by hand: show the list and stop, never overwrite it.
Otherwise show the "Changed tokens" list, check the app in light and dark mode, and commit
(one restyle or upgrade per commit).

This section is kept up to date by Stylist's export.py, between the stylist markers: edit outside them.
