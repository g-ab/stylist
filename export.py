#!/usr/bin/env python3
"""Restyle an app from Stylist settings, without opening Stylist's page.

    python3 export.py APP_DIR [SETUP]

APP_DIR  the app's folder holding its Stylist files (stylist.json, stylist-theme.css,
         app-tokens.css, components.json, brand/…).
SETUP    what Stylist's "Copy setup for AI" copied, saved to a file (the JSON block,
         with or without the text around it). Without it, the app's own stylist.json is
         used, so the files are regenerated in the latest format: an upgrade.

First time (APP_DIR has no stylist.json yet): a SETUP is required, and every package
file is added to APP_DIR. Connecting the app's own styles to the tokens comes after,
by hand or by an AI (see README, "Style a new app").

It runs Stylist's own code (dist/index.html, headless), so the files are exactly what
the Export package dialog would give.

For an app that already uses Stylist:
  1. open the app's current files, as "Open app style…" does;
  2. stop if the theme file was edited by hand since the last export: those edits must
     be matched, pinned or reverted in Stylist first, never overwritten silently;
  3. apply the setup's settings and pins;
  4. write the package files back into APP_DIR: those the app already has (plus the
     theme, app tokens and stylist.json);
  5. print which token values changed, for the commit message and the review.

Exit codes: 0 done · 1 bad input · 2 hand edits to resolve first.

Needs: pip install playwright && python3 -m playwright install chromium
(or STYLIST_CHROME=/path/to/chrome).
"""
import asyncio
import json
import os
import re
import sys
from pathlib import Path

from playwright.async_api import async_playwright

PAGE = (Path(__file__).resolve().parent / "dist" / "index.html").as_uri()
STYLE_FILES = re.compile(r"^stylist(\.json|-theme\.css|-icons\.(css|tsx)|-motion\.ts)$|^(app-tokens\.css|components\.json|icon-setup\.md)$")
ALWAYS = {"stylist.json", "stylist-theme.css", "app-tokens.css"}


def read_setup(path):
    text = Path(path).read_text(encoding="utf-8")
    start, end = text.find("{"), text.rfind("}")
    if start < 0 or end < start:
        sys.exit("export: no JSON found in the setup")
    try:
        setup = json.loads(text[start:end + 1])
    except json.JSONDecodeError as e:
        sys.exit(f"export: the setup isn't valid JSON ({e})")
    if "settings" not in setup:
        sys.exit("export: the setup has no settings")
    return setup


def app_files(app_dir):
    files = []
    for p in sorted(app_dir.iterdir()):
        if p.is_file() and STYLE_FILES.match(p.name):
            files.append([p.name, p.read_text(encoding="utf-8")])
    brand = app_dir / "brand"
    if brand.is_dir():
        files += [[p.name, p.read_text(encoding="utf-8")] for p in sorted(brand.glob("*.svg"))]
    return files


async def run(app_dir, setup):
    files = app_files(app_dir)
    first = not any(n == "stylist.json" for n, _ in files)
    if first and not setup:
        sys.exit(f"export: {app_dir} has no stylist.json yet. To style it for the first time, pass the setup copied from Stylist.")
    async with async_playwright() as p:
        kw = {"executable_path": os.environ["STYLIST_CHROME"]} if os.environ.get("STYLIST_CHROME") else {}
        browser = await p.chromium.launch(args=["--no-sandbox"], **kw)
        page = await browser.new_page()
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        await page.route(re.compile(r"https://fonts\..*"), lambda r: r.abort())
        await page.goto(PAGE)
        await page.wait_for_timeout(300)
        out = await page.evaluate(
            """async([files,setup,first])=>{localStorage.clear();APP=appDefault();S={...PRESETS[0]};apply();
            if(!first)await openFiles(files.map(([n,t])=>new File([t],n)));
            if(APP.review.length)return {review:APP.review.map(r=>`${r.kind} --${r.v}: ${r.from??'(none)'} → ${r.to??'(none)'}`)};
            const before=first?{light:{},dark:{}}:(APP.snapshot||parseCSS(coreCSS(APP.target)));
            if(setup){const cj=migrate({stylist:1,framework:FRAMEWORK,...setup});S=sanitizeS({...S,...cj.settings});
              if(cj.pins)APP.pins={light:{},dark:{},...cj.pins};if(cj.target&&TGT[cj.target])APP.target=cj.target;if(cj.app)APP.name=cj.app;apply()}
            const pk=buildPackage(APP.target),after=pk.snap,changed=[];
            for(const m of ['light','dark'])for(const k of new Set([...Object.keys(before[m]||{}),...Object.keys(after[m]||{})])){
              const a=(before[m]||{})[k],b=(after[m]||{})[k];if(a!==b)changed.push(`${m} --${k}: ${a??'(none)'} → ${b??'(none)'}`)}
            return {target:APP.target,files:pk.files.map(f=>[f.name,f.text]),changed}}""",
            [files, setup, first],
        )
        await browser.close()
    if errors:
        sys.exit("export: Stylist hit an error: " + errors[0])
    if "review" in out:
        print(f"Stopped: the theme file was edited by hand since the last export ({len(out['review'])} values):")
        for line in out["review"]:
            print("  " + line)
        print("Open these files in Stylist (Custom view → Open app style…) to match, pin or revert each one, then export again.")
        sys.exit(2)

    have = {n for n, _ in out["files"]} if first else {n for n, _ in files} | ALWAYS
    written, skipped = [], []
    for name, text in out["files"]:
        if name.startswith("brand/") or name in have:
            dest = app_dir / name
            dest.parent.mkdir(exist_ok=True)
            if not dest.exists() or dest.read_text(encoding="utf-8") != text:
                dest.write_text(text, encoding="utf-8")
                written.append(name)
        else:
            skipped.append(name)

    if first:
        print(f"First time: added the Stylist files for {out['target']} ({', '.join(written)}).")
        print("Next: load stylist-theme.css, then app-tokens.css, then stylist-icons.css before the app's own styles,")
        print("and switch the app's styles to the tokens one area at a time (README: Style a new app).")
        return
    print(f"Target: {out['target']}")
    print("Changed tokens:" if out["changed"] else "No token values changed.")
    for line in out["changed"]:
        print("  " + line)
    print("Files updated: " + (", ".join(written) if written else "none"))
    if skipped:
        print("Not written (the app doesn't use them yet): " + ", ".join(skipped))


def main():
    if len(sys.argv) not in (2, 3):
        sys.exit(__doc__)
    app_dir = Path(sys.argv[1]).resolve()
    if not app_dir.is_dir():
        sys.exit(f"export: {app_dir} isn't a folder")
    setup = read_setup(sys.argv[2]) if len(sys.argv) == 3 else None
    asyncio.run(run(app_dir, setup))


if __name__ == "__main__":
    main()
