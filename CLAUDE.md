# Stylist: rules for working on this repo

Stylist is gab's styling tool.

## Layout
- `src/index.html`: the page shell, with three placeholders (`/*@stylist:css*/`, `/*@stylist:icons*/`, `/*@stylist:js*/`).
- `src/css/NN-*.css`: styles, joined in file-name order.
- `src/js/NN-*.js`: one script, split by feature and joined in file-name order. **All files share one scope**: order matters, and a `const` used at load time must be declared in an earlier file.
- `src/data/icons.json`: the embedded icon paths (Lucide, Tabler, Phosphor). Don't hand-edit; regenerate from npm if the sets change.
- `build.py` → `dist/index.html`, byte-exact concatenation. `dist/` is committed because it's what gets published.
- `APPLY.md`: the steps an AI follows to apply a setup; every setup links to it, so keep it current with `export.py`.
- `export.py`: styles, restyles or upgrades an app's folder from a pasted setup, using `dist/index.html` headless (so build first). It also keeps the app's AI instructions current from `templates/agents-block.md`: change that file when the requests or steps change.
- `tests/run.py`: the checks; `tests/fixtures/v<framework>-<library>`: real packages from earlier versions, which must keep opening.
- `docs/interface.md`: what Stylist does, its tokens, the package format and the Cast hand-off. The claude.ai project doc `claude/stylist-cast-interface.md` is a copy of it.

## Every change
1. Edit `src/`, never `dist/index.html` by hand.
2. `python3 build.py && python3 tests/run.py`: all checks must pass. Add a check when you fix a bug that could come back.
3. Update `docs/interface.md` in the same commit when behaviour, tokens, the package or the framework change, and `CHANGELOG.md` for anything gab would notice.
4. Commit; one feature or fix per commit.

## Publishing
- **GitHub Pages publishes automatically:** every push to `main` runs `.github/workflows/pages.yml`, which checks that `dist/` was rebuilt, runs the tests and deploys `dist/` to https://g-ab.github.io/stylist/. A failing check means nothing gets published.
- The Claude artifact is an optional second copy. If it is still used, the rules below apply to it.
- Publish only `dist/index.html`, built from a committed state with passing tests.
- Before publishing, get the artifact's live version. If it isn't the version this repo last published (see the latest "Published" line in `CHANGELOG.md`), someone changed the artifact outside the repo: download it, compare it with `python3 build.py --check <file>`, and bring those changes into `src/` first. Never overwrite them.
- After publishing, note the new version id in `CHANGELOG.md` and copy `docs/interface.md` to the project doc if it changed.

## Rules that keep files compatible
- **Adding a styleable property:** bump `FRAMEWORK`, give older files a default in `migrate()`, and add the property to `stylist.json` settings.
- **Every package Stylist ever exported must keep opening:** when the framework changes, add a fixture of the old version to `tests/fixtures/`.
- `--clay` and the `.clay` preview classes are Cast's clay-material colour (pottery clay).
- Settings are stored in Stylist's own terms; a library (shadcn, Radix) only changes captions, greyed controls and the export.

## Style
- Stylist's own chrome uses fixed colours (Instrument Sans, Geist Mono) and isn't themed; only the preview (`.pv`) reads the tokens.
- gab prefers short, direct answers, whole-pixel values and no odd decimals in controls.
