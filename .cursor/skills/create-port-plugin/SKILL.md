---
name: create-port-plugin
description: >-
   Build Port custom plugins and widgets from scratch, or reuse and verify existing ones in the repo, as self-contained React/TypeScript iframe widgets (@port-labs/plugins-sdk, port-plugins-cli) uploaded as Port plugins. Use for greenfield scaffolding, copying/adapting plugins, recommending an existing match, or auditing upload-params.json and per-plugin README. Do not use for Ocean integrations, generic Port admin without plugin code, or blueprint-only catalog work with no widget implementation.
metadata:
  title: Create Plugin
---

# Create a Port Plugin

## Official documentation (source of truth)

Platform rules (CSP, upload limits, param metadata), SDK APIs, and CLI behavior are defined by Port. **Treat Port docs and npm readmes as authoritative**; keep dependency versions current.

- [Plugins — Port Docs](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins)
- [`@port-labs/plugins-sdk`](https://www.npmjs.com/package/@port-labs/plugins-sdk) — host bridge, `usePortPluginData`, theming, `mergePageFilters`
- [`@port-labs/port-plugins-cli`](https://www.npmjs.com/package/@port-labs/port-plugins-cli) — upload, list, update, delete, metadata
- Starter: [port-plugin-sample](https://github.com/port-labs/port-plugin-sample)

## Core principles

Strategic defaults — tactical checklist in **Non-negotiables**; anti-patterns in [guidelines.md](references/guidelines.md).

1. **Catalog over plugin params** — design and document the catalog first (MCP + README **Prerequisites**). `upload-params.json` only scopes behaviour the API and `PLUGIN_DATA` cannot supply.
2. **UX and UI matter** — loading, empty, and error states; theme alignment; full-iframe layout. See [scaffolding-and-implementation.md](references/scaffolding-and-implementation.md) (**UX and UI**).
3. **Safe rendering only** — React text/elements only for dynamic content; no `innerHTML`, `outerHTML`, or `dangerouslySetInnerHTML` (vetted sanitizer only if unavoidable).
4. **Reuse before creating** — survey repo `README.md` and sibling plugins before scaffolding.
5. **Relation strategy before params** — pick or add catalog relations first; resolve at runtime via `PLUGIN_DATA.entity` and `entities/search` — not relation-key `string` params by default.
6. **Runtime via Port API; MCP at design-time only** — `portApiBaseUrl` + token in the iframe; `list_blueprints` / `upsert_blueprint` in the IDE only.

## Overview

Plugins in this repo are **custom widgets**: each compiles to a single `dist/index.html` (webpack, inlined assets), runs in a Port `<iframe>`, and is registered via the CLI. Use this skill to **reuse** an existing plugin (configure or recommend as-is) or **create** a new one from the bundled templates. Params live in `upload-params.json`; see `assets/` and `references/`.

## Choose a workflow

| Goal | Follow |
|------|--------|
| **Reuse** an existing plugin (exact or superset match — configure, don’t rebuild) | [references/reuse-workflow.md](references/reuse-workflow.md) (stop when a match is found) |
| **Audit or align** an existing plugin (README, params, SDK, build, upload docs) | [references/readme-and-audit.md](references/readme-and-audit.md) |
| **Copy, adapt, or scaffold** a new plugin | Steps below → [references/reuse-workflow.md](references/reuse-workflow.md) then [references/scaffolding-and-implementation.md](references/scaffolding-and-implementation.md) |

## Quick decision tree

```
User requests a widget
        ↓
Read repo README.md — what widgets exist? (note Version column vs package.json)
        ↓
Exact match? → Recommend existing widget; stop
        ↓
Similar (60%+)? → Copy & adapt (reuse-workflow.md)
Else → Scaffold from assets/ (scaffolding-and-implementation.md)
        ↓
Query Port catalog via MCP — blueprint, property, and relation strategy (document in README)
        ↓
Inspect blueprint schemas — reuse existing relations/properties before adding new relations
        ↓
Add or reuse catalog relations; resolve links at runtime from entity + search — no relation string params by default
        ↓
Define minimal upload-params.json only after catalog strategy is settled (no params for API-fetchable catalog data)
        ↓
Implement with strong UX/UI + safe React rendering → plugin-architecture.md + scaffolding-and-implementation.md
        ↓
Document → readme-and-audit.md (per-plugin README §8)
```

## Step-by-step workflow

### 1. Survey and decide widget strategy

Before scaffolding or editing blueprints:

1. Read the project `README.md` (Plugins table: widget link, **Version**, description) and related plugins’ `package.json`, `upload-params.json`, `src/types.ts`, and `src/App.tsx`.
2. Choose: **reuse as-is**, **copy & adapt**, **new widget with shared params**, or **greenfield scaffold**.

Full decision matrix, checklist, and examples: **[references/reuse-workflow.md](references/reuse-workflow.md)**.

### 2. Design catalog strategy (MCP, design-time only)

With the widget strategy set, inspect the live catalog **before** drafting `upload-params.json`:

1. Call `list_blueprints` (summary) then `list_blueprints` with `identifiers` for full schema on candidates.
2. Pick: **existing blueprint + existing properties**, **existing + new properties**, or **new blueprint**.
3. For each cross-blueprint link, **read both source and target blueprint schemas** before proposing a new relation — prefer an existing relation or a property on the target blueprint when it already exposes the data the widget needs.
4. Explain the choice to the user; document schema changes in the plugin README **Prerequisites** tables.

Use `upsert_blueprint` only when the user wants catalog changes applied via MCP. Widget **runtime** code still uses the REST API, not MCP.

**Relation resolution order (runtime):** `PLUGIN_DATA.entity` → `POST .../entities/search` (`relatedTo` / relation rules) → pick unambiguously from `GET /v1/blueprints/{identifier}` using the **designed** relation identifiers → optional string override **only** when the user explicitly needs multi-tenant relation-key variance the catalog cannot normalize. Details: [scaffolding-and-implementation.md](references/scaffolding-and-implementation.md) (**Catalog over plugin params**, **Prefer discovering relations**).

### 3. Scaffold or adapt implementation

- **Templates:** copy verbatim/adapt from [assets/](assets/) per [references/scaffolding-and-implementation.md](references/scaffolding-and-implementation.md).
- **Host bridge, local dev mocks, API calls, search body shape, portal URLs, params, relations, layout, theming:** same reference + [references/plugin-architecture.md](references/plugin-architecture.md).
- **Repo layout, naming, optional CI upload:** [references/widget-conventions.md](references/widget-conventions.md).

### 4. Verify build and configuration

- `npm run dev` → `http://localhost:9000` (`devServer.port: 9000` in `webpack.config.js`)
- `npm run build` → artifact `dist/index.html`
- Webpack `inject: "body"` and root `height: 100%` — [references/plugin-architecture.md](references/plugin-architecture.md) (Critical Webpack/CSS)
- Entity search: `{ query: { combinator, rules } }` on `POST /v1/blueprints/{blueprint}/entities/search`
- `applyThemeCss()` when using the SDK

### 5. Document and ship

- **Bump `package.json` `version` once per branch** when the plugin has functional changes — based on **all** changes on the branch since merge base, not once per agent invocation. Semver from the aggregate change (patch / minor / major). Sync the repo root **Plugins** table **Version** column. Workflow: [readme-and-audit.md](references/readme-and-audit.md) (**Versioning — once per branch**).
- Per-plugin **README** (required section order): [references/readme-and-audit.md](references/readme-and-audit.md)
- Repo-level widgets table row when adding a new plugin (include **Version** from that plugin’s `package.json` `version` field)
- Canonical **`port-plugins upload`** command — exact flags in [references/readme-and-audit.md](references/readme-and-audit.md) (Setup → Upload); do not invent CLI flags

### 6. Review anti-patterns and persistence

Before finishing: [references/guidelines.md](references/guidelines.md) (anti-patterns, Port vs `localStorage`, troubleshooting table).

## Verify

Before marking the plugin done:

1. Run `npm run dev` on `http://localhost:9000` and `npm run build` — confirm `dist/index.html` exists.
2. Validate the plugin identifier against Port’s regex (see **Non-negotiables** → Plugin identifier).
3. Confirm per-plugin README section order and upload command per [readme-and-audit.md](references/readme-and-audit.md).
4. Walk the **Non-negotiables** table and [guidelines.md](references/guidelines.md) anti-patterns.
5. If the branch has functional plugin changes, confirm **`package.json` `version`** was bumped **once for the branch** (not re-bumped every invocation) and the root **`README.md` Plugins** **Version** cell matches — [readme-and-audit.md](references/readme-and-audit.md) (**Versioning — once per branch**).

## Non-negotiables (always apply)

| Topic | Rule |
|-------|------|
| Rendering | **No** `innerHTML`, `outerHTML`, or `dangerouslySetInnerHTML` for dynamic/user content — React text/elements or vetted sanitizer only |
| UX / UI | Loading, empty, and error states; `applyThemeCss()`; responsive full-iframe layout; accessible controls — treat widgets as product UI |
| CSS decorations | `:root` = surfaces/text/borders only; optional palette aliases (`--gold`, `--bronze`, …) at **300**; add **`--{hue}-bg`** / **`--{hue}-text`** when pills/badges need visible backgrounds + readable labels — see scaffolding **Optional palette and shade variants** |
| Runtime vs params | Fetch blueprints, schema, relations, entities via Port API + `PLUGIN_DATA` — **no** params that duplicate that data |
| API host | `portApiBaseUrl` + token for `/v1/...` only |
| Portal URLs | `getPortalOrigin()` from `document.referrer`; `{origin}/{blueprint}Entity?identifier={id}` |
| Blueprint params | `type: "blueprint"`; read `.identifier`; max **5** per plugin |
| Relations | **Schema first:** MCP-inspect source + target blueprints before adding relations. **Catalog:** reuse or add blueprint relations; document in README. **No** relation-key `string` params by default. **Runtime:** `entity.relations` / `relationsObjects` → `relatedTo` search → blueprint GET using designed relation IDs → relation `string` param **only** as documented last-resort override |
| Local dev | **`devServer.port: 9000`** always (`http://localhost:9000`); **small mocks** in `usePostMessageData.ts` + `src/dev/` or `api/` early returns when `DEV_MOCK` — enough to render loading/empty/happy paths outside Port’s iframe. **Portal links from mock IDs do not work there** — document in README **Local development**; test links in Port **Local development** (iframe) or after deploy |
| Subject blueprint | If widget targets one blueprint type, use **`PLUGIN_DATA.entity.blueprint`** + design default — skip blueprint param when not needed |
| Param schema | Every param: **`type`**, **`isRequired`**, **`label`** |
| Param labels | Short **`label`** in `upload-params.json`; defaults and detail in README **Widget parameters** |
| README prerequisites | Tables for catalog **and** other Port setup (relations, automations, SSA, integrations, …) — see [readme-and-audit.md](references/readme-and-audit.md) |
| Search | Nested `query`; not top-level `combinator`/`rules` |
| Dashboard page filters | On `POST .../entities/search` with a `query`, merge `page.pageFilters` via **`mergePageFilters`**; pass the **full blueprint** from **`params.blueprint.value`** as the third argument (not `{ identifier }` only) — [plugin-architecture.md](references/plugin-architecture.md) |
| Errors | Include full response body text |
| Iframe UI | Full width/height; **no** plugin title, description, or icon inside the iframe |
| Icons | icon library; **never** hardcoded emoji |
| Plugin identifier | `PLUGIN_IDENTIFIER_REGEX` — validate `--identifier` (and folder name when aligned) **before** every `port-plugins upload`; reject `.`, `..`, spaces, and other disallowed characters |
| Persistence | Port entities/properties unless explicitly local-only UI state |
| Upload CLI | `port-plugins upload` with **`--file`**, **`--identifier`**, **`--title`**, **`--params`**, **`--description`**, **`--upsert`** only — see [readme-and-audit.md](references/readme-and-audit.md) |
| Versioning | **Once per git branch** per plugin: bump `package.json` **`version`** from merge-base semver using **cumulative** branch changes (patch / minor / major); sync root **`README.md` Plugins** **Version** — **not** on every agent invocation; see [readme-and-audit.md](references/readme-and-audit.md) (**Versioning — once per branch**) |

## Reference index

| File | Contents |
|------|----------|
| [reuse-workflow.md](references/reuse-workflow.md) | Reuse steps 1–5, blueprint matrix, checklist, adapt vs create, code-reuse patterns |
| [scaffolding-and-implementation.md](references/scaffolding-and-implementation.md) | Templates, `App.tsx` implementation, params, relations, code layout, **optional palette + `-bg`/`-text` variants** |
| [readme-and-audit.md](references/readme-and-audit.md) | Auditing existing plugins, PR checklist, per-plugin README §8 |
| [plugin-architecture.md](references/plugin-architecture.md) | postMessage, `PLUGIN_DATA`, API, theming, build/deploy, local dev |
| [webpack-port-upload-safety.md](references/webpack-port-upload-safety.md) | **Optional** `globalObject` / lodash shim when upload rejects `Function` or using chart libs |
| [widget-conventions.md](references/widget-conventions.md) | Directory layout, naming, optional automation |
| [guidelines.md](references/guidelines.md) | Anti-patterns, data persistence, troubleshooting |

## Tools reference (design-time)

Use Port MCP while planning the widget and catalog — **not** from widget runtime code.

| Tool | Purpose |
|------|---------|
| `list_blueprints` | Discover blueprints; pass `identifiers` for full property/relation schemas |
| `upsert_blueprint` | Create or extend blueprints when the user approves catalog changes |
| `list_entities` | Sample entities to validate identifiers and property shapes |
| `upsert_entity` | Rare during widget work; seed or fix test data if needed |

## Assets

Scaffold copies from `assets/` (skill root; in this repo also `.cursor/skills/create-port-plugin/assets/`):

| Template | Destination |
|----------|-------------|
| `template-webpack.config.js` | `<widget>/webpack.config.js` |
| `webpack/lodash-root-shim.js` | `<widget>/webpack/lodash-root-shim.js` — **optional**; only with [webpack-port-upload-safety.md](references/webpack-port-upload-safety.md) |
| `template-tsconfig.json` | `<widget>/tsconfig.json` |
| `template-index.html` | `<widget>/src/index.html` |
| `template-index.tsx` | `<widget>/src/index.tsx` |
| `template-usePostMessageData.ts` | `<widget>/src/hooks/usePostMessageData.ts` |
| `template-useScrollMirror.ts` | `<widget>/src/hooks/useScrollMirror.ts` (optional; wide tables with bottom horizontal scrollbar) |
| `template-package.json` | `<widget>/package.json` (adapt `name`) |
| `template-App.tsx`, `template-App.css`, `template-types.ts`, `template-upload-params.json` | Adapt under `<widget>/src/` and root |
