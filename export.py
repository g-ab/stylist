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
  2. stop if the setup wasn't made from the app's current style (not loaded in Stylist
     first, or the app changed since), or if the theme file was edited by hand since the last export: those edits must
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

ROOT = Path(__file__).resolve().parent
PAGE = (ROOT / "dist" / "index.html").as_uri()
BLOCK_START, BLOCK_END = "<!-- stylist:start -->", "<!-- stylist:end -->"
CODE_FILES = {".css", ".scss", ".sass", ".less", ".html", ".htm", ".js", ".mjs", ".jsx", ".ts", ".tsx", ".vue", ".svelte", ".astro"}
SKIP_DIRS = {".git", "node_modules", "dist", "build", ".next", ".svelte-kit", "vendor", "brand"}
STYLE_FILES = re.compile(r"^stylist(\.json|-theme\.css|-icons\.(css|tsx)|-motion\.ts)$|^(app-tokens\.css|components\.json|icon-setup\.md)$")
ALWAYS = {"stylist.json", "stylist-theme.css", "app-tokens.css"}


def vtuple(v):
    try:
        return tuple(int(x) for x in str(v).split("."))
    except ValueError:
        return (0,)


def app_version(app_dir):
    """Which Stylist made the app's files: stylist.json's "version", or <format>.<framework> for older files."""
    p = app_dir / "stylist.json"
    if not p.exists():
        return None, None
    try:
        j = json.loads(p.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None, None
    fw = int(j.get("framework") or 1)
    return str(j.get("version") or f"{int(j.get('stylist') or 1)}.{fw}"), fw


def old_names_in_code(app_dir, renames):
    """Where the app's own code still uses a token name Stylist has since renamed (they keep working via aliases)."""
    hits = []
    if not renames:
        return hits
    pats = [(r, re.compile(r"--" + re.escape(r["old"]) + r"(?![\w-])")) for r in renames]
    for p in sorted(app_dir.rglob("*")):
        rel = p.relative_to(app_dir)
        if not p.is_file() or p.suffix.lower() not in CODE_FILES or any(part in SKIP_DIRS for part in rel.parts) or STYLE_FILES.match(p.name):
            continue
        try:
            lines = p.read_text(encoding="utf-8").splitlines()
        except (UnicodeDecodeError, OSError):
            continue
        for i, line in enumerate(lines, 1):
            for r, pat in pats:
                if pat.search(line):
                    hits.append(f"--{r['old']} → --{r['new']} (renamed in Stylist {r['since']}): {rel}:{i}")
    return hits


def own_font_links(app_dir):
    """Where the app loads Google fonts itself. Stylist's theme file loads its fonts now, so these lines are left over
    (and after a font change in Stylist they still load the old font)."""
    hits = []
    pat = re.compile(r"fonts\.(googleapis|gstatic)\.com")
    for p in sorted(app_dir.rglob("*")):
        rel = p.relative_to(app_dir)
        if not p.is_file() or p.suffix.lower() not in CODE_FILES or any(part in SKIP_DIRS for part in rel.parts) or STYLE_FILES.match(p.name):
            continue
        try:
            lines = p.read_text(encoding="utf-8").splitlines()
        except (UnicodeDecodeError, OSError):
            continue
        hits += [f"{rel}:{i}" for i, line in enumerate(lines, 1) if pat.search(line)]
    return hits


def teach(app_dir, first):
    """Keep the app's AI instructions current: the Stylist section of AGENTS.md / CLAUDE.md.

    Between the stylist markers the section is replaced on every run, so it follows Stylist's
    updates. The first time, it's added to AGENTS.md (created if needed); a CLAUDE.md that
    doesn't exist yet is created as a pointer to it, since Claude reads that name.
    An instructions file that already explains Stylist without the markers is left alone."""
    block = f"{BLOCK_START}\n{(ROOT / 'templates' / 'agents-block.md').read_text(encoding='utf-8').strip()}\n{BLOCK_END}\n"
    files = [app_dir / n for n in ("AGENTS.md", "CLAUDE.md") if (app_dir / n).exists()]
    for f in files:
        text = f.read_text(encoding="utf-8")
        if BLOCK_START in text and BLOCK_END in text:
            a, b = text.index(BLOCK_START), text.index(BLOCK_END) + len(BLOCK_END)
            new = text[:a] + block.rstrip("\n") + text[b:]
            if new != text:
                f.write_text(new, encoding="utf-8")
                return f"{f.name} (Stylist section updated)"
            return None
    if not first or any("stylist" in f.read_text(encoding="utf-8").lower() for f in files):
        return None
    agents = app_dir / "AGENTS.md"
    old = agents.read_text(encoding="utf-8").rstrip("\n") + "\n\n" if agents.exists() else "# Notes for AI assistants\n\n"
    agents.write_text(old + block, encoding="utf-8")
    done = ["AGENTS.md (Stylist section added)"]
    if not (app_dir / "CLAUDE.md").exists():
        (app_dir / "CLAUDE.md").write_text("@AGENTS.md\n", encoding="utf-8")
        done.append("CLAUDE.md (points to AGENTS.md)")
    return ", ".join(done)


def fnv(text):
    """Fingerprint of a text file, the same as Stylist's fnv(): FNV-1a over UTF-8, line endings normalised."""
    h = 0x811C9DC5
    for byte in text.replace("\r\n", "\n").strip().encode("utf-8"):
        h = ((h ^ byte) * 0x01000193) & 0xFFFFFFFF
    return f"{h:08x}"


def read_setup(path):
    """The JSON block, and the files written after it (logos you changed in Stylist)."""
    text = Path(path).read_text(encoding="utf-8")
    m = re.search(r"```json\s*\n(.*?)\n```", text, re.S)
    raw = m.group(1) if m else text[text.find("{"):text.rfind("}") + 1]
    if not raw.strip():
        sys.exit("export: no JSON found in the setup")
    try:
        setup = json.loads(raw)
    except json.JSONDecodeError as e:
        sys.exit(f"export: the setup isn't valid JSON ({e})")
    if "settings" not in setup:
        sys.exit("export: the setup has no settings")
    setup["_files"] = {name: body for name, body in re.findall(r"<!-- stylist-file (\S+) -->\s*\n````\w*\n(.*?)\n````", text, re.S)}
    return setup


def style_fp(cj):
    """Fingerprint of an app's style (settings + pins), the same as Stylist's styleFp()."""
    body = {"pins": cj.get("pins") or {"light": {}, "dark": {}}, "settings": cj.get("settings") or {}}
    return fnv(json.dumps(body, sort_keys=True, separators=(",", ":"), ensure_ascii=False))


def check_origin(app_dir, setup):
    """A setup restyles an app only if it was made from the app's current style (loaded in Stylist first).
    A new app (no stylist.json yet) has nothing to compare with, so it goes through."""
    current = app_dir / "stylist.json"
    if not setup or not current.exists():
        return []
    name = setup.get("app") or app_dir.name
    frm = setup.get("from") or {}
    try:
        fp = style_fp(json.loads(current.read_text(encoding="utf-8")))
    except (json.JSONDecodeError, AttributeError):
        return [f"{name}'s stylist.json isn't valid JSON, so the setup can't be checked against it."]
    if not frm.get("style") or frm.get("new"):
        return [f"This setup wasn't made from {name}'s current style. Load it in Stylist first (Share → Open from GitHub…), then send again."]
    if fp not in frm["style"]:
        return [f"{name}'s style changed since it was loaded in Stylist" + (f" on {frm['loaded']}" if frm.get("loaded") else "") + ". Load it again (Share → Open from GitHub…), then send again."]
    return []


def check_brand(app_dir, setup):
    """Logos in the setup: arrived intact, and the app's files are still the ones the setup was made from."""
    brand = (setup or {}).get("brand") or {}
    files = (setup or {}).get("_files", {})
    problems, todo = [], []
    for e in brand.get("files", []):
        name = e.get("name", "")
        if not name.startswith("brand/") or ".." in name:
            problems.append(f"{name}: not a brand file path")
            continue
        body = files.get(name)
        if body is None or fnv(body) != e.get("hash"):
            problems.append(f"{name}: arrived damaged or incomplete. Send the setup again, as a file.")
            continue
        cur = app_dir / name
        if name.endswith(".svg"):
            if cur.exists() and e.get("base") is None:
                problems.append(f"{name}: the app already has this file, and the setup wasn't made from it. Load the app in Stylist first (Open from GitHub), then send again.")
            elif cur.exists() and fnv(cur.read_text(encoding="utf-8")) != e["base"]:
                problems.append(f"{name}: changed in the app since the setup was made.")
            elif not cur.exists() and e.get("base") is not None:
                problems.append(f"{name}: removed from the app since the setup was made.")
        todo.append((name, body))
    return problems, todo, brand.get("removed", [])


def app_files(app_dir):
    files = []
    for p in sorted(app_dir.iterdir()):
        if p.is_file() and STYLE_FILES.match(p.name):
            files.append([p.name, p.read_text(encoding="utf-8")])
    brand = app_dir / "brand"
    if brand.is_dir():
        files += [[p.name, p.read_text(encoding="utf-8")] for p in sorted(brand.glob("*.svg"))]
    return files


async def run(app_dir, setup, brand_files=(), removed=()):
    files = app_files(app_dir)
    first = not any(n == "stylist.json" for n, _ in files)
    was_version, was_fw = app_version(app_dir)
    extra = json.loads(os.environ.get("STYLIST_EXTRA_RENAMES", "[]"))  # tests only: renames to try before a real one exists
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
            """async([files,setup,first,extra])=>{TOKEN_RENAMES.push(...extra);localStorage.clear();APP=appDefault();S={...PRESETS[0]};apply();
            if(!first)await openFiles(files.map(([n,t])=>new File([t],n)));
            if(APP.review.length)return {review:APP.review.map(r=>`${r.kind} --${r.v}: ${r.from??'(none)'} → ${r.to??'(none)'}`)};
            const before=first?{light:{},dark:{}}:(APP.snapshot||parseCSS(coreCSS(APP.target)));
            if(setup){const cj=migrate({stylist:1,framework:FRAMEWORK,...setup});S=sanitizeS({...S,...cj.settings});
              if(cj.pins)APP.pins={light:{},dark:{},...cj.pins};if(cj.target&&TGT[cj.target])APP.target=cj.target;if(cj.app)APP.name=cj.app;apply()}
            const pk=buildPackage(APP.target),after=pk.snap,changed=[];
            for(const m of ['light','dark'])for(const k of new Set([...Object.keys(before[m]||{}),...Object.keys(after[m]||{})])){
              const a=(before[m]||{})[k],b=(after[m]||{})[k];if(a!==b)changed.push(`${m} --${k}: ${a??'(none)'} → ${b??'(none)'}`)}
            return {target:APP.target,files:pk.files.map(f=>[f.name,f.text]),changed,version:VERSION,framework:FRAMEWORK,notes:FRAMEWORK_NOTES,
              renames:TOKEN_RENAMES.map(r=>({since:r.since,old:outName(APP.target,r.from),new:outName(APP.target,r.to)}))}}""",
            [files, {k: v for k, v in setup.items() if k != "_files"} if setup else None, first, extra],
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
        if name.startswith("brand/"):
            continue  # logos come only from the setup's own brand files (below), never regenerated
        if name in have:
            dest = app_dir / name
            dest.parent.mkdir(exist_ok=True)
            if not dest.exists() or dest.read_text(encoding="utf-8") != text:
                dest.write_text(text, encoding="utf-8")
                written.append(name)
        else:
            skipped.append(name)

    for name, body in brand_files:
        dest = app_dir / name
        dest.parent.mkdir(exist_ok=True)
        body = body.replace("\r\n", "\n").strip() + "\n"
        if not dest.exists() or dest.read_text(encoding="utf-8") != body:
            dest.write_text(body, encoding="utf-8")
            written.append(name)
    if removed:
        print("Removed in Stylist, still in the app (ask before deleting): " + ", ".join(removed))
    taught = teach(app_dir, first)
    if taught:
        written.append(taught)
    fonts = own_font_links(app_dir)
    if fonts:
        print("The app loads Google fonts itself (" + ", ".join(fonts) + "). stylist-theme.css loads the fonts now:")
        print("  remove those lines (the font link and its preconnects) in the same commit, or they keep loading other fonts.")
    if first:
        print(f"First time: added the Stylist files for {out['target']} ({', '.join(written)}).")
        print("Next: load stylist-theme.css, then app-tokens.css, then stylist-icons.css before the app's own styles,")
        print("and switch the app's styles to the tokens one area at a time (README: Style a new app).")
        return
    print(f"Target: {out['target']}")
    if was_version and vtuple(was_version) < vtuple(out["version"]):
        new = [out["notes"][str(f)] for f in range(was_fw + 1, out["framework"] + 1) if str(f) in out["notes"]]
        print(f"Upgrade: the app's files were made with Stylist {was_version}, now {out['version']}." + (f" New since then: {'; '.join(new)}." if new else ""))
    changed = [c for c in out["changed"] if "(none)" not in c]
    added = [c for c in out["changed"] if c.split(": ", 1)[1].startswith("(none)")]
    removed = [c for c in out["changed"] if c.endswith("→ (none)")]
    print("Changed tokens:" if changed else "No token values changed.")
    for line in changed:
        print("  " + line)
    if added:
        print(f"New tokens ({len(added)}), added without changing anything the app uses: " + ", ".join(c.split(" ", 1)[1].split(":")[0] for c in added[:12]) + (" …" if len(added) > 12 else ""))
    if removed:
        print("Removed tokens (check the app doesn't use them):")
        for line in removed:
            print("  " + line)
    olds = [r for r in out["renames"] if not was_version or vtuple(r["since"]) > vtuple(was_version)] if was_version else out["renames"]
    hits = old_names_in_code(app_dir, olds)
    if hits:
        print("Older token names in the app's code (they still work, through aliases; switch them when convenient):")
        for h in hits:
            print("  " + h)
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
    problems = check_origin(app_dir, setup)
    if problems:
        print("Stopped: " + problems[0])
        print("Nothing was written. Starting from the app's current style keeps settings you didn't mean to change.")
        sys.exit(2)
    problems, brand_files, removed = check_brand(app_dir, setup)
    if problems:
        print("Stopped: the logos in this setup don't match the app:")
        for line in problems:
            print("  " + line)
        sys.exit(2)
    asyncio.run(run(app_dir, setup, brand_files, removed))


if __name__ == "__main__":
    main()
