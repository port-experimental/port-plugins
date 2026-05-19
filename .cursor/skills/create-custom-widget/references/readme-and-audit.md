## Bringing an existing plugin up to standard

Use this path when the goal is **not** greenfield scaffolding but to **audit and align** an existing plugin directory (README, params, SDK/host bridge, build output, upload docs, API usage).

### When to use

- Per-plugin **`README.md`** is missing, thin, or out of order versus **Per-plugin `README.md` standard (required)** below (preview image, parameters table before setup, canonical upload command, troubleshooting, and so on).
- **`upload-params.json`** drifted from **`src/types.ts`**, overuses `string` where **`type: "blueprint"`** fits, includes **relation-key string params** or other **runtime-fetchable catalog data** (blueprint lists, entity IDs, property inventories) that belong on the Port API, duplicates a fixed subject blueprint that **`PLUGIN_DATA.entity`** already provides, or ignores the five-blueprint-param cap (see [CLI metadata](https://www.npmjs.com/package/@port-labs/port-plugins-cli)).
- **UX/UI** is weak (no loading/empty/error states, ignores theme, poor responsive layout) or code uses **`innerHTML`** / **`dangerouslySetInnerHTML`** for dynamic content.
- **`@port-labs/plugins-sdk`** is outdated or the host bridge omits **`applyThemeCss()`**, **`usePortPluginData`**, or dashboard **`mergePageFilters`** when page filters should apply.
- **Build / runtime** issues covered in [plugin-architecture.md](plugin-architecture.md) (Critical Webpack/CSS, entity search `{ query: { ... } }`, error surfacing).
- **Upload** instructions missing the canonical **`port-plugins upload`** line or contradicting current CLI/auth.

### Workflow

1. **Read** — `README.md`, `upload-params.json`, `package.json` (`engines`, dependencies), `src/types.ts`, host hook (`usePostMessageData` / `usePortPluginData`), main UI entry, any API modules, `webpack.config.js`, root CSS.
2. **Gap analysis** — Compare against the README standard below, params guidance in [scaffolding-and-implementation.md](scaffolding-and-implementation.md) (**Define parameters**), and [plugin-architecture.md](plugin-architecture.md) / [widget-conventions.md](widget-conventions.md).
3. **Prioritize** — Correctness first (Port API request shapes, token usage, theme), then operator docs (README, param table), then polish (badges, screenshots, structure tree).
4. **Patch** — Keep diffs focused: bump SDK with hook changes; keep `PluginConfig` and `upload-params.json` in lockstep; rewrite README sections rather than deleting useful catalog/integration detail.
5. **Verify** — `npm ci` / `npm install`, `npm run build`, smoke in **Local development** mode and/or in Port; update the **repo-level** widgets table row (step 7 under scaffolding) if the public description or behaviour changed materially.

### PR checklist (copy into description)

- [ ] **`README.md`** matches the per-plugin README standard below (preview asset, params before setup, local dev, canonical upload command + CLI link, troubleshooting).
- [ ] **`upload-params.json`** ↔ **`types.ts`** aligned; **`blueprint`** types used where admins pick blueprints; ≤5 blueprint params.
- [ ] **SDK** current enough for your needs (see [plugins-sdk on npm](https://www.npmjs.com/package/@port-labs/plugins-sdk)); theme applied when host sends `theme.css`.
- [ ] **Webpack / CSS** meet Critical Webpack/CSS in [plugin-architecture.md](plugin-architecture.md).
- [ ] **Entity search** bodies use `{ query: { combinator, rules } }` where applicable; errors surfaced with response body text.
- [ ] **`npm run build`** succeeds; **`dist/index.html`** is the upload artifact.
- [ ] **Persistence:** Meaningful saved state uses the Port API where feasible; browser storage only when intentionally local-only (see [guidelines.md](guidelines.md)).
- [ ] **Layout:** Responsive behaviour verified; root fills iframe space; no duplicate plugin title/description (see [scaffolding-and-implementation.md](scaffolding-and-implementation.md)).
- [ ] **Portal links:** User-facing URLs use **`document.referrer`** origin with **`https://app.port.io`** fallback; entity pages use **`{origin}/{blueprint}Entity?identifier={entityId}`**; not `portApiBaseUrl` and not a hardcoded region unless documented.
- [ ] **Catalog over params:** README **Prerequisites** document blueprints, properties, **Relations**, and any other required Port instances (automations, SSA, integrations, …) before the widget-parameters table; no relation-key `string` params unless explicitly documented as last-resort overrides.
- [ ] **Param labels:** `upload-params.json` labels are short; README **Widget parameters** holds defaults, examples, and operator-facing detail.
- [ ] **Params vs API:** Catalog shape from Port API + host context; `upload-params.json` minimal — **no** params for blueprint lists, relations, entities, or schemas the API returns; **relations** from catalog + **`PLUGIN_DATA.entity`** + **`relatedTo` / `entities/search`**; subject blueprint param omitted when entity page + design default suffice.
- [ ] **UX/UI:** Loading, empty, and error states; theme applied; responsive iframe layout; no duplicate plugin title/description.
- [ ] **Safe rendering:** No `innerHTML` / `dangerouslySetInnerHTML` for dynamic or user content.

### 8. Per-plugin `README.md` standard (required)

Each **plugin directory must** include a `README.md` that follows **this section order**. The repo-level widgets table (step 7) is only an index; the per-plugin README is the **authoritative** operator and maintainer guide. If a section does not apply don't include it

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

8. **Setup** — Numbered substeps, **only** what this widget needs. Typical substeps (drop those that do not apply):
   - **Catalog** — Blueprint and property requirements (identifier, type, required fields, relations) in a table so admins can set them up before deploying the widget.
   - **Ingestion / integration** — Ocean or other mapping paths, resync, scoping, known pitfalls.
   - **Build** — `npm install`, `npm run build`, artifact path **`dist/index.html`**.
   - **Upload** — Document the **canonical upload command** for this plugin (copy-pasteable), for example:

     ```bash
     port-plugins upload \
       --file dist/index.html \
       --identifier <plugin-directory-name> \
       --title "<widget title in Port>" \
       --params "$(cat upload-params.json)" \
       --upsert
     ```

     Do **not** duplicate the full CLI tutorial here. For install, `port-plugins config`, tokens vs client credentials, and `--port-api-base-url` / region, link once to [@port-labs/port-plugins-cli on npm](https://www.npmjs.com/package/@port-labs/port-plugins-cli) (and [Port Plugins](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins) where relevant).

   - **Add in Port** — Short steps: custom widget → pick plugin → params defaults vs overrides (cross-reference **Widget parameters** above).
   - **Entity-page behaviour** — When behaviour differs from dashboards: blueprints, relations, any **Get entity** (or other) calls required because host `PLUGIN_DATA` is incomplete.

9. **Project structure** — Directory tree for this plugin (`src/`, `upload-params.json`, webpack, `tsconfig.json`, and so on).

10. **Troubleshooting** — Markdown table **Symptom | Cause | Fix** (search 422 / `query` nesting, theme / `applyThemeCss`, empty data, auth, wrong API host).

**Quality bar:** A reader can follow **Port prerequisites (catalog, integrations, automations, SSA, …) → minimal widget parameters (detail in README, short labels in Port) → local development → setup (build, upload, add widget)** without reversing context. Relations and other catalog/setup objects belong in **Prerequisites**, not in the params table unless a documented last-resort override exists.
