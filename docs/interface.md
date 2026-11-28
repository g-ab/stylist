# Stylist ↔ Cast interface

Read this first. Open the full artifacts only if this doc isn't enough.

## Links (they always serve the latest version)
- Cast: https://claude.ai/artifact/2QPDrZcFvV5MQnY8CWc2Q9 (multi-file artifact)
- Stylist: https://g-ab.github.io/stylist/ (the old Claude artifact link now only points there) (published from `dist/index.html`; ~100 KB of it embedded icon data; declares the `downloads` capability)
- Detailed Cast status: `claude/cast-status.md`
- Stylist source: https://github.com/g-ab/stylist (`src/` → `build.py` → `dist/index.html`, the page that's published). This file is `docs/interface.md` there; the project doc is a copy.

## What Stylist is
Stylist is gab's styling tool. It sits above any design system, and it is three things:
- **Framework:** the properties that can be styled. Framework 1: colour, typeface, corners, density. Framework 2: + container tint, shadows (corners became one size + pill; density gained a spacing unit). Framework 3: + control heights (xs/sm/md/lg) and focus. Framework 4: + icon set. **Framework 5 (current):** + letter spacing. Brand assets are files, not a framework setting (see Brand).
- **Tool:** previews and edits styles, but only within the framework.
- **Adapter:** exports a set of styles for **Plain CSS** (no library), **shadcn** or **Radix Themes**. The files become one piece of the app's design system.

Stylist never edits component code. It owns the core tokens and edits only where app tokens point and pinned values.

**Tailwind on its own is not a target (removed 22 Nov 2026):** it's a CSS framework with no components, Stylist exports styles, and the shadcn export already carries the Tailwind parts shadcn needs (`--spacing`, corner sizes). A Tailwind-only app can read the Plain CSS variables (`bg-(--sheet)`, `h-(--control-md)`). Files exported for Tailwind open as Plain CSS. **Chakra UI v3** was considered: it would map well (50–950 palettes plus semantic tokens), but its theme is a TypeScript `createSystem` config, not CSS, so it means a new export format. Parked until an app uses Chakra.

## The library lens (not coupling)
- The library choice is a dropdown in the panel's top bar, next to Share (shows "CSS", "shadcn" or "Radix", then "Reset to defaults"). It's `APP.target` (`css` | `shadcn` | `radix`), the same setting the Custom view and the package use.
- **Settings are always stored in Stylist's terms, never a library's.** The library only adds a caption under a control (`lensText()`: "Radix · --radius-factor 1", "shadcn · h-9") and greys out what that library fixes (`LENS_OFF`), with the reason.
- Greyed controls, the panel demos and the preview show what that library actually draws (`effHpx()`, `effFocus()`, `effBar()`), while Stylist's values stay saved and come back on switching library.
- Exports only write each library's documented tokens, never its internal classes or component variables (checked against Radix Themes 3.3.0's stylesheet).
- What each library fixes: **Radix**: focus shape, width and offset (2px outline, offset 2), and control heights (sizes 1–4 = `--space-5…8` = 6, 8, 10, 12 × unit). **shadcn**: focus shape, width and offset (3px ring, no offset, in component code).

## Icons (framework 4, own tab)
- **The setting applies to the whole icon library in the app, not only to the icons Stylist previews.** Stylist's embedded icons are just its preview.
- Three sets, chosen 22 Nov 2026: **Lucide** (ISC, `lucide-react`, shadcn's default), **Tabler** (MIT, `@tabler/icons-react`), **Phosphor** (MIT, `@phosphor-icons/react`). Hugeicons (gab doesn't like the style) and Remix (licence unclear) were left out.
- `icons` = {set: lucide | tabler | phosphor, stroke 1–3 in 0.25 steps (Lucide, Tabler), weight thin | light | regular | bold | fill | duotone (Phosphor; all six kept on purpose, it's the set that handles styling best)}. Default: Lucide, stroke 2.
- **Tabler is outline only.** Filled icons are a per-case design choice made in code, not a whole-app style; the Outline/Filled control was removed, and older settings with `style` drop it.
- Stylist embeds 40 role icons per set (Phosphor in all 6 weights) from npm: lucide-static 1.77, @tabler/icons 3.52, @phosphor-icons/core 2.1. Roles: preview tools (pencil, wand, cursor, measure, split, box, eraser, fit), tabs (file, page, arrange), actions (plus, close, more, download, link, send, rotate, globe, trash, copy, edit), status (check, ok, alert, info, error, loader), files (folder, folder-open, image), navigation (home, search, menu, settings) and arrows (left, right, up, down, chevron).
- In the HTML, preview icons are `<svg class="ic" data-i="role">`, filled by `hydrateIcons()`; `iconSVG(role)` writes one. Mode classes are `ic-st` (stroked) and `ic-fl` (filled). Don't use `fl`, which is the floating-bar class.
- Tab: set picker; then a Stroke slider (Lucide, Tabler) or weight tiles (Phosphor); a preview strip (Navigation, Actions, Status, Files, Arrows); and a library caption. No legend or sample note (removed at gab's request).
- **Export, as code ready to plug in** (`iconFiles()`):
  - Lucide / Tabler → **`stylist-icons.css`**: one global rule, `svg.lucide { stroke-width: var(--icon-stroke, N) }` or `.tabler-icon, svg.icon-tabler { … }` (React package and SVG/web classes). Import once, after `stylist-theme.css`. Header "Stylist icons"; the importer skips it.
  - Phosphor → **`stylist-icons.tsx`**: `<StylistIcons>` wraps the app once and sets the weight through Phosphor's `IconContext`. For plain HTML: `@phosphor-icons/web` with the class `ph-<weight>`.
  - **`icon-setup.md`**: two steps (install the package, add the file), plus a library note (shadcn: swap `lucide-react` imports unless Lucide; Radix: keeps its own icons inside its controls).
  - `--icon-stroke` (stroked sets) is also in the core file for every target. A changed `--icon-stroke` can be matched with controls.

## Brand (own tab and view; reworked 23 Nov 2026 for "drop once, fits everywhere")
- **One drop zone** at the top of the Brand tab (also click to pick several files). Drop all SVGs at once; Stylist sorts them (`addBrandFiles()`):
  - kind from the file name (favicon / mark, symbol, icon, glyph, monogram / logo, wordmark, lockup), else by shape: ratio ≥ 1.5 → Logo, else Mark;
  - light or dark from the name (dark, white, inverse, negative, reversed, on-dark… / light, black, positive…), else by lightness: of two unnamed files of a kind, the lighter one is the dark-mode file; a lone very light file (lum > .75) goes to dark mode.
  - Dropping one file on a slot still forces that slot. Loose SVGs dropped on Custom go through the same sorting.
- **Every file is fitted** (`fitSVG()`): scripts, `foreignObject`, `on*` attributes and external hrefs removed; given a viewBox (from width/height, or measured); trimmed to its drawn pixels (rendered at 480px); Mark and Favicon centred in a square. Width/height are removed, so the height you set is the height you see. Stored per slot as `{name, svg, ratio, lum, full, fit:2}`; files from before this are refitted quietly.
- Slots: Logo, Mark, Favicon, each Light mode / Dark mode. Dark is optional: `brandOf()` falls back to the other mode's file. **No favicon → made from the mark** (shown as "From your mark").
- **Warnings** (`brandWarns()`): a file (or its fallback) too close to that mode's `--sheet` (contrast of its average colour < 1.45) → "Hard to see in dark/light mode… drop a light/dark-coloured version"; a nearly square logo.
- **Brand view:** the three assets (label says which mode's file is shown, or "made from the mark"); "Fits your components": the mark at the 4 control heights (`effHpx()`) as icon button and avatar, labelled per library (Plain CSS `--control-*`, shadcn `size-N`, Radix sizes 1–4); a full-bleed mark (`full`: app-icon style) fills them, a bare symbol gets icon-like padding (56% in the button, 62% in the avatar); logo in a header bar of `effBar()` height. "In context": header, sign-in, browser tabs at 16/32/64.
- **Package (`brandFiles()`):** `brand/logo.svg`, `logo-dark.svg`, `mark.svg`, `mark-dark.svg` (only those set, all fitted); `brand/favicon.svg`, which **switches with the OS theme by itself** when a dark version exists (both versions inside, `prefers-color-scheme`; marked `<!-- stylist:favicon from=favicon|mark -->`); `brand/brand.css` when a logo or mark has both modes (`.brand-light` / `.brand-dark` swapped by the target's dark selector: `:root[data-theme="dark"]` plus the media query for Plain CSS, `.dark` for shadcn, `.dark, .dark-theme` for Radix; header "Stylist brand", skipped on import); `brand/README.md` (favicon link, light/dark markup, shadcn `AvatarImage` / Radix `Avatar` hints). `stylist.json` lists them under `brand`.
- **Re-import:** exact names restore their slots; a favicon made from the mark is skipped (it's regenerated); an adaptive favicon is split back into light and dark.

- **Download brand files** (Brand tab, 27 Nov 2026): a `<app>-brand.zip` with just `brandFiles()` (fitted SVGs, `brand.css`, `README.md`), off while no brand file is set. For new logos without exporting the whole package; the fallback when changed logos are too big for Send to your agent.

## Letter spacing (framework 5, Typeface tab)
- **One control** (gab's call, 23 Nov 2026): `track` = {base} in em, default 0. Field steps 0.005em; values round to 0.001em, range −0.2 to 0.5. Applies to all text.
- The named scale isn't editable: each step = Tailwind's default + Tracking (tighter −0.05, tight −0.025, normal 0, wide 0.025, wider 0.05, widest 0.1). Tokens view shows each step on a heading and a label.
- **Export:** Plain CSS `--tracking`, `--tracking-tighter…widest` (app puts `letter-spacing: var(--tracking)` on body). shadcn: `--tracking` in `:root`, `--tracking-*` in `@theme inline` (add `tracking-(--tracking)` to body). Radix: `--default-letter-spacing` = Tracking and `--letter-spacing-1…9` = Radix's own per-size values + Tracking.
- Any `--tracking*` or `--default-letter-spacing` change can be matched with controls. `migrate()` gives framework < 5 files Tracking 0.

## Containers and shadows
- **Containers** (`tint` 0–100): cards, panels and menus, meaning `--sheet` only. 0 is pure white in light mode and an untinted near-black in dark mode (the default, gab's choice). 50 is the pre-framework-2 look. 100 is twice that tint. The direction comes from the Neutrals slider. The page background (`--paper`) keeps following Neutrals.
- **Shadows**, Radix-style: 4 levels, each with a role. `--shadow-inset` (inputs, wells), `--shadow-raised` (cards, bars, panels), `--shadow-floating` (menus, popovers, toasts), `--shadow-overlay` (dialogs). All are built from `shStr` (strength 0–100; 0 means none) and `shSoft` (softness 0–100). The colour comes from the neutral hue, and dark mode uses stronger opacity. Defaults of 50/50 reproduce Cast's previous hard-coded shadows.
- **Shadow export:** Plain CSS uses the 4 names. shadcn maps them to Tailwind's 8 sizes: raised → `shadow-sm`, floating → `shadow-lg`, overlay → `shadow-2xl`, inset → `inset-shadow-sm`, with the rest filled in between. Radix gets `--shadow-1…6`. JSON has a `shadow` group.
- The tokens carry elevation only. Borders and rings around cards stay separate.

## Focus (framework 3, under the Shadows tab)
- `focus` = {shape: ring | outline, w 1–6px, off 0–6px, str 10–100%}. Default: ring, 2px, offset 2, 100%.
- Tokens: `--focus` (colour = accent line at the strength, light and dark), `--focus-width`, `--focus-offset`, `--focus-ring` (two box-shadows: a `--sheet` gap of the offset, then the ring; `0 0 #0000` for outline) and `--focus-outline` (`var(--focus-width) solid var(--focus)`, or `none` for ring).
- **Export:** Plain CSS gets all of them. shadcn gets `--ring` = the focus colour; its width lives in component code. Radix gets `--focus-8` = the focus colour.

## Corners
- One choice sets the whole scale: `radius` is the lg size in px (0–32), and `pill` makes controls pill-shaped. Sidebar tiles: None 0 · XS 2 · S 4 · M 6 · L 8 · XL 12 · 2XL 16 · Full (XL + pill).
- The steps keep Radix's proportions: xs .375 · sm .5 · md .75 · lg 1 · xl 1.5 · 2xl 2 (Radix's 3·4·6·8·12·16 px at factor 1).
- `--radius-round` is `0px`, or `9999px` with Full. Buttons and fields use `max(var(--radius-lg), var(--radius-round))`; cards keep their own corner. `--radius-pill` (999px) stays. Bars use lg + min(inset, lg), so None is fully square.
- **Export:** Plain CSS has `--radius-xs…2xl`, plus round and pill. shadcn gets `--radius` = lg plus an `@theme inline` block with the exact `--radius-xs…2xl` (keep it after shadcn's own); shadcn buttons need `rounded-full` added by hand for pill. Radix gets `--radius-factor` = lg/8, `--radius-full` (9999px with Full) and `--radius-thumb`.
- Old presets convert as sharp → 4, soft → 8, round → 12.

## Density, control heights and spacing
- **Density presets** set inset, text size, the spacing unit and the 4 heights. Compact: unit 3px, heights 21/24/30/36. Default: unit 4px, heights 24/28/36/44. Roomy: unit 5px, heights 30/35/40/50 (Roomy md was 42 before framework 3). Changing the unit or a height makes the density Custom.
- **Control heights** (`h` = {xs, sm, md, lg}) are stored as **multiples of the spacing unit** (3–24), so shadcn's `h-N` classes land exactly. Fields in px; each arrow press is one unit. Bar = md + 2 × inset.
- Tokens: `--control-xs…lg`, `--control` (= md) and `--bar` (Plain CSS).
- In the Density tab, a read-only "Follow these heights" list: Button, Input, Select, Segmented control and Toolbar button follow; Bar is md + 2 × inset; checkbox, radio, switch and tabs keep their own size.
- **Spacing unit** (own tab): whole px (2–12); the field shows rem, and each arrow press is 2px (0.125rem). Typed values round to whole pixels. gab tried 0.005rem steps and rolled them back. Scale: `--space-N` = N × unit for N in 1, 2, 3, 4, 6, 8, 12, 16. `--gap` = 2 × unit. Changing the unit scales the heights with it.
- **Export:** Plain CSS has `--space-*` in px. shadcn gets `--spacing` in rem (in its `@theme inline` block); there, `w-*` and `h-*` scale too. Radix gets `--space-1…9` = unit × 1, 2, 3, 4, 6, 8, 10, 12, 16, not `--scaling`.

## Radix Themes target
- Stylist's accent and support take over the nearest Radix colour names (Tailwind → Radix: emerald→jade, fuchsia→plum, rose→ruby, others the same; if support collides with accent, it becomes iris). Each gets steps 1–12, alpha steps a1–a12 computed over gray-1, plus contrast, surface, indicator and track. `--gray-*` is overridden too. Selectors are `:root, .light, .light-theme` and `.dark, .dark-theme`.
- `.radix-themes` (dark: `.dark .radix-themes, …`) gets `--color-background` (paper), `--color-panel-solid` and `--color-surface` (sheet), `--focus-8`, the font families, the radius factor, full and thumb, `--space-1…9`, `--icon-stroke`, and `--shadow-1…6`: 1 inset · 2–3 raised · 4–5 floating · 6 overlay, each with Radix's hairline ring.
- Use: load after `@radix-ui/themes/styles.css`, with `<Theme accentColor="<name>" grayColor="gray">`. The radius prop no longer matters.
- App tokens point to `--gray-N`, `--accent-N` or the named support scale; other Stylist tokens ride along as `--stylist-<name>`. Radix-only names are pinned as `@radix:<name>`.
- Custom components written with Plain CSS names (`--radius-lg`, `--sheet`…) don't exist in a Radix app; the Custom view flags those names in red for that target.

## Token layers (each reads only from the one above)
1. **Core tokens:** owned by Stylist, generated into `stylist-theme.css`, never edited by hand.
2. **App tokens:** owned by the app, in `app-tokens.css`. Each one either points to a core token (`--grid: var(--gray-3)`, or a strength like `color-mix(... var(--ink) 5% ...)`) or is a pinned raw value. App tokens can't reuse core names.
3. **Components:** library and custom. Styled with tokens only, never raw values.

## The package (Custom view → Export package, downloads as one .zip)
- `stylist.json`: `stylist` (schema, now 1), `framework` (now 5), `app`, `target` (css | shadcn | radix; old files may say tw, which opens as css), `exported`, `settings` (id, fam, sat, warm, tint, shStr, shSoft, sup, supFam, ui, mono, radius, pill, dens, unit, h, focus, icons, track), `fontFiles`, `pins` {light, dark}, `snapshot` {light, dark} (every core var exactly as exported, including `@theme` blocks), `changelog`, `brand` (list of brand files).
- `stylist-theme.css`: core tokens in the target's format, with a "Generated by Stylist" header. In shadcn and Radix, core tokens keep the library's names, and Stylist-only tokens that app tokens point to ride along as `--stylist-<name>`.
- `app-tokens.css`: header "Stylist app tokens". Light values go in `:root` (Radix: `.radix-themes`). The dark block is `:root[data-theme="dark"]` (plus the media query) for Plain CSS, `.dark` for shadcn, and the Radix dark selector for Radix. Load it after the core file.
- `icon-setup.md` + `stylist-icons.css` (Lucide, Tabler) or `stylist-icons.tsx` (Phosphor): see Icons.
- `brand/*.svg`, `brand/brand.css`, `brand/README.md`: see Brand.
- `components.json`: `{app, components:[{name, tokens, html, css}]}`. Stylist renders each one in a shadow root, themed with exactly the variables the exported files define (for Radix, also its runtime `--radius-1…6`). Each component is marked "Follows heights" (uses height tokens or `h-N`) or "Fixed Npx" (a hard-coded height in the control range, 16–64px).
- "Export tokens…" (quick copy) offers CSS variables, shadcn, Radix and JSON.

## Restyling an app from a setup (26 Nov 2026)
- **Share → Send to your agent…** (27 Nov 2026; was "Copy setup for AI") opens a small dialog, decided by size alone (`PASTE_MAX`, 8,000 characters). Fits a paste: "Copy and paste the styling settings in your app’s agent chat." with [Download file] [**Copy**]. Too long: "Download the file and ask your agent “apply this”." with [**Download file**] only (`<app>-stylist-setup.md`). Notes appear only when needed (logos too big, logos removed, own font files). The setup is short (about 750 characters with settings only): a first line "Apply this Stylist setup to <app>. How: …/APPLY.md", notes only when needed (logos, removals, own fonts), then the recipe as one-line JSON in a ```json block. The steps live in `APPLY.md` in the Stylist repo, so agents always read the current ones. The JSON holds `stylist`, `framework`, `app`, `target`, `settings` (every recipe key, `RECIPE_KEYS`), `pins` and, once an app is loaded, `from` (28 Nov 2026): `{style:[fp…], loaded, source?, new?}`. `style` lists fingerprints (`styleFp()`: FNV-1a over the canonical JSON of settings + pins, sorted keys) of the app's style as loaded plus every setup or package made since in that session (`APP.origin.sent`), so a second setup still fits an app that already took the first. `APP.origin` is set by Open app style… / dropping files / Open from GitHub (`source: github:owner/repo`) and Start a new app (`new:true`); none while no app is loaded. **Logos travel only when changed:** `brandDelta()` compares `brandFiles()` with the changed slots (`brSlotChanged`) put back to `brandBase`; differing files go in the JSON as `brand.files[{name,hash,base}]` (FNV-1a fingerprints of the new file and of the app's file it replaces; `base:null` = new) plus `brand.removed`, and their text follows the JSON in `<!-- stylist-file brand/… -->` blocks fenced with four backticks. Over 30 KB of SVG → none included, the panel and the text point to Download brand files. Own font files aren't included.
- **`export.py APP_DIR [SETUP]`** (Stylist repo). It never regenerates logos: brand files come only from the setup. Before writing anything it checks each one: fingerprint intact, and the app's file still the one the setup was made from (or absent when new). Otherwise exit 2. Removed logos are listed, not deleted. **First time** (no stylist.json in APP_DIR): needs SETUP, writes every package file, and prints the next steps (load the files, connect the app's styles to the tokens). **Otherwise** it first checks the setup's `from` (`check_origin`): no `from`, or `new`, → exit 2 "wasn't made from <app>'s current style. Load it in Stylist first"; the app's current stylist.json fingerprint not in `from.style` → exit 2 "changed since it was loaded". Nothing is written. Then it runs Stylist's own code headless: opens the app's current files like "Open app style…", **stops (exit 2) if the theme file was edited by hand** since the last export, applies the setup's settings and pins, writes the package files the app already has (plus theme, app tokens, stylist.json), and prints every token value that changed. Without SETUP it just regenerates the files.
- **The app's AI instructions** come from `templates/agents-block.md`: export.py writes them between `<!-- stylist:start -->` / `<!-- stylist:end -->` in the app's AGENTS.md the first time (and creates `CLAUDE.md` = `@AGENTS.md` when missing), then refreshes that section on every run. An instructions file that already mentions Stylist without the markers is left alone. Cast uses the markers (AGENTS.md since 27 Nov 2026), so its section stays current too.
- So restyling an app is: style in Stylist → Send to your agent (Copy or Download file) → paste or attach in the app's chat → it runs export.py, shows the diff, commits.

## Open from GitHub (26 Nov 2026)
- Share menu and Custom view: **Open from GitHub…** asks for `owner/repo` (or `owner/repo/folder`, or a github.com link incl. `/tree/<branch>/<folder>`). It fetches `stylist.json`, `stylist-theme.css`, `app-tokens.css`, `components.json`, `stylist-icons.css` and `brand/{logo,mark,favicon}[-dark].svg` from raw.githubusercontent.com (default branch, no cache) and hands them to `openFiles()`, like Open app style…. Public repos only.
- The last repo is remembered (`stylist.gh.v1`), so syncing again is one click. "Copy link" gives `?app=owner/repo[/folder]`, which opens Stylist with that app loaded.
- Works on the website; the old Claude artifact copy (which couldn't reach other sites) is retired.

## Versions and safe upgrades (27 Nov 2026)
- `VERSION` = `<format>.<framework>` (now 1.5), shown next to Stylist's name and written into `stylist.json` (`version`) and the theme's header ("Generated by Stylist 1.5"). Older files without it count as `<stylist>.<framework>`.
- An upgrade (`export.py <app>`, no setup) reads the app's version, opens its files (old settings go through `migrate()`, which gives new settings the defaults that keep the old look), rewrites them for the current version and reports: the versions and `FRAMEWORK_NOTES` since; changed tokens (should be none); new tokens; removed tokens; old token names found in the app's own code.
- `TOKEN_RENAMES` (`{since, from, to}`, empty today): every export adds an "Older names" block (`--old: var(--new)`) after the theme, so app code written for an older version keeps working; export.py scans the app's code files for the old names and lists file:line.
- Tests upgrade every fixture and a simulated framework-4 app, and fail if any existing value changes.

## Round trip (Open app style… or drop the files on Custom)
- Stylist compares the core file with `snapshot`. Without stylist.json, it compares with what Stylist would export now. `stylist-icons.*` files are ignored on import; brand SVGs are restored to their slots.
- For each change: **Match with controls** (accent, support, fonts, any radius step or Radix factor, spacing unit, control heights, text size, icon stroke; closest match), **Pin** (an exception kept on every export; library-only names are pinned as `@shadcn:<name>` or `@radix:<name>`), or **Revert**. An added var can be **moved to app tokens**; a removed one is **restored**. Shadows can be pinned but not matched.
- Every decision goes in the changelog, with an optional reason.
- `migrate()` fills older stylist.json files: framework 1 gets `tint 50, shStr 50, shSoft 50`; `round` becomes `radius`; a missing `unit` comes from the density; framework < 3 gets heights from its density preset and the default focus; framework < 4 gets Lucide at stroke 2 (the closest match to Stylist's old hand-drawn icons); framework < 5 gets the default letter spacing. A newer framework is flagged.

## Cast (the first app)
App tokens, now in Cast's app layer and no longer in the core: `--grid → gray-3`, `--grid-major → gray-5`, `--axis → gray-8`, `--pencil → gray-10`, `--fill → ink 5%`, `--cut` (pinned #d9480f / #ff8a4c), `--clay` (pinned #d6b19a / #a9806a). Cast's components (Canvas view, Sketch, 3D model, Title bar) live in its own `components.json`; Stylist no longer has any of them built in (since 28 Nov 2026). Cast's target is Plain CSS.

**Adopted in Cast on 25 Nov 2026** (Plain CSS package; details in `claude/cast-status.md`).

### Cast core tokens (what Stylist maps to)
CSS variables on `:root`, light by default. Dark mode via `prefers-color-scheme` (unless `data-theme="light"`) or `:root[data-theme="dark"]`. Values below are Cast's current ones; Stylist's "Current" preset now exports `--sheet` as white.

| Token | Role | Light | Dark |
|---|---|---|---|
| --paper | app background | #eceff3 | #0d131b |
| --sheet | panels, cards, views | #fbfcfd | #121a24 |
| --ink | main text | #1a2b3c | #dce6f1 |
| --muted | secondary text | #5f6d7c | #8d9bab |
| --rule | borders, dividers | #d5dce4 | #243243 |
| --accent / --accent-strong | primary, hover | #0b5fd0 / #084aa3 | #5ea3ff / #86baff |
| --on-accent | text on accent | #ffffff | #06182f |
| --fill-sel / --hover | accent 10% / ink 6% | | 14% / 7% |
| --danger | destructive | #b4400f | #f08a5d |
| --font-ui / --font-mono | IBM Plex Sans / IBM Plex Mono | | |

Stylist's export also has the scales (gray/accent/support 1–12), support roles, `--accent-text`, `--accent-line`, `--focus` and its tokens, the 4 shadows, the corner scale, control heights, `--icon-stroke`, sizes (bar, control, inset, gap, text-base) and spacing.

## Stylist side
- Stylist's own chrome uses fixed colours (Instrument Sans / Geist Mono) and isn't themed.
- Panel: top bar with the Library dropdown and the Share menu, then icon tabs, one category at a time: Colour (theme dropdown with full-size cards, accent, support, neutrals, containers) · Typeface (families, letter spacing) · Corners (8 visual tiles) · Shadows (shadows + focus with a demo) · Icons (set, stroke or weight, preview strip) · Brand (logo, mark, favicon slots; opening it shows the Brand view) · Density (presets, read-only scope list with hover preview, control heights, follow list) · Spacing (unit field with a ×1–×8 scale). Each relevant group ends with a library caption.
- Views: Components (gallery, then a Heights section at the bottom: one row of controls per size with dashed guides, plus a mixed form row at md showing focus), App preview (the loaded app's own components from its `components.json`, styled live; an empty state with Open from GitHub… / Open app style… when no app is loaded), Tokens (with Shadows, Corners and Spacing cards; point at a token to see its label, name, source and "Used by": Stylist's components that read it, and the loaded app's components in accent), Brand (assets, fits your components, in context), Custom (app name, target, changes and pins, custom tokens, custom components with height status, changelog; with no app loaded, an empty state with Open from GitHub… / Open app style… and "Start a new app" for an app with no Stylist files yet). All preview icons use the chosen icon set.
- "Send to your agent" gives the full recipe for export.py (see Restyling an app from a setup); Export package is still the full hand-off, and the one to use for new brand files.

## Not covered here yet
- **Motion** (added 25 Nov in another chat): tokens `--motion-fast|moderate|slow`, `--ease-*`, `--motion-*-exit`, `--ease-exit`, `--motion-move`; `stylist-motion.ts` for Framer Motion. Needs its own section.
- **Brand** was reworked in another chat after 23 Nov (slot-by-slot drops; brand reset controls). The Brand section above describes the 23 Nov version.
- Nested corner tokens `--radius-bar`, `--radius-segmented`, `--radius-menu`.
- The Export package dialog (25 Nov): files listed by group (Theme, Motion, Icons, Brand, For Stylist) with an SVG preview; footer always visible.

## Keep in sync
Update this doc when:
- Cast adds, renames or removes a token, tokenises a hard-coded value, or adds a screen or major component Stylist should show.
- Stylist changes the package format, the schema or framework version, or "Copy setup".
- A new app starts using Stylist (add its own section).
