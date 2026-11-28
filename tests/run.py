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
    await pg.evaluate("localStorage.clear();startNew('Test','css',0);showView('comp')")
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

        # 6a. "Used by" names only real components (no gallery helpers like hrow/hlab), and the Custom view has no Usage card
        ub = await pg.evaluate("""()=>{showView('tok');const names=new Set(Object.values(KNAME)),cu=coreUsage(),odd=[...new Set(Object.values(cu).flatMap(s=>[...s]))].filter(n=>!names.has(n));
            const el=document.querySelector('#tokBody [data-name="--accent-strong"]');showUse(el);const foot=el.closest('.t-card').querySelector('.t-use').innerText;
            showView('cus');const usage=[...document.querySelectorAll('#cusBody h4')].some(h=>h.textContent==='Usage');showView('comp');
            return {odd,foot,usage,accent:[...(cu.accent||[])]}}""")
        check("used by: real components only, shown in Tokens", not ub["odd"] and "Accent hover" in ub["foot"] and "--accent-strong" in ub["foot"] and "Button" in ub["accent"] and not ub["usage"], ub)

        # 6c. With no app loaded, the Custom tab is an empty state that offers to load one or start a new one
        es = await pg.evaluate("""()=>{const keep=APP;APP=appDefault();showView('cus');const b=$('cusBody'),r={empty:!!b.querySelector('.ap-empty'),acts:[...b.querySelectorAll('[data-act]')].map(x=>x.dataset.act)};
            b.querySelector('[data-act="new"]').click();r.after=!!b.querySelector('.ap-empty');APP=keep;saveApp();apply();showView('comp');return r}""")
        check("custom tab: empty state until an app is loaded", es["empty"] and {"gh", "open", "new"} <= set(es["acts"]) and not es["after"], es)

        # 6b. "Copy setup for Claude" carries the full recipe, and export.py turns it into the files
        import shutil, subprocess, tempfile
        root = Path(__file__).resolve().parent.parent
        fx_files = [[f.name, f.read_text()] for f in sorted((root / "tests" / "fixtures" / "v5-css").iterdir()) if f.is_file()]
        setup = await pg.evaluate("""async(fs)=>{localStorage.clear();APP=appDefault();S={...PRESETS[0]};apply();await openFiles(fs.map(([n,t])=>new File([t],n)));
            S={...S,radius:16,fam:'teal'};APP.name='Fixture';APP.target='css';apply();return setupText()}""", fx_files)
        block = json.loads(setup[setup.index("{"):setup.rindex("}") + 1])
        keys = await pg.evaluate("RECIPE_KEYS")
        check("copy setup is a full recipe", set(keys) <= set(block["settings"]) and "pins" in block and block["settings"]["radius"] == 16, list(block)[:6])
        steps = await pg.evaluate("$('copy').textContent")
        apply_md = (Path(__file__).resolve().parent.parent / "APPLY.md").read_text()
        check("setup is short and points to APPLY.md", "Send to agent" in steps and setup.startswith("Apply this Stylist setup to Fixture.") and "blob/main/APPLY.md" in setup and len(setup) < 2500 and "Claude" not in setup
              and all(w in apply_md for w in ("export.py", "Exit code 2", "First time", "upgrade Stylist", "Removed in Stylist")), {"chars": len(setup), "start": setup[:60]})
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
            # load first: a setup made from Stylist's defaults, or from an older copy of the app's style, stops before writing
            app2 = Path(tmp) / "app2"
            shutil.copytree(root / "tests" / "fixtures" / "v5-css", app2)
            def ex(a, text):
                (Path(tmp) / "s.md").write_text(text)
                return subprocess.run([sys.executable, str(root / "export.py"), str(a), str(Path(tmp) / "s.md")], capture_output=True, text=True)
            before = (app2 / "stylist.json").read_text()
            cold = await pg.evaluate("()=>{localStorage.clear();APP=appDefault();S={...PRESETS[0],radius:16};apply();return setupText()}")
            rc = ex(app2, cold)
            check("load first: a setup made without loading the app stops", rc.returncode == 2 and "Load it in Stylist first" in rc.stdout and (app2 / "stylist.json").read_text() == before, rc.stdout[-200:])
            first = ex(app2, setup)
            again = await pg.evaluate("""async(fs)=>{localStorage.clear();APP=appDefault();S={...PRESETS[0]};apply();await openFiles(fs.map(([n,t])=>new File([t],n)));
                S={...S,radius:16,fam:'teal'};APP.name='Fixture';APP.target='css';apply();setupText();S={...S,radius:8};apply();return setupText()}""", fx_files)
            r6 = ex(app2, again)
            check("load first: a second setup from the same session still applies", first.returncode == 0 and r6.returncode == 0 and "--radius-lg: 16px → 8px" in r6.stdout, (first.stdout[-150:], r6.stdout[-200:], r6.stderr[-200:]))
            j = json.loads((app2 / "stylist.json").read_text()); j["settings"]["radius"] = 20
            (app2 / "stylist.json").write_text(json.dumps(j, indent=2))
            r7 = ex(app2, again)
            check("load first: the app changed since loading stops", r7.returncode == 2 and "changed since it was loaded" in r7.stdout, r7.stdout[-200:])
            # fonts come with the theme; an app's own Google Fonts link is pointed out
            th = (app2 / "stylist-theme.css").read_text()
            (app2 / "index.html").write_text('<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono&display=swap" rel="stylesheet">\n')
            r8 = subprocess.run([sys.executable, str(root / "export.py"), str(app2)], capture_output=True, text=True)
            imp = await pg.evaluate("()=>{S={...S,ui:'Inter',mono:'Reddit Mono'};apply();return ['css','shadcn','radix'].map(t=>coreCSS(t).split('\\n').slice(0,3).join(' '))}")
            check("fonts load from the theme; the app's own link is listed", '@import url("https://fonts.googleapis.com/css?family=' in th and r8.returncode == 0 and "index.html:1" in r8.stdout
                  and all("family=Inter:400,500,600|Reddit+Mono:400,500,600" in x for x in imp), (th[:200], r8.stdout[-200:], [x[:160] for x in imp]))
            # first time: an app folder with no Stylist files gets the whole package from a setup
            new = Path(tmp) / "new-app"
            new.mkdir()
            (new / "index.html").write_text("<!doctype html><title>New</title>")
            r4 = subprocess.run([sys.executable, str(root / "export.py"), str(new), str(Path(tmp) / "setup.txt")], capture_output=True, text=True)
            added = sorted(p.name for p in new.iterdir())
            check("export.py styles a new app", r4.returncode == 0 and {"stylist.json", "stylist-theme.css", "app-tokens.css"} <= set(added) and "First time" in r4.stdout and "--radius-lg: 16px" in (new / "stylist-theme.css").read_text(), added)
            r5 = subprocess.run([sys.executable, str(root / "export.py"), str(new)], capture_output=True, text=True)
            check("export.py on the new app again: nothing changes", r5.returncode == 0 and "No token values changed" in r5.stdout, r5.stdout[-200:] + r5.stderr[-200:])
            agents = (new / "AGENTS.md").read_text() if (new / "AGENTS.md").exists() else ""
            check("new app gets the AI instructions", agents.count("<!-- stylist:start -->") == 1 and "upgrade Stylist" in agents and (new / "CLAUDE.md").read_text().strip() == "@AGENTS.md", agents[:120])
            # stale instructions between the markers are refreshed; files explaining Stylist their own way are left alone
            (new / "AGENTS.md").write_text("# Mine\n\nKeep this.\n\n<!-- stylist:start -->\nold text\n<!-- stylist:end -->\n")
            subprocess.run([sys.executable, str(root / "export.py"), str(new)], capture_output=True, text=True)
            refreshed = (new / "AGENTS.md").read_text()
            own = Path(tmp) / "own"
            shutil.copytree(root / "tests" / "fixtures" / "v5-css", own)
            (own / "CLAUDE.md").write_text("# Notes\n\n## Restyling with Stylist\nOur own steps.\n")
            subprocess.run([sys.executable, str(root / "export.py"), str(own)], capture_output=True, text=True)
            check("AI instructions stay current, own notes untouched", "Keep this." in refreshed and "old text" not in refreshed and refreshed.count("<!-- stylist:start -->") == 1 and "upgrade Stylist" in refreshed
                  and (own / "CLAUDE.md").read_text() == "# Notes\n\n## Restyling with Stylist\nOur own steps.\n" and not (own / "AGENTS.md").exists(), refreshed[:160])
            empty = Path(tmp) / "empty"
            empty.mkdir()
            r6 = subprocess.run([sys.executable, str(root / "export.py"), str(empty)], capture_output=True, text=True)
            check("export.py asks for a setup on a new app", r6.returncode == 1 and "first time" in r6.stderr, r6.stderr[-200:])

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
        g3 = await gh.evaluate("({src:APP.source,radius:S.radius,start:!$('start').hidden,bar:$('appSrc').textContent})")
        check("?app= link opens the app, past the start screen", "g-ab/cast" in (g3["src"] or "") and g3["radius"] == 12 and not g3["start"] and "g-ab/cast" in g3["bar"], g3)
        g4 = await gh.evaluate("[ghParse('https://github.com/g-ab/x/tree/main/styles'),ghParse('g-ab/x/ui/theme'),ghParse('g-ab/x')]")
        check("GitHub links with a folder", g4[0] == {"owner": "g-ab", "repo": "x", "ref": "main", "path": "styles"} and g4[1]["path"] == "ui/theme" and g4[2]["path"] == "", g4)
        check("no page errors (GitHub)", not gerr, gerr[:3])
        await gh.close()

        # 6e. Start screen until an app is loaded; Start new; the app menu (Revert, Destination, Rename, Close)
        st, sterr = await open_page(browser)
        await st.evaluate("localStorage.clear();APP=appDefault();S={...PRESETS[0]};apply()")
        s0 = await st.evaluate("({start:!$('start').hidden,aside:getComputedStyle(document.querySelector('aside')).display,bar:$('appBtn').offsetParent===null})")
        await st.click("#stNew")
        await st.fill("#stName", "Kiln journal")
        await st.click('#stDest [data-t="shadcn"]')
        await st.click('#stPre [data-i="3"]')
        await st.click('#stNewForm button[type="submit"]')
        s1 = await st.evaluate("({start:!$('start').hidden,name:$('appNm').textContent,src:$('appSrc').textContent,t:APP.target,id:S.id,isNew:!!APP.origin.new})")
        await st.evaluate("S={...S,radius:20};apply()")
        await st.click("#appBtn")
        await st.click("#mRevert")
        s2 = await st.evaluate("S.radius===PRESETS[0].radius")
        await st.click("#appBtn")
        await st.click('#libSeg [data-t="radix"]')
        await st.click("#appBtn")
        await st.click("#mRename")
        await st.fill("#appRen", "Kiln")
        await st.press("#appRen", "Enter")
        s3 = await st.evaluate("({t:APP.target,name:$('appNm').textContent,reload:$('mReload').hidden})")
        await st.click("#appBtn")
        await st.click("#mClose")
        s4 = await st.evaluate("({start:!$('start').hidden,loaded:appLoaded()})")
        check("start screen: shown with no app, hides the workspace", s0["start"] and s0["aside"] == "none" and s0["bar"], s0)
        check("start new: name, destination and preset, then the workspace", not s1["start"] and s1["name"] == "Kiln journal" and s1["t"] == "shadcn" and s1["id"] == (await st.evaluate("PRESETS[3].id")) and s1["isNew"] and "New app" in s1["src"], s1)
        check("app menu: revert, destination, rename, close", s2 and s3["t"] == "radix" and s3["name"] == "Kiln" and s3["reload"] and s4["start"] and not s4["loaded"], (s2, s3, s4))
        check("no page errors (start screen)", not sterr, sterr[:3])
        await st.close()

        # 6d. "Download brand files" gives just the brand folder, and is off until there is a logo or symbol
        bp, berr = await open_page(browser)
        b0 = await bp.evaluate("(()=>{APP.brand={};apply();return $('brDl').disabled})()")
        await bp.evaluate("""(()=>{APP.brand={main:{light:{name:'symbol.svg',svg:'<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 10 10\"><circle cx=\"5\" cy=\"5\" r=\"4\"/></svg>'}}};saveApp();apply()})()""")
        await bp.evaluate("document.querySelector('#ptabs [data-tab=brand]').click()")
        async with bp.expect_download() as dl:
            await bp.click("#brDl")
        d = await dl.value
        import zipfile
        names = zipfile.ZipFile(await d.path()).namelist()
        check("download brand files", b0 and d.suggested_filename.endswith("-brand.zip") and names and all(n.startswith("brand/") for n in names) and "brand/mark.svg" in names and not berr, {"off_when_empty": b0, "files": names, "errors": berr[:2]})
        await bp.close()

        # 6e. Send to your agent: logos travel only when changed, checked on arrival
        OLD = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 10"><rect width="40" height="10" fill="#111"/></svg>'
        NEW = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 10"><rect width="40" height="10" rx="3" fill="#0b5fd0"/></svg>'
        def make_app(base):
            app = base / "app"
            shutil.copytree(root / "tests" / "fixtures" / "v5-css", app)
            (app / "brand").mkdir()
            (app / "brand" / "logo.svg").write_text(OLD + "\n")
            return app
        def app_payload(app):
            fs = [[f.name, f.read_text()] for f in sorted(app.iterdir()) if f.is_file()]
            return fs + [["brand/" + f.name, f.read_text()] for f in sorted((app / "brand").glob("*.svg"))]
        def export(app, text):
            sf = app.parent / "setup.md"
            sf.write_text(text)
            return subprocess.run([sys.executable, str(root / "export.py"), str(app), str(sf)], capture_output=True, text=True)
        sp, serr = await open_page(browser)
        with tempfile.TemporaryDirectory() as tmp:
            app = make_app(Path(tmp))
            load = """async(fs)=>{localStorage.clear();APP=appDefault();S={...PRESETS[0]};apply();await openFiles(fs.map(([n,t])=>new File([t],n.split('/').pop())));return true}"""
            await sp.evaluate(load, app_payload(app))
            t0 = await sp.evaluate("(()=>{S={...S,radius:20};apply();return setupText()})()")
            check("send: unchanged logos stay out", "stylist-file" not in t0 and '"brand"' not in t0, t0[-200:])
            t1 = await sp.evaluate("(n)=>{APP.brand.logo={...(APP.brand.logo||{}),light:{name:'logo.svg',svg:n}};apply();return setupText()}", NEW)
            r = export(app, t1)
            check("send: a changed logo is written", r.returncode == 0 and (app / "brand" / "logo.svg").read_text().strip() == NEW and "brand/logo.svg" in r.stdout and "--radius-lg: 12px → 20px" in r.stdout, {"code": r.returncode, "logo": (app / "brand" / "logo.svg").read_text()[:90], "out": r.stdout[-260:], "err": r.stderr[-200:]})
        with tempfile.TemporaryDirectory() as tmp:
            app = make_app(Path(tmp))
            await sp.evaluate(load, app_payload(app))
            t1 = await sp.evaluate("(n)=>{APP.brand.logo={...(APP.brand.logo||{}),light:{name:'logo.svg',svg:n}};apply();return setupText()}", NEW)
            r = export(app, t1.replace('rx="3"', 'rx="4"'))
            check("send: a damaged logo stops it", r.returncode == 2 and "damaged" in r.stdout and (app / "brand" / "logo.svg").read_text().strip() == OLD, r.stdout[-200:])
            (app / "brand" / "logo.svg").write_text(OLD.replace("#111", "#222"))
            r = export(app, t1)
            check("send: a logo changed in the app stops it", r.returncode == 2 and "changed in the app" in r.stdout, r.stdout[-200:])
        with tempfile.TemporaryDirectory() as tmp:
            app = make_app(Path(tmp))
            t2 = await sp.evaluate("(n)=>{localStorage.clear();APP=appDefault();S={...PRESETS[0]};APP.brand={logo:{light:{name:'logo.svg',svg:n}}};apply();return setupText()}", NEW)
            r = export(app, t2)
            check("send: made without loading the app, it asks first", r.returncode == 2 and "Load it in Stylist first" in r.stdout and (app / "brand" / "logo.svg").read_text().strip() == OLD, r.stdout[-200:])
            await sp.evaluate(load, app_payload(app))
            big = await sp.evaluate("""()=>{const p=Array.from({length:900},(_,i)=>`<rect x="${i%40}" y="${i%10}" width="1" height="1" fill="#${(i*2654435761>>>8&0xffffff).toString(16).padStart(6,'0')}"/>`).join('');
              APP.brand.logo={...(APP.brand.logo||{}),light:{name:'logo.svg',svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 10">${p}</svg>`}};apply();const d=brandDelta();return {n:d.files.length,big:d.tooBig,text:setupText(d)}}""")
            check("send: logos too big fall back to the download", big["n"] == 0 and big["big"] > 30 * 1024 and "Download brand files" in big["text"] and "stylist-file" not in big["text"], {k: big[k] for k in ("n", "big")})
            await sp.evaluate(load, app_payload(app))
            rm = await sp.evaluate("(()=>{delete APP.brand.logo.light;apply();return setupText()})()")
            r = export(app, rm)
            check("send: a removed logo is listed, not deleted", r.returncode == 0 and "ask before deleting" in r.stdout and (app / "brand" / "logo.svg").exists(), r.stdout[-200:])
            # the panel: what's included, Download suggested when logos travel, file download
            await sp.evaluate(load, app_payload(app))
            await sp.evaluate("(n)=>{APP.brand.logo={...(APP.brand.logo||{}),light:{name:'logo.svg',svg:n}};apply()}", NEW)
            await sp.click("#copy")
            pnl = await sp.evaluate("({open:!$('sendmod').hidden,sum:$('sendSum').innerText,copy:!$('sendCopy').hidden&&$('sendCopy').classList.contains('pri'),dl:!$('sendDl').hidden&&!$('sendDl').classList.contains('pri'),label:$('copy').textContent})")
            async with sp.expect_download() as dl:
                await sp.click("#sendDl")
            fname = (await dl.value).suggested_filename
            check("send: short setup → Download file + Copy (main)", pnl["open"] and "Copy and paste" in pnl["sum"] and pnl["copy"] and pnl["dl"] and "Send to agent" in pnl["label"] and fname.endswith("-stylist-setup.md"), {**pnl, "file": fname})
            # a heavier logo makes it too long to paste: Download only, with the reason
            await sp.evaluate("""()=>{const p=Array.from({length:260},(_,i)=>`<rect x="${i%40}" y="${i%10}" width="1" height="1" fill="#${(i*2654435761>>>8&0xffffff).toString(16).padStart(6,'0')}"/>`).join('');
              APP.brand.logo={...(APP.brand.logo||{}),light:{name:'logo.svg',svg:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 10">${p}</svg>`}};apply();openSend()}""")
            lng = await sp.evaluate("({len:sendText.length,copy:!$('sendCopy').hidden,dl:!$('sendDl').hidden&&$('sendDl').classList.contains('pri'),sum:$('sendSum').innerText})")
            check("send: too long → Download file only", lng["len"] > 8000 and not lng["copy"] and lng["dl"] and "apply this" in lng["sum"], lng)
        check("no page errors (send)", not serr, serr[:3])
        await sp.close()

        # 6f. Safe upgrades: the version is shown and written; upgrading never changes a value the app has
        vp, verr = await open_page(browser)
        ver = await vp.evaluate("({shown:$('ver').textContent,v:VERSION,json:JSON.parse(buildPackage('css').files[0].text).version,head:coreCSS('css').split(String.fromCharCode(10))[0]})")
        check("version shown and written", ver["shown"] == "v" + ver["v"] and ver["json"] == ver["v"] and f"Stylist {ver['v']}" in ver["head"], ver)
        with tempfile.TemporaryDirectory() as tmp:
            for fx in sorted((root / "tests" / "fixtures").glob("v*-*")):
                app = Path(tmp) / fx.name
                shutil.copytree(fx, app)
                r = subprocess.run([sys.executable, str(root / "export.py"), str(app)], capture_output=True, text=True)
                check(f"upgrade keeps every value ({fx.name})", r.returncode == 0 and "No token values changed" in r.stdout, r.stdout[-300:] + r.stderr[-200:])
            # an app made before letter spacing (framework 4, Stylist 1.4): the upgrade adds tokens, changes none
            old = Path(tmp) / "old-app"
            shutil.copytree(root / "tests" / "fixtures" / "v5-css", old)
            j = json.loads((old / "stylist.json").read_text())
            j["framework"] = 4
            j.pop("version", None)
            j["settings"].pop("track", None)
            for m in ("light", "dark"):
                j["snapshot"][m] = {k: v for k, v in j["snapshot"].get(m, {}).items() if not k.startswith("tracking")}
            (old / "stylist.json").write_text(json.dumps(j))
            (old / "stylist-theme.css").write_text("\n".join(l for l in (old / "stylist-theme.css").read_text().split("\n") if "--tracking" not in l))
            r = subprocess.run([sys.executable, str(root / "export.py"), str(old)], capture_output=True, text=True)
            check("upgrade from an older version: new tokens, nothing changed", r.returncode == 0 and "No token values changed" in r.stdout and "made with Stylist 1.4" in r.stdout and "letter spacing" in r.stdout and "--tracking" in r.stdout and "--tracking: 0em" in (old / "stylist-theme.css").read_text(), r.stdout[-400:] + r.stderr[-200:])
            # a renamed token: the old name keeps working (alias) and the app's code that uses it is listed
            ren = [{"since": "9.9", "from": "old-sheet", "to": "sheet"}]
            al = await vp.evaluate("""async(ren)=>{TOKEN_RENAMES.push(...ren);S={...PRESETS[0]};apply();const css=coreCSS('css'),pk=buildPackage('css');
                await openFiles(pk.files.map(f=>new File([f.text],f.name.split('/').pop())));const o={alias:css.includes('--old-sheet: var(--sheet);'),review:APP.review.length};TOKEN_RENAMES.length=0;return o}""", ren)
            code = Path(tmp) / "v5-css" / "app.css"
            code.write_text(".card {\n  background: var(--old-sheet);\n}\n")
            r = subprocess.run([sys.executable, str(root / "export.py"), str(code.parent)], capture_output=True, text=True, env={**os.environ, "STYLIST_EXTRA_RENAMES": json.dumps(ren)})
            check("renamed tokens keep working and are listed", al["alias"] and al["review"] == 0 and r.returncode == 0 and "app.css:2" in r.stdout and "--old-sheet: var(--sheet)" in (code.parent / "stylist-theme.css").read_text(), {**al, "out": r.stdout[-300:]})
        check("no page errors (versions)", not verr, verr[:3])
        await vp.close()

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
