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
- **"upgrade Stylist"**: run `python3 <stylist>/export.py <this repo>` (no setup), then follow its report
  (APPLY.md, "Other requests"). The look must not change: if it lists changed tokens, show them before committing.
  If it lists new tokens, offer to connect them afterwards, in separate commits.
- **components.json** lists the app's own components for Stylist's App preview (APPLY.md, First time, step 5):
  when a component is added or changes a lot, update its entry in the same commit.
- **New brand files as a .zip** (Stylist's "Download brand files", for logos too big for the setup):
  replace the files in brand/ with it.

If export.py stops (exit code 2), the setup wasn't made from the app's current style (not loaded in Stylist
first, or the app changed since), something in the app changed since the setup was made (the theme file
edited by hand, a logo replaced) or a logo arrived damaged: show the message and stop, never overwrite.
If it lists logos "removed in Stylist", ask before deleting them. If it says the app loads Google fonts itself,
remove those lines in the same commit: stylist-theme.css loads the fonts.
Otherwise show the "Changed tokens" list, check the app in light and dark mode, and commit
(one restyle or upgrade per commit).

This section is kept up to date by Stylist's export.py, between the stylist markers: edit outside them.
