# Stylist: rules for working on this repo

Stylist is a UI styling tool.

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
- **The old Claude artifact** (the first home of Stylist) was retired on 28 Nov 2026: it now only shows a short
  "Stylist has moved" page linking to the website. Don't publish `dist/index.html` there.

## Rules that keep upgrades safe
An app upgrades with `export.py <app>` (no setup). It reads which version made the app's files, translates them to
the current one, and must never change a value the app already has. To keep that true:
- **Versions:** `VERSION` (`<format>.<framework>`, in `02-app-layer.js`) is shown in the header and written into
  `stylist.json` and the theme's header. Bump it with `FRAMEWORK`, and when a token is renamed.
- **Adding a styleable property:** bump `FRAMEWORK` and `VERSION`, add a line to `FRAMEWORK_NOTES`, give older files
  a default in `migrate()` **that reproduces how they looked**, and add the key to `RECIPE_KEYS`.
- **Renaming a token:** never just rename it. Add `{since, from, to}` to `TOKEN_RENAMES`: exports keep the old name
  pointing to the new one, and export.py lists app code still using it. Remove an entry only in a new major version
  (`VERSION` 2.x), with a note in `CHANGELOG.md` under "Upgrading".
- **Removing a token:** same as renaming (point it somewhere sensible), or a major version.
- **Every version's packages must keep opening and upgrade unchanged:** before bumping `FRAMEWORK`, save real
  packages of the current version to `tests/fixtures/v<framework>-<library>`. The tests upgrade every fixture
  and fail if any existing value changes.
- Stylist knows no app: no app tokens, components or sample content of any app are built in. App preview shows only the components of the app that is loaded.
- Settings are stored in Stylist's own terms; a library (shadcn, Radix) only changes captions, greyed controls and the export.

## Style
- Stylist's own chrome uses fixed colours (Instrument Sans, Geist Mono) and isn't themed; only the preview (`.pv`) reads the tokens.
- Give short, direct answers, whole-pixel values and no odd decimals in controls.
