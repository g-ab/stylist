## Stylist
This app's look comes from Stylist (https://github.com/g-ab/stylist). Its files: stylist.json (the settings),
stylist-theme.css (generated: never edit by hand), app-tokens.css (the app's own tokens), stylist-icons.css,
components.json and brand/. Load order: stylist-theme.css → app-tokens.css → stylist-icons.css → brand/brand.css,
before the app's own styles.

To run Stylist: clone https://github.com/g-ab/stylist, run `python3 build.py` in it, and have Python 3,
`pip install playwright` and `python3 -m playwright install chromium`.

- **A Stylist setup** (a message or .md file starting "Apply this Stylist setup to …"): follow
  https://github.com/g-ab/stylist/blob/main/APPLY.md. In short: save it to a file as it is, then run
  `python3 <stylist>/export.py <this repo> <that file>`. Logos changed in Stylist are inside it.
- **"upgrade Stylist"**: run `python3 <stylist>/export.py <this repo>` (no setup). The look must not change:
  if "Changed tokens" lists anything, show it before committing.
- **New brand files as a .zip** (Stylist's "Download brand files", for logos too big for the setup):
  replace the files in brand/ with it.

If export.py stops (exit code 2), something in the app changed since the setup was made (the theme file
edited by hand, a logo replaced) or a logo arrived damaged: show the message and stop, never overwrite.
If it lists logos "removed in Stylist", ask before deleting them.
Otherwise show the "Changed tokens" list, check the app in light and dark mode, and commit
(one restyle or upgrade per commit).

This section is kept up to date by Stylist's export.py, between the stylist markers: edit outside them.
