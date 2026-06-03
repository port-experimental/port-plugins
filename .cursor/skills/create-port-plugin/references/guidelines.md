# Guidelines

Anti-patterns, persistence, and troubleshooting for Port plugins.

## Table of contents

- [Guidelines](#guidelines)
- [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
  - [❌ Don't: Use `innerHTML` or `dangerouslySetInnerHTML`](#dont-use-innerhtml-or-dangerouslysetinnerhtml)
  - [❌ Don't: Add plugin params for data the Port API provides at runtime](#dont-add-plugin-params-for-data-the-port-api-provides-at-runtime)
  - [❌ Don't: Put long explanations in param labels](#dont-put-long-explanations-in-param-labels)
  - [❌ Don't: Omit Port setup from README prerequisites](#dont-omit-port-setup-from-readme-prerequisites)
  - [❌ Don't: Ship bare-minimum UI](#dont-ship-bare-minimum-ui)
  - [❌ Don't: Call hooks after early returns (blank iframe in Port)](#dont-call-hooks-after-early-returns-blank-iframe-in-port)
  - [❌ Don't: Hand-roll chart UIs when Recharts fits](#dont-hand-roll-chart-uis-when-recharts-fits)
  - [❌ Don't: Use `:root` accent tokens for decorations](#dont-use-root-accent-tokens-for-decorations)
  - [❌ Don't: Use one palette shade for pill background and text](#dont-use-one-palette-shade-for-pill-background-and-text)
  - [❌ Don't: Repeat plugin title, description, or icon in the iframe](#dont-repeat-plugin-title-description-or-icon-in-the-iframe)
  - [❌ Don't: Use emoji or omit param fields](#dont-use-emoji-or-omit-param-fields)
  - [❌ Don't: Create Duplicate Blueprints](#dont-create-duplicate-blueprints)
  - [❌ Don't: Reinvent Existing Functionality](#dont-reinvent-existing-functionality)
  - [❌ Don't: Create Monolithic Widgets](#dont-create-monolithic-widgets)
  - [❌ Don't: Add a catalog relation without reading blueprint schemas](#dont-add-a-catalog-relation-without-reading-blueprint-schemas)
  - [❌ Don't: Ship without local dev mocks (or with huge fixtures)](#dont-ship-without-local-dev-mocks-or-with-huge-fixtures)
  - [❌ Don't: Omit README notice when portal links use mock data](#dont-omit-readme-notice-when-portal-links-use-mock-data)
  - [❌ Don't: Expose relation keys as string plugin params](#dont-expose-relation-keys-as-string-plugin-params)
  - [❌ Don't: Add a blueprint param when the subject blueprint is fixed](#dont-add-a-blueprint-param-when-the-subject-blueprint-is-fixed)
  - [❌ Don't: Hardcode Blueprint-Specific Logic](#dont-hardcode-blueprint-specific-logic)
  - [✅ Do: Design for Extension](#do-design-for-extension)
  - [❌ Don’t: Shrink the model to avoid catalog work](#dont-shrink-the-model-to-avoid-catalog-work)
- [Data Persistence — Prefer Port Entities over localStorage](#data-persistence-prefer-port-entities-over-localstorage)
  - [When to prefer Port](#when-to-prefer-port)
  - [Use `localStorage` / `sessionStorage` only for:](#use-localstorage-sessionstorage-only-for)
  - [Saving data to a Port entity property](#saving-data-to-a-port-entity-property)
  - [Creating a new entity to persist a record](#creating-a-new-entity-to-persist-a-record)
  - [Designing blueprints for widget-owned data](#designing-blueprints-for-widget-owned-data)
- [Troubleshooting](#troubleshooting)

## Anti-Patterns to Avoid

### ❌ Don't: Use `innerHTML` or `dangerouslySetInnerHTML`

**Bad:**
```typescript
container.innerHTML = userComment.body;
// or
<div dangerouslySetInnerHTML={{ __html: entity.properties.description }} />
```

**Good:**
```typescript
// Plain text
<p>{String(userComment.body ?? "")}</p>

// Structured fields — map to React components (badges, links, lists)
<CommentBody text={userComment.body} />
```

Widgets run in Port’s iframe with user and integration data. **Never** assign HTML strings to the DOM or use React’s unsafe HTML escape hatch for dynamic content. If rich text is a hard requirement, use a maintained sanitizer library and document the exception in the README — default is **text + components only**.

### ❌ Don't: Add plugin params for data the Port API provides at runtime

**Bad:**
```json
{
  "availableBlueprints": { "type": "array", "isRequired": true, "label": "Blueprints to show" },
  "parentRelation": { "type": "string", "isRequired": false, "label": "Parent relation key" },
  "statusProperty": { "type": "string", "isRequired": true, "label": "Status field" }
}
```
when the widget could call `GET /v1/blueprints`, `GET /v1/blueprints/{identifier}`, read `PLUGIN_DATA.entity`, or resolve relations via `entity.relations` / `relatedTo` search.

**Good:**
- **Blueprint list / schema** — `GET /v1/blueprints` or `GET /v1/blueprints/{identifier}` after the admin-scoped blueprint is known (from host entity or a single `type: "blueprint"` param when scope must be chosen).
- **Relations** — catalog relation identifiers in code + README; resolve via `entity.relations` / `relationsObjects`, `relatedTo` search, or blueprint GET.
- **Entities** — `POST .../entities/search` or host `PLUGIN_DATA.entity`; not free-text entity ID params unless the widget truly has no anchor entity.
- **Property keys** — defaults from README + blueprint schema; optional `string` override only when orgs rename fields and inference fails.

`upload-params.json` scopes **which** blueprint or behaviour the widget cannot infer — not a second copy of the catalog.

### ❌ Don't: Put long explanations in param labels

**Bad:**
```json
{
  "dueDateProperty": {
    "type": "string",
    "label": "Datetime property for due date (default: dueDate) — override if your catalog uses another key"
  }
}
```
(missing **`isRequired`**; label too long)

**Good:**
```json
{
  "dueDateProperty": {
    "type": "string",
    "isRequired": false,
    "label": "Due date property"
  }
}
```
Document default `dueDate`, override behaviour, and validation in README **Plugin parameters** and **Prerequisites**.

### ❌ Don't: Omit Port setup from README prerequisites

**Bad:** Widget calls a self-service action or assumes an automation, but README only lists blueprint params.

**Good:** README **Prerequisites** tables for every required Port instance (blueprints, relations, automations, SSA, integrations, …) before the minimal params table.

### ❌ Don't: Ship bare-minimum UI

**Bad:** Blank iframe until data arrives; raw API error JSON; no empty state when search returns zero rows; fixed 400px card in a full-width column; hard-coded colours that ignore Port dark mode.

**Good:** Skeleton or spinner while loading; friendly empty state with next step; actionable error copy (retry, check catalog); flex/grid layout that fills the iframe; `applyThemeCss()` and CSS variables with fallbacks (`var(--text-high, #111827)`). See [ui-and-styling.md](ui-and-styling.md).

### ❌ Don't: Call hooks after early returns (blank iframe in Port)

**Bad:**
```tsx
export function App() {
  const { portToken, entity } = usePostMessageData();
  if (!portToken) return <p>Waiting…</p>;
  const { data } = useQuery({ … }); // hook count changes when token arrives → React crash
}
```

**Good:**
```tsx
export function App() {
  const { portToken, entity } = usePostMessageData();
  const host = resolveHostSubject(entity);
  const { data, isPending, isLoading } = useQuery({
    enabled: !!portToken && !!host,
    …
  });
  if (!portToken) return <ShellMessage>Waiting…</ShellMessage>;
  const showLoading = isPending || isLoading;
  …
}
```

See [production-readiness.md](production-readiness.md) §1–§2 and **`assets/template-App.tsx`**.

### ❌ Don't: Hand-roll chart UIs when Recharts fits

**Bad:** Custom SVG pie sectors, CSS-only column charts, or canvas drawing for standard bar/line/pie/donut breakdowns and trends.

**Good:** [Recharts](https://recharts.org/) with `ResponsiveContainer`, themed axes/tooltips, and [webpack-port-upload-safety.md](webpack-port-upload-safety.md) applied when the dependency is added. See [ui-and-styling.md](ui-and-styling.md) (**Charts**).

### ❌ Don't: Use `:root` accent tokens for decorations

**Bad:**
```css
:root {
  --accent: var(--primary, #2563eb);
}
.day-dot {
  background: var(--accent);
}
.entity-link {
  color: var(--accent);
}
```

**Good:** `:root` maps surfaces/text/borders; each decoration defines its own color on the class:
```css
.day-dot {
  --day-dot-color: #2563eb;
  background: var(--day-dot-color);
}
```

See [ui-and-styling.md](ui-and-styling.md) (**Surface vs decoration colors**).

### ❌ Don't: Use one palette shade for pill background and text

**Bad:**
```css
.level--silver {
  --level-pill-bg: color-mix(in srgb, var(--silver) 22%, var(--card));
  --level-pill-text: var(--silver); /* both from -300 — invisible on white card */
}
```

**Good:** Base alias at **300** for strokes/dots; **`-bg`** (100/200) and **`-text`** (600–800) on `:root` for labels — see [ui-and-styling.md](ui-and-styling.md) (**Optional palette**).

### ❌ Don't: Repeat plugin title, description, or icon in the iframe

**Bad:** Header inside the widget with the same name as the Port plugin, a subtitle repeating the upload description, or a decorative icon matching the plugin’s Port icon.

**Good:** Start at functional UI (tabs, lists, filters). Port’s wrapper already shows registration metadata.

### ❌ Don't: Use emoji or omit param fields

**Bad:**
```tsx
<button>⭐ Favorite</button>
```
```json
{ "dueDateProperty": { "type": "string", "label": "Due date property" } }
```
(missing **`isRequired`**; emoji instead of an icon)

**Good:**
```tsx
// <i> + icon font, or an icon-library component — not emoji
<button type="button" aria-label="Favorite">
  <i className="your-icon-class" aria-hidden="true" />
</button>
```
```json
{
  "dueDateProperty": {
    "type": "string",
    "isRequired": false,
    "label": "Due date property"
  }
}
```

### ❌ Don't: Create Duplicate Blueprints

**Bad:**
```json
// widget-1/upload-params.json
{ "commentBlueprintId": { "type": "string", "isRequired": true, "label": "Comments" } }

// widget-2/upload-params.json
{ "discussionBlueprintId": { "type": "string", "isRequired": true, "label": "Discussions" } }
```
Both represent the same concept (comments/discussions) but use different parameter names.

**Good:**
```json
// Both widgets use consistent parameter name and the correct blueprint type
{ "commentBlueprint": { "type": "blueprint", "isRequired": true, "label": "Comment blueprint" } }
```

### ❌ Don't: Reinvent Existing Functionality

**Bad:** User asks for "task comment widget" and you scaffold from scratch without checking existing widgets.

**Good:** Check README, find `task-comment-chat` already exists, recommend it.

### ❌ Don't: Create Monolithic Widgets

**Bad:** User asks for "project management" and you create one massive widget that does everything (tasks, comments, files, chat, reports, etc.)

**Good:** Check which pieces exist as separate widgets. Suggest:
- Use `task-comment-chat` for comments
- Use `current-iteration` for sprint tracking  
- Create new focused widgets for missing pieces (e.g., file attachments)
- Let users compose these in their Port dashboard

### ❌ Don't: Add a catalog relation without reading blueprint schemas

**Bad:** Widget on `task` needs assignee email — propose new relation `task → user` without checking whether `task` already has `assignee` or `owner`, or whether `user` already exposes the fields you need.

**Good:** MCP `list_blueprints` with identifiers for `task` and `user` (and any hub blueprint). Reuse an existing relation or property; only add a relation when schemas show the graph cannot express the link. Document the inspected identifiers in README **Prerequisites → Relations**.

### ❌ Don't: Ship without local dev mocks (or with huge fixtures)

**Bad:** `npm run dev` shows “Waiting for Port” or blank lists because API modules always `fetch` with a fake token; or `mockData.ts` contains hundreds of copied production entities.

**Good:** Small mocks in `usePostMessageData.ts` + `src/dev/mockData.ts` / `api/` early returns when `DEV_MOCK` — enough to preview loading, empty, and one happy path. See [implementation.md](implementation.md) (**Local dev mocks**).

### ❌ Don't: Omit README notice when portal links use mock data

**Bad:** Widget renders “Open in Port” / entity links from mock fixtures; README **Local development** only lists mock files — contributors expect links to work at `localhost:9000`.

**Good:** README **Local development** (and **Troubleshooting** when links exist) states that **portal links built from mock or fixture identifiers do not work outside Port’s iframe**; validate links via Port **Local development** or after deploy.

### ❌ Don't: Expose relation keys as string plugin params

**Bad:**
```json
{
  "parentRelation": { "type": "string", "isRequired": true, "label": "Relation to parent entity" },
  "taskRelation": { "type": "string", "isRequired": true, "label": "Relation to task" }
}
```
Operators must type catalog structure that should live in **blueprint relations** and README tables.

**Good:**
1. During design, add or reuse a catalog relation (`parent` on `comment` → subject blueprint).
2. Document it in README **Prerequisites → Relations**.
3. At runtime: `entity.relationsObjects.parent`, or `relatedTo` search — relation identifier is a **code constant** aligned with the catalog.

Optional relation override params are **last resort only** — see [params-and-relations.md](params-and-relations.md).

### ❌ Don't: Add a blueprint param when the subject blueprint is fixed

**Bad:** Entity-page-only widget for `task` with required `taskBlueprint` `type: "blueprint"` param duplicating `PLUGIN_DATA.entity.blueprint`.

**Good:** Use `pluginData.entity` on entity pages; document `task` as the design default in README. Add `type: "blueprint"` only when the same build must run on dashboards without host entity context.

### ❌ Don't: Hardcode Blueprint-Specific Logic

**Bad:**
```typescript
// In task-comment-chat widget
if (blueprint === "task") {
  // Special handling for tasks only
}
```

**Good:**
```typescript
// Prefer entity context + search; avoid indexing relations by admin-supplied key first.
// 1) From host: entity.relationsObjects, or
// 2) From API: entities/search with relatedTo to the current entity.
// Use a config relation key only as an optional override when 1–2 cannot work.
const parentFromHost = entity.relationsObjects?.[resolvedParentRelationKey];
```

### ✅ Do: Design for Extension

**Blueprint parameters should support:**
- Different entity types (tasks, bugs, PRs, tickets)
- Different property names (body, message, text, description)
- Different relation names (task, parent, linkedTask)

**Example of extensible design:**
```typescript
import type { mergePageFilters } from "@port-labs/plugins-sdk";

export type BlueprintParam = NonNullable<
  Parameters<typeof mergePageFilters>[2]
> & { title?: string };

export type PluginConfig = {
  commentBlueprint: BlueprintParam; // omit on entity-only widgets when entity + README default suffice
  contentProperty?: string;         // optional override — default "body" in code / README
};

// Relation keys: catalog constant (README) → entity.relations → relatedTo search → GET (target match)
// No subjectRelation param unless documented last-resort override
```

Same plugin code works across catalogs when relations are modeled in Port and resolved from **entity context + search** — not from relation string params; see [params-and-relations.md](params-and-relations.md).

### ❌ Don’t: Shrink the model to avoid catalog work

**Bad:** The widget needs typed, queryable fields or a proper relation, but you recommend cramming JSON into a string property, overloading an unrelated blueprint, or leaving operators to “figure it out” without a schema plan — all to dodge a Port catalog edit.

**Good:** When the use case needs new properties or a new blueprint, specify them in README prerequisite tables and align `upload-params.json` (see [reuse-workflow.md](reuse-workflow.md) Steps 4–5).


## Data Persistence — Prefer Port Entities over localStorage

When a widget needs to **save state that must survive browser reloads, tab switches, or different users' sessions**, store it in Port rather than `localStorage` or `sessionStorage`.

Treat **Port-backed persistence as the default** for saved widget state. Treat **`localStorage` / `sessionStorage` as a narrow exception** — not the first choice merely because it is quicker to wire when the host already provides `portToken` and `portApiBaseUrl` for reads and writes.

### When to prefer Port

Prefer storing state in Port (entity properties or new entities via the HTTP API) when **any** of the following apply:

- Users would reasonably expect the **same data after a reload**, on a **different device**, or in a **different browser** (subject to the same Port account and permissions).
- The data is part of **product behaviour** rather than disposable **UI chrome** for one tab.
- **Other people** should see the same data according to Port access control.

When none of those apply and the data is **explicitly per-browser** by design (or ephemeral), browser storage can be appropriate.

| Storage | Survives reload | Cross-window | Cross-user | Auditable | Recommendation |
|---------|----------------|--------------|------------|-----------|----------------|
| `localStorage` | ✅ | ❌ (same origin only) | ❌ | ❌ | Avoid for anything meaningful |
| `sessionStorage` | ❌ | ❌ | ❌ | ❌ | Avoid |
| Port entity property | ✅ | ✅ | ✅ (with access control) | ✅ | **Preferred** |
| Port entity (new entity) | ✅ | ✅ | ✅ | ✅ | Use for structured records |

Same-origin `localStorage` can appear shared across tabs on one browser profile; it still does **not** replace Port when users need consistency across **devices**, **profiles**, or **cleared site data**.

### Use `localStorage` / `sessionStorage` only for:

- Ephemeral UI state (e.g. which panel is expanded in this browser tab)
- Dev-mode mocks
- Data that is **truly** per-device, **non-shareable by design**, and **documented** as acceptable to lose on clear-site-data or when using another browser

Do **not** choose browser storage only because it is simpler if **Port persistence is viable** with the same host token and API.

### Saving data to a Port entity property

Use `PATCH /v1/blueprints/{blueprint}/entities/{identifier}` to write properties:

```typescript
await fetch(
  `${baseUrl}/v1/blueprints/${blueprint}/entities/${entityIdentifier}`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: { myProperty: newValue },
    }),
  }
);
```

### Creating a new entity to persist a record

```typescript
await fetch(
  `${baseUrl}/v1/blueprints/${blueprint}/entities`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier: generateIdentifier(),
      title: recordTitle,
      properties: { body: text, createdAt: new Date().toISOString() },
      relations: { parent: parentEntityIdentifier },
    }),
  }
);
```

### Designing blueprints for widget-owned data

If the widget needs to store records (e.g. comments, bookmarks, reactions):

1. **Check if an existing blueprint can hold the data** — when it can, add properties there first. When it cannot (wrong lifecycle, wrong relations, or would pollute a shared type), add a dedicated blueprint or relation and document it; that is preferable to bending the wrong entity.
2. If a dedicated blueprint is needed, document its full schema (identifier, properties, relations) in a table in the widget README under **Prerequisites → Catalog**.
3. Expose the blueprint as a `"type": "blueprint"` param so admins wire it at configuration time — **do not hard-code the blueprint identifier** in widget logic.
4. Never use `localStorage` as a fallback for data that other users or windows should see.


## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Blank/dark screen locally | Script runs before DOM ready | Add `inject: "body"` to HtmlWebpackPlugin |
| Blank screen, no errors | Missing height on html/body | Add `height: 100%` to html, body, #plugin-root; `#plugin-root` + `.shell` flex — [production-readiness.md](production-readiness.md) §3 |
| Blank white iframe in Port (no UI at all) | Hooks after `if (!portToken) return` | Move all hooks before early returns; use `enabled` in `useQuery` — [production-readiness.md](production-readiness.md) §1 |
| Blank while “loading” | Only `isLoading`, not `isPending` | Use `query.isPending \|\| query.isLoading` — [production-readiness.md](production-readiness.md) §2 |
| Setup message never appears | Strict `params.x.value` / `entity.blueprint` only | Use `template-config.ts` + `template-resolveHostEntity.ts` |
| "Waiting for Port" message | Running outside iframe without mock | Enable `DEV_MOCK` in usePostMessageData.ts |
| API calls fail locally | Mock not returning data | Add small fixtures in `src/dev/mockData.ts` and `if (DEV_MOCK) return …` in `api/` modules |
| Widget works locally but not in Port | DEV_MOCK blocking real data | Ensure DEV_MOCK is false when `window.parent !== window` |
| 422 on entity search | `combinator`/`rules` at top level | Nest inside `{ query: { combinator, rules } }` |
| 422 with "additional properties" | Extra query params like `page` | Remove `page`/`page_size` from URL; use only the POST body |
| Widget ignores Port theme | `applyThemeCss()` not called or manual `postMessage` hook omits `theme` | Use `@port-labs/plugins-sdk` and call `applyThemeCss()` when `theme.css` updates; or inject `event.data.theme.css` yourself |
| Theme stuck after portal switch | Effect only runs once | Depend on SDK `applyThemeCss` (it changes when `theme.css` changes) or re-inject on each `PLUGIN_DATA` |
| Colours look wrong in dev | Port CSS vars not injected | CSS must provide local fallbacks: `var(--text-high, #111827)` |
| Links open wrong region/host | Hardcoded `app.port.io` or used `portApiBaseUrl` for UI links | Use `new URL(document.referrer).origin` with fallback `https://app.port.io`; keep API on `portApiBaseUrl` only |
| Upload rejected (`Function` / eval) | Bundle contains `new Function` or `Function("return this")` (webpack polyfill, lodash via recharts, etc.) | Apply optional fixes in [webpack-port-upload-safety.md](webpack-port-upload-safety.md) only when this happens — not in the default template |
| Dashboard filters ignored | Search uses raw `query` without `mergePageFilters`, missing blueprint third argument, or only `{ identifier }` passed | Merge `page.pageFilters` with SDK; pass **full** `params.blueprint.value` (includes `ownership` when present) — [plugin-architecture.md](plugin-architecture.md) |
