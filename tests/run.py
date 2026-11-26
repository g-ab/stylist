#!/usr/bin/env python3
"""Stylist's checks. Run after every change, before publishing:

    python3 build.py && python3 tests/run.py

They open dist/index.html in a headless browser and exercise what has broken before:
the page loading, export round trips, opening packages from earlier versions,
migrations of old recipes, the export dialog at small sizes, swatch hex copies and letter spacing.

Needs: pip install playwright && python3 -m playwright install chromium
(or set STYLIST_CHROME to an installed Chrome/Chromium binary).
"""
import asyncio
import json
import os
import re
import sys
from pathlib import Path

from playwright.async_api import async_playwright

PAGE = (Path(__file__).resolve().parent.parent / "dist" / "index.html").as_uri()
RESULTS = []


def check(name, ok, detail=""):
    RESULTS.append((name, bool(ok), detail))
    print(("PASS " if ok else "FAIL ") + name + (f"  ({detail})" if detail and not ok else ""))


async def open_page(browser, w=1440, h=900):
    pg = await browser.new_page(viewport={"width": w, "height": h})
    errors = []
    pg.on("pageerror", lambda e: errors.append(str(e)))
    # Google Fonts can't load here; the page copes, but don't wait on it
    await pg.route(re.compile(r"https://fonts\..*"), lambda r: r.abort())
    await pg.goto(PAGE)
    await pg.wait_for_timeout(300)
    await pg.evaluate("localStorage.clear();APP=appDefault();APP.name='Test';S={...PRESETS[0]};apply()")
    return pg, errors


async def main():
    async with async_playwright() as p:
        kw = {"executable_path": os.environ["STYLIST_CHROME"]} if os.environ.get("STYLIST_CHROME") else {}
        browser = await p.chromium.launch(args=["--no-sandbox"], **kw)
        pg, errors = await open_page(browser)

        # 1. The page loads and is called Stylist everywhere
        r = await pg.evaluate("({title:document.title,h1:document.querySelector('h1').textContent})")
        check("loads as Stylist", r["title"] == "Stylist" and r["h1"] == "Stylist", r)

        # 2. Export → open the same files: nothing to review, for each library
        rt = await pg.evaluate("""async()=>{const o={};for(const tg of ['css','shadcn','radix']){
            S={...PRESETS[0],radius:12,track:{base:0.01}};apply();const pk=buildPackage(tg);
            await openFiles(pk.files.map(f=>new File([f.text],f.name.split('/').pop())));
            o[tg]={review:APP.review.length,radius:S.radius,track:trackOf().base,names:pk.files.map(f=>f.name)}}return o}""")
        for tg, v in rt.items():
            check(f"round trip {tg}", v["review"] == 0 and v["radius"] == 12 and v["track"] == 0.01, v)
        check("package file names", {"stylist.json", "stylist-theme.css", "app-tokens.css"} <= set(rt["css"]["names"]), rt["css"]["names"])

        # 3. Real packages from every earlier version keep opening (tests/fixtures/v<framework>-<library>)
        fx = Path(__file__).resolve().parent / "fixtures"
        for d in sorted(fx.glob("v*-*")):
            files = [[f.name, f.read_text(encoding="utf-8")] for f in sorted(d.iterdir())]
            v = await pg.evaluate("""async(files)=>{S={...PRESETS[0]};apply();await openFiles(files.map(([n,t])=>new File([t],n)));
                return {review:APP.review.length,radius:S.radius,track:trackOf().base}}""", files)
            check(f"opens package {d.name}", v["review"] == 0 and v["radius"] == 12 and v["track"] == 0.01, v)

        # 4. Old recipes migrate: framework 1 gets the later defaults
        mig = await pg.evaluate("""async()=>{const cj=JSON.parse(buildPackage('css').files[0].text);
            cj.framework=1;for(const k of ['tint','shStr','shSoft','unit','h','focus','icons','track','radius'])delete cj.settings[k];cj.settings.round='soft';
            const m=migrate(cj);return {fw:m.migratedFrom,tint:m.settings.tint,radius:m.settings.radius,icons:m.settings.icons&&m.settings.icons.set,track:m.settings.track}}""")
        check("migrates framework 1 recipes", mig["tint"] == 50 and mig["radius"] == 8 and mig["icons"] == "lucide" and mig["track"] is not None, mig)

        # 5. Letter spacing reaches every library's export
        ls = await pg.evaluate("""()=>{S={...PRESETS[0],track:{base:0.02}};apply();
            return {css:/--tracking: 0.02em/.test(coreCSS('css')),shadcn:/--tracking-wide: 0.045em/.test(coreCSS('shadcn')),radix:/--default-letter-spacing: 0.02em/.test(coreCSS('radix'))}}""")
        check("letter spacing exported", all(ls.values()), ls)

        # 6. Every swatch in the Tokens view copies as a hex code
        hx = await pg.evaluate("""()=>{showView('tok');const bad=[...document.querySelectorAll('#tokBody [data-copy]')].map(e=>colorHex(e.dataset.copy)).filter(h=>!/^#[0-9a-f]{6}([0-9a-f]{2})?$/.test(h));
            return {n:document.querySelectorAll('#tokBody [data-copy]').length,bad:bad.length}}""")
        check("swatches copy as hex", hx["n"] > 50 and hx["bad"] == 0, hx)

        # 6b. "Copy setup for Claude" carries the full recipe, and export.py turns it into the files
        setup = await pg.evaluate("()=>{S={...PRESETS[0],radius:16,fam:'teal'};APP.name='Fixture';APP.target='css';apply();return setupText()}")
        block = json.loads(setup[setup.index("{"):setup.rindex("}") + 1])
        keys = await pg.evaluate("RECIPE_KEYS")
        check("copy setup is a full recipe", set(keys) <= set(block["settings"]) and "pins" in block and block["settings"]["radius"] == 16, list(block)[:6])
        import shutil, subprocess, tempfile
        root = Path(__file__).resolve().parent.parent
        with tempfile.TemporaryDirectory() as tmp:
            app = Path(tmp) / "app"
            shutil.copytree(root / "tests" / "fixtures" / "v5-css", app)
            (Path(tmp) / "setup.txt").write_text(setup)
            r1 = subprocess.run([sys.executable, str(root / "export.py"), str(app), str(Path(tmp) / "setup.txt")], capture_output=True, text=True)
            theme = (app / "stylist-theme.css").read_text() if (app / "stylist-theme.css").exists() else ""
            check("export.py applies a setup", r1.returncode == 0 and "--radius-lg: 16px" in theme and "--radius-lg: 12px → 16px" in r1.stdout, r1.stdout[-300:] + r1.stderr[-300:])
            r2 = subprocess.run([sys.executable, str(root / "export.py"), str(app)], capture_output=True, text=True)
            check("export.py again: nothing changes", r2.returncode == 0 and "No token values changed" in r2.stdout, r2.stdout[-200:])
            (app / "stylist-theme.css").write_text(theme.replace("--radius-lg: 16px", "--radius-lg: 10px"))
            r3 = subprocess.run([sys.executable, str(root / "export.py"), str(app), str(Path(tmp) / "setup.txt")], capture_output=True, text=True)
            check("export.py stops on hand edits", r3.returncode == 2 and "radius-lg" in r3.stdout, r3.stdout[-200:])

        check("no page errors (main page)", not errors, errors[:3])
        await pg.close()

        # 6c. Open from GitHub: reads the repo's files (served here from a fixture), from the dialog and from ?app= links
        fxd = Path(__file__).resolve().parent / "fixtures" / "v5-css"
        async def raw(route):
            m = re.match(r"https://raw\.githubusercontent\.com/g-ab/cast/HEAD/(.+)$", route.request.url)
            f = fxd / m.group(1) if m else None
            if f and f.is_file():
                await route.fulfill(status=200, body=f.read_text(encoding="utf-8"), headers={"Access-Control-Allow-Origin": "*"})
            else:
                await route.fulfill(status=404, body="", headers={"Access-Control-Allow-Origin": "*"})
        gh, gerr = await open_page(browser)
        await gh.route(re.compile(r"https://raw\.githubusercontent\.com/.*"), raw)
        await gh.click("#shareBtn") if await gh.query_selector("#shareBtn") else None
        await gh.evaluate("openGh()")
        await gh.fill("#ghRepo", "https://github.com/g-ab/cast")
        await gh.click("#ghGo")
        await gh.wait_for_timeout(500)
        g1 = await gh.evaluate("({hidden:$('ghmod').hidden,src:APP.source,review:APP.review.length,radius:S.radius,track:trackOf().base,last:localStorage.getItem('stylist.gh.v1')})")
        check("open from GitHub", g1["hidden"] and "g-ab/cast" in g1["src"] and g1["review"] == 0 and g1["radius"] == 12 and g1["track"] == 0.01 and "g-ab/cast" in (g1["last"] or ""), g1)
        await gh.evaluate("openGh()")
        await gh.fill("#ghRepo", "g-ab/nothing-here")
        await gh.click("#ghGo")
        await gh.wait_for_timeout(400)
        g2 = await gh.evaluate("({hidden:$('ghmod').hidden,msg:$('ghMsg').textContent})")
        check("open from GitHub: repo without Stylist files", not g2["hidden"] and "No Stylist files" in g2["msg"], g2)
        await gh.goto(PAGE + "?app=g-ab/cast")
        await gh.wait_for_timeout(700)
        g3 = await gh.evaluate("({src:APP.source,radius:S.radius})")
        check("?app= link opens the app", "g-ab/cast" in (g3["src"] or "") and g3["radius"] == 12, g3)
        check("no page errors (GitHub)", not gerr, gerr[:3])
        await gh.close()

        # 7. The export dialog keeps its download button in view, even in small windows
        for w, h in [(1440, 900), (820, 650), (560, 800)]:
            pg, errors = await open_page(browser, w, h)
            d = await pg.evaluate("""()=>{openPkg();const c=document.querySelector('.xcard.pkg').getBoundingClientRect(),a=$('pAll').getBoundingClientRect();
                return {fits:c.right<=innerWidth&&c.bottom<=innerHeight,button:a.right<=c.right&&a.bottom<=c.bottom,files:document.querySelectorAll('#pfiles button').length}}""")
            if w == 1440:
                # Outside Claude (e.g. GitHub Pages) the package downloads as a plain browser download
                async with pg.expect_download() as dl:
                    await pg.click("#pAll")
                d["download"] = (await dl.value).suggested_filename
            check(f"export dialog at {w}x{h}", d["fits"] and d["button"] and d["files"] > 3 and not errors and ("download" not in d or d["download"].endswith("-stylist.zip")), {**d, "errors": errors[:2]})
            await pg.close()

        await browser.close()

    failed = [n for n, ok, _ in RESULTS if not ok]
    print(f"\n{len(RESULTS) - len(failed)}/{len(RESULTS)} passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    asyncio.run(main())
