# README, audit, and ship

## Table of contents

- [README, audit, and ship](#readme-audit-and-ship)
- [Audit workflow](#audit-workflow)
  - [When to use](#when-to-use)
  - [Steps](#steps)
- [Versioning — once per branch](#versioning-once-per-branch)
- [PR checklist](#pr-checklist)
- [Per-plugin README standard](#per-plugin-readme-standard)
  - [Upload block (canonical)](#upload-block-canonical)
  - [Placeholder map](#placeholder-map)

## Audit workflow

Use when **aligning an existing plugin** (not greenfield scaffold).

### When to use

- README missing, wrong order, or thin vs standard below
- `upload-params.json` drifted from `types.ts`; relation-key strings; >5 blueprint params
- Weak UX; `innerHTML` / `dangerouslySetInnerHTML`
- Blank iframe in Port; hooks after early returns; missing loading/empty states — [production-readiness.md](production-readiness.md)
- Outdated SDK; missing `applyThemeCss()` or `mergePageFilters`
- Build/upload docs wrong or missing canonical CLI command

### Steps

1. **Read** — README, `upload-params.json`, `package.json`, `types.ts`, host hook, `App.tsx`, API modules, webpack, CSS.
2. **Gap analysis** — vs README standard, [params-and-relations.md](params-and-relations.md), [plugin-architecture.md](plugin-architecture.md), [plugin-conventions.md](plugin-conventions.md).
3. **Prioritize** — API correctness → operator docs → polish.
4. **Patch** — Keep `PluginConfig` ↔ params aligned; realign README to `assets/template-README.md` structure.
5. **Verify** — `npm run build`; smoke in Port **Local development**; root Plugins **Version** matches.

## Versioning — once per branch

Bump `package.json` **`version` at most once per branch** per plugin. Semver reflects **all** functional changes since merge base — **not** per agent run.

**Do not bump again** when branch already bumped at warranted level, or changes are docs-only.

| Level | When (cumulative on branch) |
|-------|----------------------------|
| **patch** | Bug fixes, no new operator capability |
| **minor** | New behaviour or params (non-breaking) |
| **major** | Breaking params, catalog setup, behaviour |

**Greenfield:** stay at **`0.1.0`** entire first branch until merge/publish.

**Workflow:**

1. `git merge-base HEAD origin/main`
2. `git diff <merge-base>...HEAD -- <plugin-dir>/`
3. Compare merge-base vs current `version`; bump once if functional changes warrant it
4. Sync root **`README.md` Plugins** **Version** cell

## PR checklist

- [ ] README matches standard below (preview, params before setup, upload, troubleshooting)
- [ ] Upload uses only `--file`, `--identifier`, `--title`, `--params`, `--description`, `--upsert`
- [ ] `upload-params.json` ↔ `types.ts`; ≤5 blueprint params
- [ ] `applyThemeCss()`; `mergePageFilters` with full blueprint object
- [ ] Webpack/CSS: `inject: "body"`, root height 100%, `#plugin-root` flex, shell `min-height`
- [ ] [production-readiness.md](production-readiness.md) §1–§9 (hooks before returns, query UI states, Port smoke test)
- [ ] Entity search: nested `query`; errors include body
- [ ] `npm run build` → `dist/index.html`
- [ ] Persistence via Port API where meaningful — [guidelines.md](guidelines.md)
- [ ] Responsive layout; no duplicate title/icon in iframe
- [ ] Portal links via `document.referrer`; README notes mock link limits
- [ ] Prerequisites before params; no relation string params by default
- [ ] UX/UI + safe rendering + Recharts/webpack if charts — [ui-and-styling.md](ui-and-styling.md)
- [ ] Version bumped once per branch; root Plugins table synced

## Per-plugin README standard

Greenfield: copy **`assets/template-README.md`** → `<plugin>/README.md`, replace **`PLUGIN_*`** placeholders, remove HTML comments.

**Section order** (omit sections that do not apply):

1. **`#` Title + summary** — behaviour, [Port](https://app.port.io) link, dashboard vs entity page
2. **Preview image** — screenshot/GIF with alt text
3. **Badges (optional)** — surface, stack versions
4. **Features** — user-visible capabilities
5. **Prerequisites** — catalog/setup **before** params (Access, Blueprints, Relations, Integrations, Automations, SSA, …)
6. **Plugin parameters** — table mirroring `upload-params.json`; authoritative for defaults/examples
7. **Local development** — `npm run dev`, mocks, portal link caveat when applicable
8. **Setup** — Build, Upload (canonical command), Add in Port
9. **Project structure** — directory tree
10. **Troubleshooting** — Symptom | Cause | Fix

### Upload block (canonical)

```bash
port-plugins upload \
  --file dist/index.html \
  --identifier <plugin-name>-port-plugin \
  --title "<plugin title>" \
  --params "$(cat upload-params.json)" \
  --description "<short description>" \
  --upsert
```

```javascript
const PLUGIN_IDENTIFIER_REGEX = /^(?!\.{1,2}$)[A-Za-z0-9@_.+:\\/=-]+$/;
```

Link CLI install/auth once to [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) — do not invent flags.

### Placeholder map

| Placeholder | Set to |
|-------------|--------|
| `PLUGIN_TITLE` | Human title (`--title`) |
| `PLUGIN_NAME` | Directory (kebab-case) |
| `PLUGIN_SUMMARY` | One-sentence summary |
| `PLUGIN_SURFACE_CONTEXT` | Dashboard/entity; filters, relations |
| `PLUGIN_IDENTIFIER` | Upload `--identifier` |
| `PLUGIN_DESCRIPTION` | Upload `--description` |

**Quality bar:** Prerequisites → minimal params → local dev → setup — without reversing context.
