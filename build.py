#!/usr/bin/env python3
"""Build Stylist into one self-contained page: dist/index.html.

The artifact must be a single HTML file, so the sources are joined back in order:
  src/index.html   the page shell, with three placeholders
  src/css/*.css    joined in file-name order  -> /*@stylist:css*/
  src/data/icons.json                         -> /*@stylist:icons*/
  src/js/*.js      joined in file-name order  -> /*@stylist:js*/

The files are concatenated exactly, byte for byte: no minifying, no reformatting.
All JS files share one scope (one <script>), so their order matters.

Usage:
  python3 build.py                 build dist/index.html
  python3 build.py --check FILE    build, then fail unless it equals FILE (e.g. the live page)
"""
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT = ROOT / "dist" / "index.html"
SLOTS = {
    "/*@stylist:css*/": lambda: "".join(p.read_text(encoding="utf-8") for p in sorted((SRC / "css").glob("*.css"))),
    "/*@stylist:icons*/": lambda: (SRC / "data" / "icons.json").read_text(encoding="utf-8"),
    "/*@stylist:js*/": lambda: "".join(p.read_text(encoding="utf-8") for p in sorted((SRC / "js").glob("*.js"))),
}


def build() -> str:
    page = (SRC / "index.html").read_text(encoding="utf-8")
    for slot, fill in SLOTS.items():
        if page.count(slot) != 1:
            sys.exit(f"build: {slot} must appear exactly once in src/index.html")
        page = page.replace(slot, fill())
    return page


def main() -> None:
    page = build()
    OUT.parent.mkdir(exist_ok=True)
    OUT.write_text(page, encoding="utf-8")
    print(f"built {OUT.relative_to(ROOT)} ({len(page.encode('utf-8')):,} bytes)")
    if len(sys.argv) == 3 and sys.argv[1] == "--check":
        other = Path(sys.argv[2]).read_text(encoding="utf-8")
        if other != page:
            for i, (a, b) in enumerate(zip(page, other)):
                if a != b:
                    break
            else:
                i = min(len(page), len(other))
            line = page.count("\n", 0, i) + 1
            sys.exit(f"check: differs from {sys.argv[2]} at line {line}")
        print(f"check: identical to {sys.argv[2]}")


if __name__ == "__main__":
    main()
