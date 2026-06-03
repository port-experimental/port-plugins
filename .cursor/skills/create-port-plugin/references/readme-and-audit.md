## Bringing an existing plugin up to standard

Use this path when the goal is **not** greenfield scaffolding but to **audit and align** an existing plugin directory (README, params, SDK/host bridge, build output, upload docs, API usage).

### When to use

- Per-plugin **`README.md`** is missing, thin, or out of order versus **Per-plugin `README.md` standard (required)** below (preview image, parameters table before setup, canonical upload command, troubleshooting, and so on).
- **`upload-params.json`** drifted from **`src/types.ts`**, overuses `string` where **`type: "blueprint"`** fits, includes **relation-key string params** or other **runtime-fetchable catalog data** (blueprint lists, entity IDs, property inventories) that belong on the Port API, duplicates a fixed subject blueprint that **`PLUGIN_DATA.entity`** already provides, or ignores the five-blueprint-param cap (see [CLI metadata](https://www.npmjs.com/package/@port-labs/port-plugins-cli)).
- **UX/UI** is weak (no loading/empty/error states, ignores theme, poor responsive layout) or code uses **`innerHTML`** / **`dangerouslySetInnerHTML`** for dynamic content.
- **`@port-labs/plugins-sdk`** is outdated or the host bridge omits **`applyThemeCss()`**, **`usePortPluginData`**, or dashboard **`mergePageFilters`** when page filters should apply (third argument must be the **full** `params.blueprint.value` object — not `{ identifier }` only).
- **Build / runtime** issues covered in [plugin-architecture.md](plugin-architecture.md) (Critical Webpack/CSS, entity search `{ query: { ... } }`, error surfacing).
- **Upload** instructions missing the canonical **`port-plugins upload`** line or contradicting current CLI/auth.

### Workflow

1. **Read** — `README.md`, `upload-params.json`, `package.json` (`engines`, dependencies), `src/types.ts`, host hook (`usePostMessageData` / `usePortPluginData`), main UI entry, any API modules, `webpack.config.js`, root CSS.
2. **Gap analysis** — Compare against the README standard below, params guidance in [scaffolding-and-implementation.md](scaffolding-and-implementation.md) (**Define parameters**), and [plugin-architecture.md](plugin-architecture.md) / [widget-conventions.md](widget-conventions.md).
3. **Prioritize** — Correctness first (Port API request shapes, token usage, theme), then operator docs (README, param table), then polish (badges, screenshots, structure tree).
4. **Patch** — Keep diffs focused: bump SDK with hook changes; keep `PluginConfig` and `upload-params.json` in lockstep; rewrite README sections rather than deleting useful catalog/integration detail. **Version bump:** follow **Versioning — once per branch** below (not once per agent invocation).
5. **Verify** — install dependencies, run **`build`**, **commit `dist/index.html`**, smoke in **Local development** mode and/or in Port; confirm root **`README.md` Plugins** **Version** matches `package.json`; update the row description if behaviour changed materially.

### Versioning — once per branch

Bump a plugin’s `package.json` **`version` at most once per git branch** for that plugin’s functional work. The semver level must reflect **all** functional changes on the branch since it diverged from the default branch (`main` / `master`) — **not** once per agent invocation, chat session, or incremental edit on the same branch.

**Do not bump again** when:

- This branch already increased `version` (and synced the root **Plugins** table **Version** cell) and later commits on the same branch do not raise the warranted semver level (e.g. more patch-level fixes after a patch bump).
- There are no functional plugin diffs vs merge base (docs-only, skill-only, or unrelated paths).

**Bump (or raise) when:**

- The branch has functional plugin changes under `<plugin>/` and `package.json` `version` is still the merge-base value — bump **once** from that base using cumulative severity.
- The branch already bumped but **new** commits add a higher semver class (e.g. branch had patch-only fixes, then a feature landed) — increase to the level warranted by **total** branch changes vs merge-base version (do not stack patch bumps per invocation).

**Choose semver from cumulative branch changes** (highest level that applies):

| Level | When (aggregate on branch) |
|-------|----------------------------|
| **patch** | Bug fixes, internal corrections, no new operator-facing capability |
| **minor** | New user-visible behaviour or params (non-breaking) |
| **major** | Breaking changes for operators (param removals/renames, required new catalog setup, incompatible behaviour) |

**Greenfield plugin (new directory, not on merge base):**

- Scaffold with **`"version": "0.1.0"`** in `package.json` and sync the root **Plugins** table **once**.
- **Do not** bump `0.1.0` → `0.2.0` → `0.3.0` across agent runs or commits while still building the **first** release on the same branch — that violates “once per branch” and “do not stack … per invocation.”
- All first-release features (charts, params, format breakdown, etc.) ship together under **`0.1.0`**. The semver table applies when choosing the version **after** a published baseline exists (e.g. next branch bumps `0.1.0` → `0.2.0` once if only minor features landed since release).
- If `git show <merge-base>:<plugin>/package.json` fails (plugin did not exist), there is no merge-base version to bump **from** — stay at **`0.1.0`** until the branch merges or the operator publishes; only then do follow-up branches bump from the released version.

**Workflow (run before finishing work on a branch):**

1. Resolve merge base: `git merge-base HEAD origin/main` (or `main` / `master` if `origin/main` is unavailable).
2. List functional diffs: `git diff <merge-base>...HEAD -- <plugin-dir>/` (exclude docs-only if no behaviour change).
3. Read merge-base version: `git show <merge-base>:<plugin-dir>/package.json` (or `jq -r .version`).
4. Compare to current `package.json` `version` on the branch:
   - **Unchanged vs merge base** and step 2 has functional changes → bump **once** from merge-base version per the table above.
   - **Already bumped on branch** → bump again **only** if cumulative changes now need a **higher** semver than the current branch version reflects (recompute from merge-base version + total branch changes; do not add another patch per agent run).
5. Update the root **`README.md` Plugins** table **Version** cell to match `package.json` exactly.
6. **Rebuild and commit the upload artifact** — see **Build artifact — commit `dist/index.html`** below (mandatory when step 4–5 apply).

### Build artifact — commit `dist/index.html` (required)

This repo **tracks** each plugin’s built bundle at **`<plugin>/dist/index.html`** only. Root **`.gitignore`** ignores other `dist/*` files (`ui.js`, license sidecars, etc.).

**When to rebuild and commit `dist/index.html`:**

| Trigger | Required action |
|---------|-----------------|
| **New plugin** (greenfield or copy-adapt) | Before marking the plugin done: install deps, run **`build`**, commit `<plugin>/dist/index.html` on the same branch |
| **Functional change** under `<plugin>/` (`src/`, webpack, `package.json` deps, bundle-affecting config) | Rebuild; commit updated `dist/index.html` when the branch ships those changes |
| **`package.json` `version` bump** (once per branch) | **Mandatory** — never bump version without a fresh `dist/index.html` built from the branch’s current source |

**Commands (run from the plugin directory):**

```bash
cd <plugin-dir>
# install dependencies, then run the build script (e.g. npm run build / yarn build)
npm run build
git add dist/index.html
```

**Rules:**

- Build must exit **0** (webpack bundle-size warnings are OK; errors fail the task).
- Commit **only** `dist/index.html` — not `dist/ui.js` or other build outputs.
- **Greenfield at `0.1.0`:** still build and commit `dist/index.html` before merge, even though version stays at `0.1.0` for the whole first branch.
- PRs that change plugin source but omit an updated `dist/index.html` are incomplete — rebuild before review.

**Verify before finishing:**

- [ ] **`build`** succeeded in `<plugin-dir>`
- [ ] `<plugin>/dist/index.html` exists and reflects current source
- [ ] `dist/index.html` is staged or committed alongside the source/version changes on the branch

### PR checklist (copy into description)

- [ ] **`README.md`** matches the per-plugin README standard below (preview asset, params before setup, local dev, canonical upload command + CLI link, troubleshooting).
- [ ] **Upload command** uses only `--file`, `--identifier`, `--title`, `--params`, `--description`, `--upsert` (no invented flags).
- [ ] **`upload-params.json`** ↔ **`types.ts`** aligned; **`blueprint`** types used where admins pick blueprints; ≤5 blueprint params.
- [ ] **SDK** current enough for your needs (see [plugins-sdk on npm](https://www.npmjs.com/package/@port-labs/plugins-sdk)); **`applyThemeCss()`** called so host theme tokens apply in the iframe.
- [ ] **Webpack / CSS** meet Critical Webpack/CSS in [plugin-architecture.md](plugin-architecture.md).
- [ ] **Entity search** bodies use `{ query: { combinator, rules } }` where applicable; errors surfaced with response body text.
- [ ] **Dashboard page filters:** `mergePageFilters` receives the **full** blueprint from `params.blueprint.value` (not `{ identifier }` only); `readBlueprintParam` preserves all fields — [plugin-architecture.md](plugin-architecture.md) (**Dashboard page filters**).
- [ ] **`build`** succeeds; **`dist/index.html`** is the upload artifact and is **committed** on the branch (see **Build artifact — commit `dist/index.html`**).
- [ ] **Persistence:** Meaningful saved state uses the Port API where feasible; browser storage only when intentionally local-only (see [guidelines.md](guidelines.md)).
- [ ] **Layout:** Responsive behaviour verified; root fills iframe space; no duplicate plugin title, description, or icon (see [scaffolding-and-implementation.md](scaffolding-and-implementation.md)).
- [ ] **Portal links:** User-facing URLs use **`document.referrer`** origin with **`https://app.port.io`** fallback; entity pages use **`{origin}/{blueprint}Entity?identifier={entityId}`**; not `portApiBaseUrl` and not a hardcoded region unless documented.
- [ ] **Local dev / portal links:** When the widget renders in-app links, README **Local development** states that URLs built from **mock / fixture** entity identifiers do not work at `http://localhost:9000` outside Port’s iframe; link behaviour is validated via Port **Local development** (iframe) or after deploy.
- [ ] **Catalog over params:** README **Prerequisites** document blueprints, properties, **Relations**, and any other required Port instances (automations, SSA, integrations, …) before the widget-parameters table; no relation-key `string` params unless explicitly documented as last-resort overrides.
- [ ] **Params:** Every `upload-params.json` entry has **`type`**, **`isRequired`**, and **`label`**; labels are short; README **Widget parameters** holds defaults, examples, and operator-facing detail.
- [ ] **Params vs API:** Catalog shape from Port API + host context; `upload-params.json` minimal — **no** params for blueprint lists, relations, entities, or schemas the API returns; **relations** from catalog + **`PLUGIN_DATA.entity`** + **`relatedTo` / `entities/search`**; subject blueprint param omitted when entity page + design default suffice.
- [ ] **UX/UI:** Loading, empty, and error states; theme applied; responsive iframe layout; no duplicate plugin title/description/icon; no emoji — use **`<i>`** or an icon library for icons when needed.
- [ ] **CSS:** `:root` = surfaces/text/borders only; optional palette at **300**; pills/badges use **`--{hue}-bg`** + **`--{hue}-text`** (not `color-mix` into `--card` for labels) — [Optional palette and shade variants](scaffolding-and-implementation.md#optional-palette-and-shade-variants-root); decorations otherwise use **class-local** vars — not shared `--accent` / `--primary` ([Surface vs decoration colors](scaffolding-and-implementation.md#surface-vs-decoration-colors)).
- [ ] **Safe rendering:** No `innerHTML` / `dangerouslySetInnerHTML` for dynamic or user content.
- [ ] **Charts:** Bar/line/area/pie/donut (and similar) use **Recharts** unless trivial; [webpack-port-upload-safety.md](webpack-port-upload-safety.md) applied when Recharts is present — [Charts](scaffolding-and-implementation.md#charts-and-data-visualization).
- [ ] **Version bump:** Branch has at most **one** semver bump per plugin vs merge base; level matches **cumulative** functional changes (patch / minor / major); root **`README.md` Plugins** **Version** cell matches — not re-bumped on every agent run.
- [ ] **Build artifact:** **`dist/index.html`** rebuilt and **committed** when the plugin is new or **`version`** / functional source changed — [Build artifact — commit `dist/index.html`](#build-artifact--commit-distindexhtml-required).
- [ ] **Repo Plugins table:** Root `README.md` row includes **Version** matching `package.json` `version` when the plugin was added or version-bumped.

### 8. Per-plugin `README.md` standard (required)

Each **plugin directory must** include a `README.md` that follows **this section order**. The repo-level widgets table (step 7) is only an index (widget link, **Version** from `package.json`, short description); the per-plugin README is the **authoritative** operator and maintainer guide. If a section does not apply don't include it

1. **`#` Title + summary** — Human title; one paragraph describing behaviour, a link to [Port](https://app.getport.io), and which catalog concepts apply (blueprints, relations, dashboard vs entity page).

2. **Preview image** — At least **one** screenshot or short GIF of the widget running inside Port (dashboard and/or entity page, whichever the widget supports). Commit the asset under e.g. `docs/` or `assets/` and reference it with a relative path, **or** use a stable hosted URL. Always add **alt text** for accessibility.

3. **Badges (optional)** — e.g. widget surface (dashboard / entity), React and TypeScript versions; link to [Plugins](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins) where helpful.

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

6. **Widget parameters** — Table mirroring **`upload-params.json`**: key, type, required, default, description (use the same types Port expects, including `blueprint`). This table is the **authoritative** place for defaults, examples, and “when to override” guidance — **`upload-params.json` `label` fields stay short** (see [scaffolding-and-implementation.md](scaffolding-and-implementation.md) (**Param labels**)). Should be **minimal** — if a row duplicates catalog data (relation keys, fixed subject blueprint on entity pages), remove the param and document the catalog/default in **Prerequisites** instead. Place this **after** Prerequisites and **before** deploy steps.

7. **Local development** — `npm run dev`, dev server URL, **small mock data** (`usePostMessageData.ts` for host context; `src/dev/mockData.ts` or `api/` early returns when `DEV_MOCK`); which files to edit; Port **Local development** toggle. Document the inner loop **before** production upload so contributors do not have to scroll past release steps.

   **Portal / entity links (required when the widget has them):** If the UI links to Port entity pages, dashboards, or other portal routes (for example via `buildEntityPageUrl`), call out that **links built from mock or fixture data do not work in the standalone local env** (`http://localhost:9000` outside Port’s iframe). Outside the iframe there is no `document.referrer`, the origin falls back to **`https://app.port.io`**, and mock identifiers are not real catalog entities — clicks may 404 or open the wrong org. **Validate links** with Port’s **Local development** toggle (iframe + real `PLUGIN_DATA`) or after deploy; `npm run dev` alone is only for layout and data paths.

8. **Setup** — Numbered substeps, **only** what this widget needs. Typical substeps (drop those that do not apply):
   - **Catalog** — Blueprint and property requirements (identifier, type, required fields, relations) in a table so admins can set them up before deploying the widget.
   - **Ingestion / integration** — Ocean or other mapping paths, resync, scoping, known pitfalls.
   - **Build** — `npm install`, `npm run build`, artifact path **`dist/index.html`**.
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

     Do **not** duplicate the full CLI tutorial here. For install, `port-plugins config`, tokens vs client credentials, and `--port-api-base-url` / region, link once to [@port-labs/port-plugins-cli on npm](https://www.npmjs.com/package/@port-labs/port-plugins-cli) (and [Port Plugins](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins) where relevant).

   - **Add in Port** — Short steps: custom widget → pick plugin → params defaults vs overrides (cross-reference **Widget parameters** above).
   - **Entity-page behaviour** — When behaviour differs from dashboards: blueprints, relations, any **Get entity** (or other) calls required because host `PLUGIN_DATA` is incomplete.

9. **Project structure** — Directory tree for this plugin (`src/`, `upload-params.json`, webpack, `tsconfig.json`, and so on).

10. **Troubleshooting** — Markdown table **Symptom | Cause | Fix** (search 422 / `query` nesting, theme / `applyThemeCss`, empty data, auth, wrong API host). When the widget has portal links, include a row for **mock/local link does not open the expected entity** (fixture IDs + `localhost:9000` outside the iframe — expected; test in Port **Local development** or production).

**Quality bar:** A reader can follow **Port prerequisites (catalog, integrations, automations, SSA, …) → minimal widget parameters (detail in README, short labels in Port) → local development → setup (build, upload, add widget)** without reversing context. Relations and other catalog/setup objects belong in **Prerequisites**, not in the params table unless a documented last-resort override exists.
