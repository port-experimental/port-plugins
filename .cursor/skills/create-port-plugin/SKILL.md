---
name: create-port-plugin
description: >-
   Build Port custom plugins or widgets from scratch, or reuse and verify existing ones in the repo, as self-contained React/TypeScript iframe plugins (@port-labs/plugins-sdk, port-plugins-cli) uploaded via CLI. Use for greenfield scaffolding, copying/adapting plugins, recommending an existing match, or auditing upload-params.json and per-plugin README. Do not use for Ocean integrations, generic Port admin without plugin code, or blueprint-only catalog work with no widget implementation.
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

Tactical rules in **Non-negotiables**; anti-patterns in [guidelines.md](references/guidelines.md).

1. **Catalog over plugin params** — design catalog first (MCP + README **Prerequisites**). `upload-params.json` only scopes what API + `PLUGIN_DATA` cannot supply.
2. **UX and UI matter** — loading, empty, error states; theme; full-iframe layout. [ui-and-styling.md](references/ui-and-styling.md).
3. **Safe rendering only** — React text/elements; no `innerHTML`, `outerHTML`, or `dangerouslySetInnerHTML`.
4. **Reuse before creating** — survey repo `README.md` and sibling plugins first.
5. **Relation strategy before params** — catalog relations first; runtime via `PLUGIN_DATA.entity` and `entities/search` — not relation-key string params by default.
6. **Runtime via Port API; MCP at design-time only** — `portApiBaseUrl` + token in iframe; MCP in IDE only.
7. **Charts → Recharts** — bar/line/area/pie/donut viz; apply [webpack-port-upload-safety.md](references/webpack-port-upload-safety.md). [ui-and-styling.md](references/ui-and-styling.md) (**Charts**).

## Overview

Each plugin compiles to **`dist/index.html`** (webpack, inlined assets), runs in a Port `<iframe>`, registers via CLI. **Reuse** an existing plugin or **create** from `assets/` templates.

## Choose a workflow

| Goal | Follow |
|------|--------|
| **Reuse** existing plugin (exact/superset — configure, don't rebuild) | [reuse-workflow.md](references/reuse-workflow.md) — stop when matched |
| **Audit or align** existing plugin | [readme-and-audit.md](references/readme-and-audit.md) |
| **Copy, adapt, or scaffold** | [reuse-workflow.md](references/reuse-workflow.md) → [scaffolding.md](references/scaffolding.md) |

## Quick decision tree

```
User request
  → Read repo README.md (plugins + versions)
  → Exact match? → Recommend; stop
  → Similar 60%+? → Copy & adapt (reuse-workflow.md)
  → Else → Scaffold (scaffolding.md)
  → MCP catalog + relation strategy → README Prerequisites
  → Minimal upload-params.json (params-and-relations.md)
  → Implement (implementation.md + ui-and-styling.md + plugin-architecture.md)
  → Document (readme-and-audit.md + template-README.md)
  → Review (guidelines.md)
```

## Step-by-step workflow

### 1. Survey and decide

1. Read root `README.md` and related plugins' `package.json`, `upload-params.json`, `types.ts`, `App.tsx`.
2. Choose: **reuse as-is**, **copy & adapt**, **shared params**, or **greenfield scaffold**.

Details: [reuse-workflow.md](references/reuse-workflow.md) Steps 1–3.

### 2. Design catalog strategy (MCP, design-time)

Before `upload-params.json`:

1. `list_blueprints` (summary) → `list_blueprints` with `identifiers` for schemas.
2. Pick blueprint strategy: existing properties, extend blueprint, or new blueprint.
3. Inspect **both** source and target schemas before new relations.
4. Document in README **Prerequisites**; `upsert_blueprint` only when user approves.

**Runtime relation order:** `PLUGIN_DATA.entity` → `relatedTo` search → blueprint GET → optional string override (last resort). [params-and-relations.md](references/params-and-relations.md).

### 3. Scaffold or adapt

- Templates: [scaffolding.md](references/scaffolding.md) + [assets/](assets/)
- Runtime patterns: [implementation.md](references/implementation.md)
- Host bridge, build, API: [plugin-architecture.md](references/plugin-architecture.md)
- Layout, naming: [plugin-conventions.md](references/plugin-conventions.md)

### 4. Verify build and production readiness

- `npm run dev` → `http://localhost:9000` (port **9000** always) — UI must be **visible**, not a blank panel
- `npm run build` → `dist/index.html`
- Webpack `inject: "body"`; root `height: 100%`; `#plugin-root` flex column — [ui-and-styling.md](references/ui-and-styling.md)
- Entity search: `{ query: { combinator, rules } }`
- `applyThemeCss()` on every host path (including Port iframe)
- **Mandatory:** [production-readiness.md](references/production-readiness.md) — hooks order, query UI states, param/entity resolution

### 5. Document and ship

- Version bump **once per branch** — [readme-and-audit.md](references/readme-and-audit.md) (**Versioning**)
- README from `assets/template-README.md` — [readme-and-audit.md](references/readme-and-audit.md)
- **Add a row to the root `README.md` Plugins table** for every newly created plugin (append at the end of the table):

  ```markdown
  | [<Title>](./<folder-name>) | <version from package.json> | <one-line description> |
  ```

  Example:
  ```markdown
  | [Blueprint Table](./blueprint-table) | 0.1.0 | Multi-blueprint entity table with configurable columns |
  ```

  The description must match the first sentence of the plugin's own README (keep them in sync).
- Canonical upload command in README — no invented CLI flags

### 6. Final review

[guidelines.md](references/guidelines.md) — anti-patterns, persistence, troubleshooting.  
[production-readiness.md](references/production-readiness.md) — **blank iframe / hooks / layout checklist**.

## Verify (before done)

1. [production-readiness.md](references/production-readiness.md) — all §1–§9 (especially hooks before early returns, `isPending`, iframe layout).
2. `npm run dev` shows guard or functional UI (not empty white); `npm run build` → `dist/index.html`.
3. Plugin identifier passes regex (Non-negotiables).
4. README section order + upload command per [readme-and-audit.md](references/readme-and-audit.md).
5. Non-negotiables + [guidelines.md](references/guidelines.md) anti-patterns.
6. If functional changes on branch: **one** version bump; root Plugins **Version** matches. New plugins: row added to root `README.md` Plugins table with correct folder link, version, and description.

## Non-negotiables

| Topic | Rule |
|-------|------|
| Rendering | No `innerHTML` / `outerHTML` / `dangerouslySetInnerHTML` for dynamic content |
| UX / UI | Loading, empty, error; `applyThemeCss()`; full-iframe layout — [ui-and-styling.md](references/ui-and-styling.md) |
| Hooks | **All** hooks at top of `App` before any `return`; gate fetches with `enabled` — [production-readiness.md](references/production-readiness.md) §1 |
| Port iframe | No blank main while loading; `isPending \|\| isLoading`; `#plugin-root` flex + `min-height` on shell — [production-readiness.md](references/production-readiness.md) §2–§3 |
| Params / entity | `template-config.ts` + `template-resolveHostEntity.ts` for blueprint params and entity pages — [production-readiness.md](references/production-readiness.md) §5–§6 |
| Charts | Recharts unless trivial; webpack safety — [webpack-port-upload-safety.md](references/webpack-port-upload-safety.md) |
| CSS | `:root` = surfaces/text/borders; decorations class-local; palette `-bg`/`-text` for pills |
| Runtime vs params | Fetch catalog via API + `PLUGIN_DATA` — no duplicate params |
| API host | `portApiBaseUrl` + token for `/v1/...` only |
| Portal URLs | `getPortalOrigin()` from `document.referrer`; `{origin}/{blueprint}Entity?identifier={id}` |
| Blueprint params | `type: "blueprint"`; Port wraps value — access via `params.<name>.value` (full obj) or `params.<name>.value.identifier` (for API); `.type` field is `unknown`; max **5** |
| Relations | Schema-first MCP; catalog + README; no relation string params by default |
| Local dev | Port **9000**; small mocks; document mock portal link limits in README |
| Subject blueprint | `PLUGIN_DATA.entity.blueprint` on entity pages when design default suffices |
| Param schema | Every param: `type`, `isRequired`, `label` |
| Param labels | Short in JSON; detail in README **Plugin parameters** |
| README | Prerequisites tables before params — [readme-and-audit.md](references/readme-and-audit.md) |
| Search | Nested `query`; not top-level `combinator`/`rules` |
| Page filters | `mergePageFilters` with **full** blueprint object — [plugin-architecture.md](references/plugin-architecture.md) |
| Errors | Include full response body text |
| Iframe UI | Full width/height; no duplicate plugin title/description/icon |
| Icons | Icon library; never emoji |
| Plugin identifier | Validate `--identifier` against regex before upload |
| Persistence | Port entities unless explicitly local-only UI — [guidelines.md](references/guidelines.md) |
| Upload CLI | `--file`, `--identifier`, `--title`, `--params`, `--description`, `--upsert` only |
| Versioning | Once per branch; greenfield stays `0.1.0` — [readme-and-audit.md](references/readme-and-audit.md) |
| Root README | New plugin: append row to root `README.md` Plugins table — `| [Title](./folder) | version | one-line description |` |

## Reference index

Reference files **over 100 lines** must start with a **`## Table of contents`** (after the title) listing all major sections — so partial reads still show full scope.

| File | Read when |
|------|-----------|
| [reuse-workflow.md](references/reuse-workflow.md) | Deciding reuse vs adapt vs scaffold; catalog MCP steps |
| [scaffolding.md](references/scaffolding.md) | Copying templates; code layout; local verify |
| [implementation.md](references/implementation.md) | API calls, search, portal links, mocks, safe rendering |
| [params-and-relations.md](references/params-and-relations.md) | `upload-params.json`; relation resolution; blueprint params |
| [ui-and-styling.md](references/ui-and-styling.md) | UX, layout, CSS, Recharts, scrollbars |
| [plugin-architecture.md](references/plugin-architecture.md) | postMessage, `PLUGIN_DATA`, mergePageFilters, build, deploy |
| [readme-and-audit.md](references/readme-and-audit.md) | Audit, versioning, PR checklist, README standard |
| [plugin-conventions.md](references/plugin-conventions.md) | Naming, repo layout, optional CI upload |
| [guidelines.md](references/guidelines.md) | Anti-patterns, persistence, troubleshooting |
| [production-readiness.md](references/production-readiness.md) | **Mandatory** before done — hooks, layout, query states, Port smoke test |
| [webpack-port-upload-safety.md](references/webpack-port-upload-safety.md) | Recharts / lodash upload fixes |

## MCP tools (design-time only)

| Tool | Purpose |
|------|---------|
| `list_blueprints` | Discover schemas; pass `identifiers` for full detail |
| `upsert_blueprint` | Create/extend blueprints when user approves |
| `list_entities` | Sample entities for validation |
| `upsert_entity` | Rare — seed test data |

## Assets

From `assets/` (this skill directory):

| Template | Destination |
|----------|-------------|
| `template-webpack.config.js` | `<plugin>/webpack.config.js` |
| `webpack/lodash-root-shim.js` | `<plugin>/webpack/` — required with Recharts |
| `template-tsconfig.json` | `<plugin>/tsconfig.json` |
| `template-index.html` | `<plugin>/src/index.html` |
| `template-index.tsx` | `<plugin>/src/index.tsx` |
| `template-usePostMessageData.ts` | `<plugin>/src/hooks/usePostMessageData.ts` |
| `template-useScrollMirror.ts` | `<plugin>/src/hooks/useScrollMirror.ts` (optional) |
| `template-package.json` | `<plugin>/package.json` |
| `template-App.tsx`, `template-App.css`, `template-types.ts`, `template-upload-params.json` | Adapt under `<plugin>/` |
| `template-config.ts` | `<plugin>/src/utils/config.ts` — blueprint/string param readers |
| `template-resolveHostEntity.ts` | `<plugin>/src/utils/resolveHostEntity.ts` — **entity-page** widgets |
| `template-README.md` | `<plugin>/README.md` — [readme-and-audit.md](references/readme-and-audit.md) |
