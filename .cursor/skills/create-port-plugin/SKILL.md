---
name: create-port-plugin
description: >-
  Reuse existing Port custom plugins in the repo or build new ones from scratch as self-contained
  React/TypeScript iframe widgets (@port-labs/plugins-sdk, port-plugins-cli) uploaded as Port
  plugins. Use when recommending an existing plugin, copying/adapting one, greenfield scaffolding, or auditing upload-params.json and per-plugin README. Do not use for Ocean
  integrations, generic Port admin without plugin code, or blueprint-only catalog work with no
  widget implementation.
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

1. **Catalog over plugin params** — blueprints, properties, **relations**, and entity data come from the Port API and host context at **runtime**. Design and document the catalog first (MCP + README **Prerequisites**). `upload-params.json` only scopes behaviour the API and `PLUGIN_DATA` cannot supply — never duplicate lists of blueprints, relation keys, property inventories, or entity identifiers that `GET /v1/blueprints`, `GET /v1/blueprints/{identifier}`, `PLUGIN_DATA.entity`, or `POST .../entities/search` already provide.
2. **UX and UI matter** — widgets are product surfaces inside Port, not throwaway panels. Invest in loading, empty, and error states; theme alignment; responsive layout; accessible controls; and clear actions. Match Port’s visual language (SDK theme tokens, spacing, typography) — see [scaffolding-and-implementation.md](references/scaffolding-and-implementation.md) (**UX and UI**). **Surface tokens** (`--bg`, `--card`, `--text`, `--border`) belong in `:root`; **decorations** (dots, badges, accent text, links, chart series) get **dedicated colors on their class** — not `--accent` / `--primary` from `:root`.
3. **Safe rendering only** — never use `innerHTML`, `outerHTML`, or `dangerouslySetInnerHTML` to render dynamic or user-supplied content. Use React elements, text nodes, or a vetted sanitizer if HTML is unavoidable (rare in widgets).
4. **Reuse widgets and blueprints** before creating duplicates — survey the repo `README.md` and sibling `upload-params.json` files first.
5. **Catalog changes are normal** — add properties, relations, or blueprints when the use case needs them; document in README prerequisite tables.
6. **Relation strategy before params** — while designing blueprints/properties, decide which **existing catalog relations** to use or which **new relations** to add so the widget can traverse the graph. After that, wire runtime code to **`PLUGIN_DATA.entity`** (`relations` / `relationsObjects`) and **`entities/search`** (`relatedTo` / relation rules). **Never** default to `string` params for relation identifiers (`parentRelation`, `taskRelation`, etc.).
7. **Single-blueprint widgets** — when the widget is built for one subject blueprint (e.g. calendar on Task), treat that blueprint as the design default: use **`PLUGIN_DATA.entity.blueprint`** on entity pages; omit a `type: "blueprint"` param unless the same build must also run on dashboards without host entity context.
8. **Cross-blueprint data via relations** — when the widget needs entities on another blueprint, rely on **catalog relations** between blueprints (and host/search resolution). **Before proposing a new relation**, inspect both blueprints’ schemas via MCP (`list_blueprints` with `identifiers`) — confirm an existing relation or target properties do not already satisfy the need. Document missing relations in README; add them via MCP when approved — do not ask operators to type relation keys in params.
9. **Local dev outside Port** — always run `npm run dev` on **port 9000** (`devServer.port: 9000` in `webpack.config.js`; URL `http://localhost:9000`). Do not assign per-widget ports — Port’s **Local development** iframe mode expects 9000. Keep **small, focused mock data** in `usePostMessageData.ts` (host context) and `src/dev/` or early returns in `api/` (API shapes) so previews work without live tokens. Details: [scaffolding-and-implementation.md](references/scaffolding-and-implementation.md) (**Local dev mock data**).
10. **Runtime data via Port HTTP API only** — `portApiBaseUrl` + bearer token from the host; MCP is for **design-time** catalog discovery in the IDE, not inside the iframe.
11. **Minimize remaining params** — prefer `type: "blueprint"` only when the admin must **pick** a blueprint scope the widget cannot infer (e.g. child blueprint on a dashboard). Do **not** add params to list blueprints, entities, relations, or property keys — fetch those at runtime. Prefer schema defaults and **`GET /v1/blueprints/{identifier}`** before optional property-key `string` overrides.
12. **Param schema** — every entry in `upload-params.json` must include **`type`**, **`isRequired`**, and **`label`** (no partial objects).
13. **Short param labels** — **`label`** values are short, simple, and meaningful (what the admin is choosing). Defaults, examples, and long explanations belong in the per-plugin README **Widget parameters** table — not in Port’s param label field.
14. **README Port prerequisites** — document every **new or required Port instance** operators must create or configure before the widget works: blueprints, properties, **relations**, integrations, **automations**, **self-service actions (SSA)**, scorecards, pages, and similar. Use tables in README **Prerequisites**; do not rely on param labels to carry setup instructions.
15. **Portal links** — origin from `document.referrer`, fallback `https://app.port.io`; never `portApiBaseUrl` for UI links.
16. **No duplicate chrome** — Port’s iframe wrapper already shows the plugin **title**, **description**, and **icon** from registration; **do not** add them inside the widget (`App.tsx`, headers, heroes). Build functional UI only (lists, filters, forms, charts). In-content labels and the **current entity** title are fine — they are not plugin registration metadata.
17. **Icons in widget UI** — **never** hardcode emoji (Unicode symbols in JSX or strings). When icons are needed, use a vetted **icon library** (e.g. Lucide, react-icons) — not emoji.

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

- Per-plugin **README** (required section order): [references/readme-and-audit.md](references/readme-and-audit.md)
- Repo-level widgets table row when adding a new plugin (include **Version** from that plugin’s `package.json` `version` field)
- Canonical upload command (see scaffolding reference or plugin-architecture **Deployment**)

### 6. Review anti-patterns and persistence

Before finishing: [references/guidelines.md](references/guidelines.md) (anti-patterns, Port vs `localStorage`, troubleshooting table).

## Non-negotiables (always apply)

| Topic | Rule |
|-------|------|
| Rendering | **No** `innerHTML`, `outerHTML`, or `dangerouslySetInnerHTML` for dynamic/user content — React text/elements or vetted sanitizer only |
| UX / UI | Loading, empty, and error states; `applyThemeCss()`; responsive full-iframe layout; accessible controls — treat widgets as product UI |
| CSS decorations | `:root` = surfaces/text/borders only; dots, badges, links, accent text use **class-local** color vars (e.g. `--day-dot-color`) — **no** shared `--accent` / `--primary` on decorations — see scaffolding **Surface vs decoration colors** |
| Runtime vs params | Fetch blueprints, schema, relations, entities via Port API + `PLUGIN_DATA` — **no** params that duplicate that data |
| API host | `portApiBaseUrl` + token for `/v1/...` only |
| Portal URLs | `getPortalOrigin()` from `document.referrer`; `{origin}/{blueprint}Entity?identifier={id}` |
| Blueprint params | `type: "blueprint"`; read `.identifier`; max **5** per plugin |
| Relations | **Schema first:** MCP-inspect source + target blueprints before adding relations. **Catalog:** reuse or add blueprint relations; document in README. **No** relation-key `string` params by default. **Runtime:** `entity.relations` / `relationsObjects` → `relatedTo` search → blueprint GET using designed relation IDs → relation `string` param **only** as documented last-resort override |
| Local dev | **`devServer.port: 9000`** always (`http://localhost:9000`); **small mocks** in `usePostMessageData.ts` + `src/dev/` or `api/` early returns when `DEV_MOCK` — enough to render loading/empty/happy paths outside Port’s iframe |
| Subject blueprint | If widget targets one blueprint type, use **`PLUGIN_DATA.entity.blueprint`** + design default — skip blueprint param when not needed |
| Param schema | Every param: **`type`**, **`isRequired`**, **`label`** |
| Param labels | Short **`label`** in `upload-params.json`; defaults and detail in README **Widget parameters** |
| README prerequisites | Tables for catalog **and** other Port setup (relations, automations, SSA, integrations, …) — see [readme-and-audit.md](references/readme-and-audit.md) |
| Search | Nested `query`; not top-level `combinator`/`rules` |
| Errors | Include full response body text |
| Iframe UI | Full width/height; **no** plugin title, description, or icon inside the iframe |
| Icons | icon library; **never** hardcoded emoji |
| Persistence | Port entities/properties unless explicitly local-only UI state |

## Reference index

| File | Contents |
|------|----------|
| [reuse-workflow.md](references/reuse-workflow.md) | Reuse steps 1–5, blueprint matrix, checklist, adapt vs create, code-reuse patterns |
| [scaffolding-and-implementation.md](references/scaffolding-and-implementation.md) | Templates, `App.tsx` implementation, params, relations, code layout |
| [readme-and-audit.md](references/readme-and-audit.md) | Auditing existing plugins, PR checklist, per-plugin README §8 |
| [plugin-architecture.md](references/plugin-architecture.md) | postMessage, `PLUGIN_DATA`, API, theming, build/deploy, local dev |
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

Scaffold copies from `.cursor/skills/create-port-plugin/assets/`:

| Template | Destination |
|----------|-------------|
| `template-webpack.config.js` | `<widget>/webpack.config.js` |
| `template-tsconfig.json` | `<widget>/tsconfig.json` |
| `template-index.html` | `<widget>/src/index.html` |
| `template-index.tsx` | `<widget>/src/index.tsx` |
| `template-usePostMessageData.ts` | `<widget>/src/hooks/usePostMessageData.ts` |
| `template-package.json` | `<widget>/package.json` (adapt `name`) |
| `template-App.tsx`, `template-App.css`, `template-types.ts`, `template-upload-params.json` | Adapt under `<widget>/src/` and root |
