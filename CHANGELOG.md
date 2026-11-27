# Changelog

## 27 Nov 2026
- **Shorter setup:** its first line asks the AI to apply it and links to `APPLY.md` (the steps, kept in this repo); the settings are compact JSON. About 750 characters instead of 4,000, and nothing else to type when pasting.
- **Send to your agent** (was "Copy setup for AI"): a panel shows what's included, with Copy or Download file. Logos you changed in Stylist travel with the setup, only those; the export stops instead of overwriting if one arrived damaged or the app's logo changed since loading. Too-big logos fall back to Download brand files.
- **"Copy setup for AI"** (was "for Claude"): the copied text now explains itself to any AI assistant or agent, with the steps to apply it.
- **The app's AI instructions write themselves:** the first export adds a Stylist section to the app's `AGENTS.md` (and a `CLAUDE.md` pointing to it), and every later run keeps it current. No more pasting the block by hand.
- **Download brand files:** a button in the Brand tab gives just the logos, favicon and light/dark switch as a .zip, without the whole package.
- **Style a new app from a setup:** `export.py` adds all the Stylist files to an app that has none yet.
- Open from GitHub: one field, clearer copy.

## 26 Nov 2026
- **Open from GitHub:** load an app's style straight from its repo (Share menu or Custom view). Remembers the last repo; "Copy link" makes a link that opens Stylist with that app loaded.
- Browser settings are now saved under new names: settings kept in the browser before this update reset once. Re-open the app's files to get a style back.
- **Stylist runs on the web:** https://g-ab.github.io/stylist/, published by GitHub on every push once the checks pass. Downloads work as plain browser downloads there.
- **Restyle an app from a setup.** "Copy setup for Claude" now copies the full recipe (settings and pins), and `export.py` turns it into the app's style files, stopping if the theme was edited by hand.
- **Moved into this repo.** The live page was split into `src/` by feature; `build.py` rebuilds it byte for byte. Tests and real packages added as fixtures.
- Published: version `1795701011-b072` (restyle from a setup).
- Published: version `1795699574-c59a` (the fix above; identical to the first build of this repo).

## 25 Nov 2026
- Export package dialog: files grouped by purpose (Theme, Motion, Icons, Brand, For Stylist), SVG previews, footer always in view.
- Motion tokens and the Motion view (built in another chat).

## 23 Nov 2026
- Letter spacing: one Tracking control; the named steps follow it.
- Click any swatch in the Tokens view to copy its hex.
- Brand: drop all SVGs at once, auto-sorted and fitted (later reworked to slot-by-slot drops).

## 22 Nov 2026 and before
- Framework 1–4: colour, typeface, corners, density; container tint and shadows; control heights and focus; icon sets (Lucide, Tabler, Phosphor). Library lens for shadcn and Radix. Round trip with match, pin or revert.
