# README, audit, and ship

## Table of contents

- [README, audit, and ship](#readme-audit-and-ship)
- [Audit workflow](#audit-workflow)
  - [When to use](#when-to-use)
  - [Workflow](#workflow)
  - [SDK version (mandatory on every audit)](#sdk-version-mandatory-on-every-audit)
  - [Validation report](#validation-report)
- [Versioning — once per branch](#versioning-once-per-branch)
- [Build artifact](#build-artifact)
- [PR checklist](#pr-checklist)
- [Per-plugin README standard](#per-plugin-readme-standard)
  - [Upload block (canonical)](#upload-block-canonical)
  - [Placeholder map](#placeholder-map)

## Audit workflow

Use when **aligning an existing plugin** or **reviewing a newly scaffolded plugin** before shipping — both must meet the standard below.

### When to use

- Per-plugin **`README.md`** is missing, thin, or out of order versus **Per-plugin `README.md` standard (required)** below (preview image, parameters table before setup, canonical upload command, troubleshooting, and so on).
- **`upload-params.json`** drifted from **`src/types.ts`**, overuses `string` where **`type: "blueprint"`** fits, includes **relation-key string params** or other **runtime-fetchable catalog data** (blueprint lists, entity IDs, property inventories) that belong on the Port API, duplicates a fixed subject blueprint that **`PLUGIN_DATA.entity`** already provides, or ignores the five-blueprint-param cap (see [CLI metadata](https://www.npmjs.com/package/@port-labs/port-plugins-cli)).
- **UX/UI** is weak (no loading/empty/error states, ignores theme, poor responsive layout) or code uses **`innerHTML`** / **`dangerouslySetInnerHTML`** for dynamic content.
- **`@port-labs/plugins-sdk`** is outdated or the host bridge omits **`applyThemeCss()`**, **`usePortPluginData`**, or dashboard **`mergePageFilters`** when page filters should apply.
- **Build / runtime** issues covered in [plugin-architecture.md](plugin-architecture.md) (Critical Webpack/CSS, entity search `{ query: { ... } }`, error surfacing).
- **Upload** instructions missing the canonical **`port-plugins upload`** line or contradicting current CLI/auth.
- **Root `README.md` Plugins table** is missing a row for a new plugin, or the existing row has a stale **Version**, wrong folder link, or description that no longer matches the plugin's own README summary.

### Workflow

1. **Read** — `README.md`, `upload-params.json`, `package.json` (`engines`, dependencies), `src/types.ts`, host hook (`usePostMessageData` / `usePortPluginData`), main UI entry, any API modules, `webpack.config.js`, root CSS.
2. **SDK version** — mandatory on every audit; see [SDK version (mandatory on every audit)](#sdk-version-mandatory-on-every-audit) below.
3. **Gap analysis** — Compare against the README standard below, params guidance in [scaffolding-and-implementation.md](scaffolding-and-implementation.md) (**Define parameters**), and [plugin-architecture.md](plugin-architecture.md) / [widget-conventions.md](widget-conventions.md).
4. **Prioritize** — Correctness first (Port API request shapes, token usage, theme, SDK currency), then operator docs (README, param table), then polish (badges, screenshots, structure tree).
5. **Patch** — Keep diffs focused: bump SDK with hook changes; keep `PluginConfig` and `upload-params.json` in lockstep; rewrite README sections rather than deleting useful catalog/integration detail. **Bump `package.json` `version`** for every functional change (patch / minor / major per semver); update the repo root **Plugins** table **Version** column to match.
6. **Verify** — `npm ci` / `npm install`, `npm run build`, **commit** `dist/index.html` when version changed or plugin is new; smoke in **Local development** mode and/or in Port; confirm root **`README.md` Plugins** **Version** matches `package.json`; update the row description if behaviour changed materially.

### SDK version (mandatory on every audit)

**Do not skip this step** when running an audit or writing a `VALIDATION-REPORT.md`.

1. **Latest on npm** (authoritative):

   ```bash
   npm view @port-labs/plugins-sdk version
   ```

2. **Declared** in the plugin's `package.json` (`dependencies["@port-labs/plugins-sdk"]`).

3. **Resolved** in `package-lock.json` (`node_modules/@port-labs/plugins-sdk` → `version`). If there is no lockfile, run `npm install` first or note "unresolved".

4. **Compare** — pass only when resolved ≥ latest (or declared range explicitly targets latest and lockfile will resolve there after `npm install`). Flag **behind** when resolved < latest.

5. **Report** — validation reports and audit summaries must include a table row:

   | Declared | Resolved (lockfile) | Latest (npm) | Status |
   |----------|---------------------|--------------|--------|
   | `^0.1.0` | `0.1.1` | `0.3.0` | Behind — bump recommended |

6. **Fix** — set `"@port-labs/plugins-sdk": "^<latest>"` in `package.json`, run `npm install`, `npm run build`, and smoke-test host bridge (`applyThemeCss`, `usePortPluginData` / `mergePageFilters` if used). Read [plugins-sdk on npm](https://www.npmjs.com/package/@port-labs/plugins-sdk) for breaking changes between versions.

### Validation report

When the user asks to **validate** or **audit** a plugin, write `<plugin>/VALIDATION-REPORT.md` (or present the same sections in chat) using this outline:

1. **Build & runtime (passed)** — table of checks that passed.
2. **Dependencies** — **required** SDK version table (see above); note any other stale Port packages (`@port-labs/port-plugins-cli` in README only — dev tool, not bundled).
3. **Production readiness gaps** — hooks, layout, query states, etc.
4. **README / audit gaps** — docs, preview image, param drift.
5. **Intentional / acceptable choices**
6. **Not verified in this run** — Port iframe smoke test, live org, etc.
7. **Recommended fix priority**

## Versioning — once per branch

| Rule | Detail |
|------|--------|
| When to bump | Every functional change on a branch (patch / minor / major per semver) |
| Greenfield | Stay at **`0.1.0`** for the entire first branch until merge/publish |
| Once per branch | **One** `package.json` version bump per branch — not per commit |
| Root README | Update Plugins table **Version** cell to match `package.json` |
| Build artifact | After every version bump **or** when scaffolding a new plugin: `npm run build`, then **commit** `<plugin>/dist/index.html` |

Root `.gitignore` ignores `**/dist/**` but **not** `**/dist/index.html` — that file is the canonical CLI upload artifact and must stay in git.

## Build artifact

Every plugin ships a **committed** production build at `dist/index.html`.

| When | Action |
|------|--------|
| New plugin (greenfield or copy) | `npm run build` → `git add <plugin>/dist/index.html` before opening PR |
| Version bump | Rebuild and commit updated `dist/index.html` in the **same** branch/commit series as `package.json` |
| SDK-only bump | Rebuild and commit `dist/index.html` if the bundled output changes |

Do **not** commit other `dist/` files (source maps, chunks, etc.) — only `index.html`.

### PR checklist (copy into description)

- [ ] **Preview image** — `assets/preview.png` committed; README `<img>` uses full `https://github.com/{owner}/{repo}/blob/{branch}/{plugin-dir}/assets/preview.png` with `width`, `height`, descriptive `alt`.
- [ ] **`README.md`** matches the per-plugin README standard below (full GitHub blob preview URL, params before setup, local dev, canonical upload command + CLI link, troubleshooting).
- [ ] **Upload command** uses only `--file`, `--identifier`, `--title`, `--params`, `--description`, `--upsert` (no invented flags).
- [ ] **`upload-params.json`** ↔ **`types.ts`** aligned; **`blueprint`** types used where admins pick blueprints; ≤5 blueprint params.
- [ ] **SDK version** — `npm view @port-labs/plugins-sdk version` compared to declared + lockfile-resolved versions; not behind latest without documented reason; **`applyThemeCss()`** called so host theme tokens apply in the iframe (see [plugins-sdk on npm](https://www.npmjs.com/package/@port-labs/plugins-sdk)).
- [ ] **Webpack / CSS** meet Critical Webpack/CSS in [plugin-architecture.md](plugin-architecture.md).
- [ ] **Entity search** bodies use `{ query: { combinator, rules } }` where applicable; errors surfaced with response body text.
- [ ] **`npm run build`** succeeds; **`dist/index.html`** is the upload artifact and is **committed** to git (rebuilt when version bumps).
- [ ] **Persistence:** Meaningful saved state uses the Port API where feasible; browser storage only when intentionally local-only (see [guidelines.md](guidelines.md)).
- [ ] **Layout:** Responsive behaviour verified; root fills iframe space; no duplicate plugin title, description, or icon (see [scaffolding-and-implementation.md](scaffolding-and-implementation.md)).
- [ ] **Portal links:** User-facing URLs use **`document.referrer`** origin with **`https://app.port.io`** fallback; entity pages use **`{origin}/{blueprint}Entity?identifier={entityId}`**; not `portApiBaseUrl` and not a hardcoded region unless documented.
- [ ] **Catalog over params:** README **Prerequisites** document blueprints, properties, **Relations**, and any other required Port instances (automations, SSA, integrations, …) before the widget-parameters table; no relation-key `string` params unless explicitly documented as last-resort overrides.
- [ ] **Params:** Every `upload-params.json` entry has **`type`**, **`isRequired`**, and **`label`**; labels are short; optional **`description`** for Port UI tooltips when the label alone is unclear; README **Widget parameters** holds defaults, examples, and operator-facing detail.
- [ ] **Params vs API:** Catalog shape from Port API + host context; `upload-params.json` minimal — **no** params for blueprint lists, relations, entities, or schemas the API returns; **relations** from catalog + **`PLUGIN_DATA.entity`** + **`relatedTo` / `entities/search`**; subject blueprint param omitted when entity page + design default suffice.
- [ ] **UX/UI:** Loading, empty, and error states; theme applied; responsive iframe layout; no duplicate plugin title/description/icon; no emoji — use **`<i>`** or an icon library for icons when needed.
- [ ] **CSS:** `:root` = surfaces/text/borders only; optional palette at **300**; pills/badges use **`--{hue}-bg`** + **`--{hue}-text`** (not `color-mix` into `--card` for labels) — [Optional palette and shade variants](scaffolding-and-implementation.md#optional-palette-and-shade-variants-root); decorations otherwise use **class-local** vars — not shared `--accent` / `--primary` ([Surface vs decoration colors](scaffolding-and-implementation.md#surface-vs-decoration-colors)).
- [ ] **Safe rendering:** No `innerHTML` / `dangerouslySetInnerHTML` for dynamic or user content.
- [ ] **Version bump:** `package.json` `version` increased for this change (patch / minor / major); root **`README.md` Plugins** **Version** cell matches; **`dist/index.html` rebuilt and committed**.
- [ ] **Repo Plugins table:** Root `README.md` row includes **Version** matching `package.json` `version` when the plugin was added or version-bumped.

### 8. Per-plugin `README.md` standard (required)

Each **plugin directory must** include a `README.md` that follows **this section order**. The repo-level widgets table (step 7) is only an index (widget link, **Version** from `package.json`, short description); the per-plugin README is the **authoritative** operator and maintainer guide. If a section does not apply don't include it

1. **`#` Title + summary** — Human title; one paragraph describing behaviour, a link to [Port](https://app.port.io), and which catalog concepts apply (blueprints, relations, dashboard vs entity page).

2. **Preview image** — At least **one** screenshot or short GIF of the widget running inside Port (dashboard and/or entity page, whichever the widget supports). **Commit** the file under `assets/preview.png` (additional screenshots: `assets/preview-*.png`) and reference it with a **full GitHub blob URL** — not a relative path, not `user-attachments`, not `raw.githubusercontent.com`.

   ```html
   <img width="2000" height="503" alt="Blueprint Table widget" src="https://github.com/port-experimental/port-plugins/blob/main/blueprint-table/assets/preview.png" />
   ```

   | Requirement | Detail |
   |-------------|--------|
   | `src` | `https://github.com/{owner}/{repo}/blob/{branch}/{plugin-dir}/assets/preview.png` |
   | `{branch}` | Repo default branch (`main`) after merge; use the **feature branch** name until the image is on `main` |
   | `width` / `height` | Intrinsic pixel dimensions (`sips -g pixelWidth -g pixelHeight assets/preview.png` on macOS) |
   | `alt` | Short, descriptive widget name / caption |
   | File | `assets/preview.png` committed in the same PR as the README update |

   When the screenshot changes, update **both** the committed PNG and the README `width` / `height` if dimensions changed.

3. **Badges (optional)** — e.g. widget surface (dashboard / entity), React and TypeScript versions; link to [Plugins](https://docs.port.io/customize-pages-dashboards-and-plugins/plugins) where helpful.

4. **Features** — Bullet list of user-visible capabilities.

5. **Prerequisites** — Everything that must exist or be configured in Port **before** the widget works. Catalog prerequisites come **before** widget parameters in the doc — relations and blueprint schema are catalog concerns, not plugin params.

   Structure this section with subheadings as needed (omit subsections when not applicable):

   | Subsection | Document when the widget needs it |
   |------------|-----------------------------------|
   | **Access** | Port roles, token/scopes, or org settings |
   | **Integrations** | Ocean or other sources that must ingest data the widget reads |
   | **Blueprints & properties** | Existing or **new** blueprints; property tables (identifier, type, required, purpose) |
   | **Relations** | Identifier, source blueprint, target blueprint, required, how the widget uses the link |
   | **Automations** | Identifier, trigger, blueprint scope, what the widget assumes (e.g. comment created on entity update) |
   | **Self-service actions (SSA)** | Identifier, blueprint, inputs/outputs the widget invokes or links to |
   | **Scorecards / rules / other** | Any non-catalog Port objects the widget depends on |

   For each **new** instance the widget introduces (blueprint, relation, automation, SSA, etc.), include enough detail (identifiers, fields, links) that an admin can create it in Port without reading source code. State the **Node.js** range from `package.json` `engines` (and align with the [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) Node requirement if operators run the CLI from the same machine).

6. **Widget parameters** — Table mirroring **`upload-params.json`**: key, type, required, default, description (use the same types Port expects, including `blueprint`). This table is the **authoritative** place for defaults, examples, and “when to override” guidance — **`upload-params.json` `label` fields stay short**; add optional JSON **`description`** for Port configuration tooltips when labels are ambiguous (see [params-and-relations.md](params-and-relations.md) (**Optional `description`**)). Should be **minimal** — if a row duplicates catalog data (relation keys, fixed subject blueprint on entity pages), remove the param and document the catalog/default in **Prerequisites** instead. Place this **after** Prerequisites and **before** deploy steps.

7. **Local development** — `npm run dev`, dev server URL, **small mock data** (`usePostMessageData.ts` for host context; `src/dev/mockData.ts` or `api/` early returns when `DEV_MOCK`); which files to edit; Port **Local development** toggle. Document the inner loop **before** production upload so contributors do not have to scroll past release steps.

8. **Setup** — Numbered substeps, **only** what this widget needs. Typical substeps (drop those that do not apply):
   - **Catalog** — Blueprint and property requirements (identifier, type, required fields, relations) in a table so admins can set them up before deploying the widget.
   - **Ingestion / integration** — Ocean or other mapping paths, resync, scoping, known pitfalls.
   - **Build** — `npm install`, `npm run build`, artifact path **`dist/index.html`**; commit **`dist/index.html`** (tracked in git; other `dist/` output is ignored).
   - **Upload** — Document the **canonical upload command** for this plugin (copy-pasteable), for example:

     ```bash
     port-plugins upload \
       --file dist/index.html \
       --identifier <your-plugin-name> \
       --title "<widget title in Port>" \
       --params "$(cat upload-params.json)" \
       --description "<short plugin description>" \
       --upsert
     ```

     `<plugin-directory-name>` must pass Port’s identifier regex before upload:

     ```javascript
     const PLUGIN_IDENTIFIER_REGEX = /^(?!\.{1,2}$)[A-Za-z0-9@_.+:\\/=-]+$/;
     ```

     When auditing, confirm the README’s `--identifier` matches the folder name and satisfies this regex.

     Do **not** duplicate the full CLI tutorial here. For install, `port-plugins config`, tokens vs client credentials, and `--port-api-base-url` / region, link once to [@port-labs/port-plugins-cli on npm](https://www.npmjs.com/package/@port-labs/port-plugins-cli) (and [Port Plugins](https://docs.port.io/customize-pages-dashboards-and-plugins/plugins) where relevant).

   - **Add in Port** — Short steps: custom widget → pick plugin → params defaults vs overrides (cross-reference **Widget parameters** above).
   - **Entity-page behaviour** — When behaviour differs from dashboards: blueprints, relations, any **Get entity** (or other) calls required because host `PLUGIN_DATA` is incomplete.

9. **Project structure** — Directory tree for this plugin (`src/`, `dist/index.html`, `upload-params.json`, webpack, `tsconfig.json`, and so on).

10. **Troubleshooting** — Markdown table **Symptom | Cause | Fix** (search 422 / `query` nesting, theme / `applyThemeCss`, empty data, auth, wrong API host).

**Quality bar:** A reader can follow **Port prerequisites (catalog, integrations, automations, SSA, …) → minimal widget parameters (detail in README, short labels in Port) → local development → setup (build, upload, add widget)** without reversing context. Relations and other catalog/setup objects belong in **Prerequisites**, not in the params table unless a documented last-resort override exists.
