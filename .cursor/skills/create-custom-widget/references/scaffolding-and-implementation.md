## Scaffolding a New Widget from Templates

Use this approach when creating a completely new widget with no close existing match.

### 1. Create the directory

From the **root of the repository** where plugins are maintained, create a folder for the new widget:

```bash
# Run from that root — not inside an unrelated subfolder unless your layout requires it
mkdir <widget-name>   # lowercase + hyphens only, e.g. service-health-panel
```

### 2. Copy template files verbatim

Copy these from `.cursor/skills/create-custom-widget/assets/` — do not modify them:

| Source | Destination |
|--------|------------|
| `template-webpack.config.js` | `<widget>/webpack.config.js` — keep **`devServer.port: 9000`** (do not use per-widget ports) |
| `template-tsconfig.json` | `<widget>/tsconfig.json` |
| `template-index.html` | `<widget>/src/index.html` |
| `template-index.tsx` | `<widget>/src/index.tsx` |
| `template-usePostMessageData.ts` | `<widget>/src/hooks/usePostMessageData.ts` |

> **SDK:** The bundled template wraps **`usePortPluginData`** from **`@port-labs/plugins-sdk/react`** (see [plugins-sdk on npm](https://www.npmjs.com/package/@port-labs/plugins-sdk)). That hook exposes **`portToken`**, **`portApiBaseUrl`**, **`params`**, **`entity`**, **`page`**, **`user`**, **`theme`**, and **`applyThemeCss`**. The wrapper adds a **local dev mock** when the bundle runs outside Port’s iframe; keep **`applyThemeCss()`** on the real host path so light/dark stays in sync. Prefer **`@port-labs/plugins-sdk` ≥ 0.1.1** (link/navigation behavior and docs alignment per [Port Plugins](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins)).

### 3. Adapt these files

| Source | Destination | Changes needed |
|--------|------------|----------------|
| `template-package.json` | `<widget>/package.json` | Update `name` to `port-<widget-name>-plugin`, update `description` |
| `template-App.css` | `<widget>/src/App.css` | Customize styles |
| `template-App.tsx` | `<widget>/src/App.tsx` | Implement widget logic |
| `template-types.ts` | `<widget>/src/types.ts` | Add fields to `PluginConfig` matching your params |
| `template-upload-params.json` | `<widget>/upload-params.json` | Define widget parameters |

### Code organisation — split large widgets into files

**Do not put everything in `App.tsx`.** As a widget grows beyond ~150 lines, split it into focused modules. This keeps diffs reviewable and logic testable.

Suggested layout for a non-trivial widget:

```
src/
  App.tsx                  # Root: compose components, wire data
  types.ts                 # PluginConfig + domain types
  hooks/
    usePostMessageData.ts  # Host bridge (template)
    useComments.ts         # One hook per data concern
    useCurrentUser.ts
  components/
    CommentList.tsx        # Each visual section is its own file
    CommentForm.tsx
    EmptyState.tsx
  api/
    comments.ts            # Port API calls, isolated from UI
    entities.ts
  utils/
    portalUrl.ts         # getPortalOrigin() from document.referrer; default app.port.io
    formatters.ts          # Pure helpers — dates, strings, etc.
  App.css
```

**Rules of thumb:**

1. **One component per file.** If a component exceeds ~80 lines or has its own state/effects, extract it.
2. **API calls live in `api/`**, not in components or hooks. Components call hooks; hooks call `api/` functions.
3. **One data concern per hook.** A hook that fetches comments should not also fetch users — split into `useComments` + `useCurrentUser`.
4. **`types.ts` is the single source of truth** for `PluginConfig`, domain interfaces, and the `BlueprintParam` type. Import from there — do not re-declare shapes inline.
5. **Utilities are pure functions** with no side effects — safe to unit-test without React.
6. **`App.tsx` stays thin**: it reads `usePostMessageData`, passes data to child components, and handles the loading/error shell.

**When adapting an existing widget**, apply this split even if the original was monolithic — it pays off during code review and future changes.

### 4. Implement the widget

In `App.tsx`:

- Prefer **`usePortPluginData()`** from **`@port-labs/plugins-sdk/react`** for new code (same host data as the skill’s `usePostMessageData()` template wrapper, without the mock layer), **or** keep **`usePostMessageData()`** from the template for consistency with other widgets in the same project.

**Runtime data — use the Port API only.** For every live read or write (search entities, get entity by identifier, create/update entities, relations, scores, or any other Port-backed data), call the **Port REST API** with `Authorization: Bearer ${portToken}` and base URL `portApiBaseUrl` from the SDK. Centralize calls in `api/` modules; keep TanStack React Query in hooks with `enabled: !!portToken && !!portApiBaseUrl`. Do not use MCP from widget code, and do not bake in static catalog dumps from planning time as if they were live data.

- When search results must respect **dashboard page filters**, merge with **`mergePageFilters`** from **`@port-labs/plugins-sdk`** (see npm docs).
- Remove the entity guard block if the widget is for dashboards (not entity pages).

#### Responsive layout

Widgets render both as **large panels** (full column width) and as **small dashboard tiles**. Design the root layout to **use all available space** in the iframe — width **and** height — not a fixed-size card floating in empty chrome.

- Chain **`height: 100%`** / **`min-height: 100%`** on `html`, `body`, and `#plugin-root` (see [plugin-architecture.md](plugin-architecture.md) — Critical CSS); make the app shell **`display: flex; flex-direction: column; min-height: 0`** so main content can grow with **`flex: 1`**.
- Prefer **flex** / **CSS grid** with **`minmax(0, 1fr)`** (or equivalent) so children shrink instead of overflowing; avoid **`min-width`** on the root that forces horizontal scroll in narrow cells.
- Use **`width: 100%`**, **`box-sizing: border-box`**, and avoid **`max-width`** on the root that leaves unused margin in a full-width column unless the design intentionally caps content width inside a centered inner wrapper.
- Use **`overflow-x: auto`** only on intentional inner regions (for example wide tables), not on the whole page.
- Scale **typography and spacing** down slightly at small widths (`clamp()`, media queries, or container queries) so dense tiles stay readable.
- Match **height** expectations from [plugin-architecture.md](plugin-architecture.md) (root fills the iframe where Port expects it).

#### No duplicate title, description in the iframe

Port’s iframe wrapper already shows the plugin **title**, **description**, and **icon** configured at upload time. **Do not** repeat them inside `App.tsx` — no widget header block with the title, no hero “about this widget” copy, no decorative icon that mirrors Port’s plugin icon. Start at **functional** UI (toolbar, list, chart, form). Short **in-content** labels (“Filters”, “Open items”) and **entity** titles (current record name on an entity page) are still appropriate — those are not the plugin registration metadata.

#### Icons (no hardcoded emoji)

Do **not** use hardcoded **emoji** in the widget UI (e.g. `★`, `📌`, `✅` in button or list text). When an icon is needed for actions, tabs, or list rows, a **vetted icon library** (e.g. Lucide, react-icons) — keep bundle size reasonable and match Port theme tokens where possible.

```tsx
<button type="button" aria-label="Remove">
  <TrashIcon size={16} aria-hidden />
</button>
```

Use `aria-hidden="true"` on decorative icons; keep accessible names on the control (`aria-label` or visible text). Prefer theme-aware styling over one-off inline SVG unless the design needs a custom graphic.

#### UX and UI

Widgets are embedded product UI — not internal admin tools. **Prioritize UX** alongside correctness:

| Area | Guidance |
|------|----------|
| **Loading** | Show skeletons, spinners, or inline placeholders — never a blank iframe while `portToken` or fetches are in flight. |
| **Empty** | When search returns no rows or relations are missing, explain *why* and what to do (check catalog, place widget on entity page, add relation). |
| **Errors** | Human-readable message + optional retry; log full API body to console for devs — don’t dump raw JSON in the UI. |
| **Theme** | Call **`applyThemeCss()`** from the SDK; use Port CSS variables with local fallbacks so light/dark and regions look native. |
| **Decoration colors** | **`:root`** maps **surfaces, text, borders** only (`--bg`, `--card`, `--text`, `--border`, `--hover-bg`). **Decorations** (calendar dots, status pills, entity links, accent labels, chart marks) define **their own color on the class** — not a shared `--accent` / `--primary` from `:root`. |
| **Density** | Works in **full column** and **small dashboard tiles** — responsive typography and spacing (`clamp()`, media/container queries). |
| **Actions** | Primary actions obvious; destructive actions confirmed or visually distinct; links to Port entities use **`buildEntityPageUrl`** (portal origin, not API host). |
| **Accessibility** | Semantic HTML, visible focus, `aria-*` on interactive controls; in-widget icons via **`<i>`** or an icon library (never emoji); alt text for images in README assets only. |

Extract reusable shells: `LoadingState.tsx`, `EmptyState.tsx`, `ErrorBanner.tsx` under `components/` when the widget has more than one view.

#### Surface vs decoration colors

Port’s injected theme drives **backgrounds and typography**. Widget **decorations** should not reuse those semantic aliases for non-surface UI — otherwise a host `--primary` or dark-mode tweak can make dots, links, and badges clash with adjacent surfaces.

| Layer | Where | Use for |
|-------|--------|---------|
| **Surface** | `:root` in `App.css` | Page/card/hover **backgrounds**, primary/secondary **text**, **borders**, shadows — map `var(--background-primary, …)`, `var(--text-high, …)`, etc. |
| **Decoration** | On the **element’s class** | Dots, counts, pills, links, “today” highlights, chart series, icon tint — **fixed hex fallback** on a class-local custom property |

**Do not** add `--accent: var(--primary, …)` (or similar) in `:root` and use it for dots, link `color`, or small marks. **Do** give each decoration its own variable on the class (namespaced to the component):

```css
/* :root — surfaces only */
:root {
  --bg: var(--background-primary, #f0f2f5);
  --card: var(--background-dim, #ffffff);
  --text: var(--text-high, #111827);
  --border: var(--border-medium, rgba(0, 0, 0, 0.09));
}

/* Marked day cell — background is a surface; use a local fill token */
.day-cell--marked {
  --marked-cell-bg: color-mix(in srgb, #2563eb 14%, transparent);
  background: var(--marked-cell-bg);
}

/* Calendar dot — decoration; not --accent or --primary */
.day-dot {
  --day-dot-color: #2563eb;
  background: var(--day-dot-color);
}

.entity-link {
  --entity-link-color: #2563eb;
  color: var(--entity-link-color);
}
```

When several decorations share one hue, repeat the same fallback hex on each class (or scope a **component block** e.g. `.calendar { --event-blue: #2563eb; }` and reference `--event-blue` only inside that block — still **not** on `:root` as a global accent). See `assets/template-App.css` (`.example-dot`, `.example-link`) and `entity-calendar/src/App.css`.

#### Local dev mock data (outside Port’s iframe)

When `npm run dev` runs at `http://localhost:9000`, the bundle is usually **not** inside Port’s iframe (`window.parent === window`). The template’s **`DEV_MOCK`** path supplies host context without a live token. **Add small, widget-specific mocks** so the UI is usable before you toggle Port’s **Local development** mode.

| Layer | File | Mock what |
|-------|------|-----------|
| **Host bridge** | `src/hooks/usePostMessageData.ts` | `portToken`, `portApiBaseUrl`, `entity` (identifier, blueprint, title, optional `relations` / `relationsObjects`), `user`, `params` matching `PluginConfig` |
| **Port API** | `src/api/*.ts` or `src/dev/mockData.ts` | Early `if (DEV_MOCK) return …` with shapes that match real responses (`entities/search`, GET entity, etc.) |

**Rules:**

1. **Keep mocks small** — typically **2–5 entities** and **one happy path**; add a second fixture only when you need empty vs populated (e.g. `MOCK_COMMENTS_EMPTY` vs `MOCK_COMMENTS`).
2. **Mirror real API shapes** — same field names and nesting as Port returns so production code paths stay unchanged.
3. **Align with README defaults** — mock `entity.blueprint`, relation keys, and property keys should match **Prerequisites** / designed catalog constants, not random placeholders.
4. **Short-circuit in `api/`** — do not call `fetch` to Port when `DEV_MOCK` is true unless you intentionally test against a real token; import `DEV_MOCK` from `usePostMessageData.ts`.
5. **Optional delay** — `await new Promise((r) => setTimeout(r, 200))` in mock branches exercises loading UI.
6. **Never ship mock data in production** — `DEV_MOCK` must be `false` when `window.parent !== window` (template already gates on `development` + top-level window).

```typescript
// src/dev/mockData.ts — keep fixtures out of components
import type { CommentEntity } from "../types";

export const MOCK_COMMENTS: CommentEntity[] = [
  {
    identifier: "comment-1",
    title: "Looks good",
    blueprint: "comment",
    properties: { body: "Ship it.", createdAt: "2025-01-15T10:00:00Z" },
    relations: { parent: "demo-task" },
  },
];
```

```typescript
// src/api/comments.ts
import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_COMMENTS } from "../dev/mockData";

export async function searchComments(/* … */) {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return { entities: MOCK_COMMENTS, ok: true };
  }
  // real fetch…
}
```

Document in the per-plugin README **Local development**: which files to edit for host vs API mocks, and that full `postMessage` + token flow is validated via Port’s **Local development** toggle.

#### Safe rendering — no `innerHTML`

**Forbidden:** `element.innerHTML = …`, `outerHTML`, and **`dangerouslySetInnerHTML`** for entity properties, comments, markdown, or any user/integration-sourced string.

**Use instead:** React text (`{value}`), dedicated presentational components, or structured mapping (status → badge, date → formatted span). Rich HTML is exceptional — requires an explicit sanitizer dependency and README note; do not default to it.

```typescript
// ✅ Safe
<p className="comment-body">{comment.properties?.body ?? ""}</p>

// ❌ Never for dynamic data
<div dangerouslySetInnerHTML={{ __html: comment.properties?.body as string }} />
```

#### Portal app links (`document.referrer`)

Widgets often link users to **entity pages**, **dashboard pages**, or **self-service actions** inside Port. Those URLs live on the **portal app** (e.g. `https://app.port.io`, `https://app.us.port.io`, or a customer vanity host) — **not** on `portApiBaseUrl` (`https://api.getport.io`, etc.).

**Rules:**

| Use | For |
|-----|-----|
| **`portApiBaseUrl`** + bearer token | REST API calls (`fetch` to `/v1/...`) |
| **`document.referrer`** → portal **origin** | `<a href>`, `window.open`, “Open in Port” links |
| **`https://app.port.io`** (default origin) | When `document.referrer` is empty — typical in **local dev** outside the Port iframe |

**Do not** add a `portalAppUrl` (or similar) plugin param for the common case — the referrer already reflects the org’s region and hostname. Reserve an optional override param only when you must support environments where referrer is unreliable.

Put helpers in **`src/utils/portalUrl.ts`** (or equivalent):

```ts
const DEFAULT_PORTAL_ORIGIN = "https://app.port.io";

/** Portal app origin for in-app links — not the API host. */
export function getPortalOrigin(): string {
  try {
    const ref = document.referrer?.trim();
    if (ref) return new URL(ref).origin;
  } catch {
    /* invalid referrer */
  }
  return DEFAULT_PORTAL_ORIGIN;
}

/** Entity page — Port portal route: {blueprint}Entity?identifier={entityId} */
export function buildEntityPageUrl(
  blueprintIdentifier: string,
  entityIdentifier: string
): string {
  const origin = getPortalOrigin();
  const path = `${encodeURIComponent(blueprintIdentifier)}Entity`;
  const qs = new URLSearchParams({ identifier: entityIdentifier });
  return `${origin}/${path}?${qs.toString()}`;
}
```

**Canonical entity-page shape:** `{portalOrigin}/{blueprintIdentifier}Entity?identifier={entityIdentifier}` — for example `https://app.port.io/serviceEntity?identifier=my-service`.

- Parse **`document.referrer`** with `new URL(document.referrer).origin` so EU/US and custom domains follow the user’s session automatically.
- **Encode** the blueprint identifier in the path segment (`{blueprint}Entity`) and the entity identifier in the **`identifier`** query param (`URLSearchParams` handles encoding).
- In **dev mock**, links may point at `https://app.port.io` until you test inside Port’s iframe (where referrer is set).
- If the SDK exposes link helpers (see [plugins-sdk on npm](https://www.npmjs.com/package/@port-labs/plugins-sdk)), prefer them when they align with this behaviour; otherwise use the pattern above.

#### Searching blueprint entities (correct endpoint)

Use `POST /v1/blueprints/{blueprint}/entities/search` — **not** the generic search endpoint. The body must nest filter rules inside a `query` key:

```ts
const res = await fetch(
  `${baseUrl}/v1/blueprints/${encodeURIComponent(blueprint)}/entities/search`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: { combinator: "and", rules: [] },
    }),
  }
);
```

> **Avoid:** placing `combinator`/`rules` at the top level (causes 422), passing `page`/`page_size` query params, or using the generic `/v1/entities/search` route.

#### Error handling

Always surface the full response body on errors — Port returns structured `{ ok, error, message }` JSON that pinpoints the exact issue:

```ts
if (!response.ok) {
  const body = await response.text();
  throw new Error(`Port API ${response.status}:\n${body}`);
}
```

### 5. Define parameters (`upload-params.json`)

Complete **[reuse-workflow.md](reuse-workflow.md) Steps 4–6** (blueprint strategy, **relation strategy**, README catalog tables) **before** editing this file.

#### Catalog over plugin params

| Belongs in the catalog / runtime API (fetch — do **not** parametrize) | Belongs in `upload-params.json` (sparingly) |
|------------------------------------------------------------------------|---------------------------------------------|
| List of org blueprints | — use **`GET /v1/blueprints`** |
| Blueprint **properties**, **relations**, types, labels | — use **`GET /v1/blueprints/{identifier}`** |
| Blueprint-to-blueprint **relation** identifiers and targets | — **not** relation-key `string` params |
| Current **entity** on entity pages | **`PLUGIN_DATA.entity`** — not entity ID / subject blueprint params |
| **Related entities** | **`entity.relations` / `relationsObjects`**, then **`relatedTo`** search |
| Entity rows for a known blueprint | **`POST .../entities/search`** — not entity list params |
| Property keys when a conventional default exists | Optional **`string`** override per distinct role when orgs rename fields |
| Which blueprint the widget **operates on** when host cannot say | **`type: "blueprint"`** only when admin must **pick scope** (e.g. child blueprint on dashboard) |

**Goal:** the smallest set of params that still scopes the widget for your org. **Never** add params whose only job is exposing data you can load with the bearer token at runtime (blueprint catalogs, relation graphs, entity inventories). **Params** narrow behaviour the catalog and host context cannot supply — **not** a hand-typed mirror of Port’s data model.

**Do not** add a portal base URL param when **`document.referrer`** + **`https://app.port.io`** fallback suffice (see **Portal app links**).

Each key is a param name; each value describes how it appears in the Port UI. Allowed **`type`** values (see [port-plugins-cli — Plugin metadata reference](https://www.npmjs.com/package/@port-labs/port-plugins-cli)): **`string`**, **`number`**, **`boolean`**, **`object`**, **`array`**, **`blueprint`**.

#### Required fields per parameter

Every parameter object **must** include all three fields:

| Field | Purpose |
|-------|---------|
| **`type`** | Control type in Port’s widget configuration UI |
| **`isRequired`** | `true` if the admin must set it before the widget works; `false` for optional overrides |
| **`label`** | Short label shown in Port (not a description — detail goes in README) |

```json
{
  "exampleParam": {
    "type": "string",
    "isRequired": true,
    "label": "Example parameter"
  }
}
```

Do not omit **`isRequired`** (Port/CLI expect it). Do not add extra keys unless the CLI documents them.

#### Param labels (Port UI)

The **`label`** in `upload-params.json` is what operators see when configuring the widget in Port. Keep it **short, simple, and meaningful** — name *what* they are choosing, not how the widget works.

| Put in `label` | Put in README instead |
|----------------|------------------------|
| `Comment blueprint` | Which blueprint to create, required properties, relations |
| `Due date property` | Default `dueDate`, when to override, validation against schema |
| `Override relation` | Last-resort only; designed relation `parent` in Prerequisites |

**Avoid** long labels, defaults in parentheses, or setup instructions in `label` (Port has no separate param description field). Mirror every param in the README **Widget parameters** table with **default**, **description**, and examples.

```json
{
  "dueDateProperty": {
    "type": "string",
    "isRequired": false,
    "label": "Due date property"
  }
}
```

#### Widget scoped to one subject blueprint

When the widget is designed for a single blueprint type (e.g. `task` entity calendar):

1. Document that blueprint in README **Prerequisites**.
2. On **entity pages**, read **`pluginData.entity.blueprint`** and **`pluginData.entity.identifier`** — no subject `type: "blueprint"` param.
3. Add **`type: "blueprint"`** only if the same artifact must run on a **dashboard** without host entity context (admin picks which blueprint to list).

```typescript
const subjectBlueprint =
  pluginData.entity?.blueprint ?? config.subjectBlueprint?.identifier;
if (!subjectBlueprint) {
  return <p>Place this widget on an entity page or configure the subject blueprint.</p>;
}
```

#### Relation string params — do not use by default

**Forbidden as default design:** `string` params whose sole purpose is letting operators type a **relation identifier** (`parentRelation`, `taskRelation`, `serviceRelation`, …).

**Instead:**

1. During catalog design, pick or add the relation in Port; document it in README **Relations**.
2. At runtime, resolve via **`PLUGIN_DATA.entity`**, **`relatedTo`** search, or blueprint GET — using the **designed** relation identifier as a code constant (aligned with README).
3. Only if multiple deployments use incompatible relation names **and** context + search + GET cannot disambiguate, add an optional override param with a short label and document last-resort use in README; code default matches the README relation.

```typescript
// Designed with the catalog — from README / blueprint schema, not upload-params.json
const PARENT_RELATION = "parent";

const parentEntity = pluginData.entity?.relationsObjects?.[PARENT_RELATION];
```

#### Prefer native **`blueprint`** params when selecting a blueprint

When the admin should **pick a blueprint** (not type a free-form ID), use **`"type": "blueprint"`**. Port renders the native blueprint control.

> **Runtime shape:** A `blueprint` param is **not** a plain string. Port delivers it as a **blueprint object**:
> ```typescript
> { identifier: string; title: string; /* …other blueprint fields */ }
> ```
> Always read `.identifier` (and optionally `.title`) instead of treating the value as a raw string.

**Type it correctly in `PluginConfig`:**
```typescript
export type BlueprintParam = { identifier: string; title: string };

export type PluginConfig = {
  discussionBlueprint: BlueprintParam; // NOT string — omit when host entity + design default suffice
  bodyProperty?: string;     // optional override — prefer inferring from blueprint schema + README default
  dueDateProperty?: string;  // optional override when widget reads a datetime field
  // Do NOT add parentRelation / taskRelation / *Relation string fields unless documented last-resort override
};
```

**Usage in API calls — always extract `.identifier`:**
```typescript
const res = await fetch(
  `${baseUrl}/v1/blueprints/${encodeURIComponent(config.discussionBlueprint.identifier)}/entities/search`,
  { ... }
);
```

**Limits (CLI / platform):** at most **five** params may use `"type": "blueprint"` per plugin — see the [CLI metadata table](https://www.npmjs.com/package/@port-labs/port-plugins-cli).

```json
{
  "discussionBlueprint": {
    "type": "blueprint",
    "isRequired": true,
    "label": "Comment blueprint"
  }
}
```

Use **`string`** (and other scalar types) for **property keys**, enums, labels, and anything that is **not** “choose a blueprint from the catalog.” **Portal base URLs** come from **`document.referrer`** (default **`https://app.port.io`**), not from a string param — see **Portal app links**.

#### Datetime / date blueprint properties

When the widget **reads, filters, sorts, or displays** a blueprint **`datetime`** (or date-like) property, add an **optional `string` param** so operators can point at a different field name in their catalog. **Do not** require it when a single conventional default exists.

| Concern | Guidance |
|---------|----------|
| **Param name** | Semantic and widget-specific — e.g. `dueDateProperty`, `createdAtProperty`, `resolvedAtProperty` |
| **Default** | Hard-code the property the widget was built for (e.g. `createdAt`) when the param is empty; document in README **Widget parameters** |
| **Label** | Short role name — e.g. `Due date property` (not `Datetime property for due date (default: dueDate)`) |
| **Validation** | Optionally confirm the key exists on the configured blueprint via **`GET /v1/blueprints/{identifier}`** and that its type is `datetime` |

```json
{
  "dueDateProperty": {
    "type": "string",
    "isRequired": false,
    "label": "Due date property"
  }
}
```

```typescript
const dueDateKey = config.dueDateProperty?.trim() || "dueDate";
const raw = entity.properties?.[dueDateKey];
```

Same pattern applies for **deadlines**, **SLA timestamps**, **iteration end dates**, and any other date-driven behaviour — one optional param per distinct date role in the widget, each with its own documented default.

### Blueprint Parameter Design for Reusability

Design `upload-params.json` to be **composable inside your organization**:

**Good: blueprint picker + optional overrides only when needed**
```json
{
  "discussionBlueprint": {
    "type": "blueprint",
    "isRequired": true,
    "label": "Comment blueprint"
  },
  "bodyProperty": {
    "type": "string",
    "isRequired": false,
    "label": "Message property"
  }
}
```
✅ Native blueprint selection in Port  
✅ Parent / peer links: prefer **`PLUGIN_DATA.entity`**, then **`relatedTo`** (or equivalent) on **`entities/search`**, then catalog inference — optional **`string`** overrides only when those are insufficient  
✅ Optional property keys — prefer inferring from **`GET /v1/blueprints/{identifier}`** and host **`entity`** so operators leave them blank when defaults apply  
✅ **Datetime fields** the widget depends on — optional **`string`** param per date role with a **code default** (see **Datetime / date blueprint properties**)

**Avoid:** encoding “which blueprint” only as an unstructured string when a **`blueprint`** param is clearer for admins — unless you have a deliberate reason (e.g. dynamic lists beyond the blueprint picker).

**Bad: vague catch-all**
```json
{
  "blueprintId": {
    "type": "string",
    "isRequired": true,
    "label": "Blueprint"
  }
}
```
❌ Unclear semantic role  
❌ Misses the native **`blueprint`** UX when the intent is catalog selection

**Design principles:**
1. **Name parameters by semantic role** (e.g. `discussionBlueprint`, not `blueprint1`).
2. **Use `type: "blueprint"`** for blueprint selection only when the admin must pick a blueprint the widget cannot infer (subject to the five-param cap). **Never** use **`string`** for **relation** identifiers — use catalog relations + README constants + runtime resolution (see **Relation string params — do not use by default**).
3. **Property `string` overrides as a last resort** — try schema-driven defaults and README-documented property keys first. **Exception:** widgets that use a blueprint **datetime** property should expose an optional **`string`** override for that field (with a widget-specific default) — see **Datetime / date blueprint properties**.
4. **Document compatibility** with sibling widgets in the README or PR when it helps operators — not in long param labels.
5. **Separate concerns** — one param per concept, not one opaque blob.


### Prefer discovering relations from the entity or Port API

**Default order (highest priority first):** resolve relations from **catalog + host context + search** before any **plugin string param** for a relation key.

#### Check blueprint schemas before adding a new relation

When the widget needs data from blueprint **B** while running on blueprint **A**, **inspect both schemas** (MCP `list_blueprints` with `identifiers`, or `GET /v1/blueprints/{identifier}` at runtime) **before** proposing a new relation:

| Check | Why |
|-------|-----|
| **Existing relation on A → B** | Reuse the identifier; document in README **Relations**. |
| **Reverse or indirect relation** | Another path may already link the entities (e.g. B → A, or via a hub blueprint). |
| **Property on A or B** | If the field lives on the subject or target blueprint, a relation may be unnecessary. |
| **Target blueprint properties** | Confirm B has the properties the widget will read or write (title, datetime, status, …) before modeling a link. |
| **Relation target type** | New relation `many`/`one` and target blueprint must match how the widget queries (`relatedTo`, `relationsObjects`). |

Only **add** a catalog relation when traversal is required and the inspected schemas cannot satisfy the use case with existing links or properties. Say so explicitly in README **Prerequisites → Relations** (“add `parent` on `comment` → `task` because …”).

1. **Catalog (design-time)** — reuse or add blueprint relations; document identifiers in README. Widget code uses those identifiers as constants aligned with the catalog.
2. **`PLUGIN_DATA.entity`** — use `entity.relations` / `entity.relationsObjects` when the widget runs on an entity page and the link is already materialized on the host payload.
3. **`POST /v1/blueprints/{blueprint}/entities/search`** — use rules such as **`relatedTo`** (and other supported relation filters) so Port resolves “related to this entity” **without** the admin naming a relation identifier, when the query model supports your case.
4. **`GET /v1/blueprints/{identifier}`** — inspect relation definitions to pick the right key, enumerate candidates, or match by target blueprint — still **no operator-facing param** if logic can choose unambiguously.
5. **Optional `string` plugin param** — **last resort** when steps 1–4 cannot disambiguate across deployments; use a strong code default matching the README relation and a short label (e.g. **`Relation override`**); explain last-resort use in README.

**Avoid asking admins to type relation keys as string params when the catalog and steps 2–3 already express the graph.** Prefer fixing the catalog (new relation) over a param.

#### When you have the host `entity` object

The Port host sends the current entity via `PLUGIN_DATA.entity`. Its `relations` map already contains the resolved related entity identifiers. Traverse them directly instead of requiring an admin to fill in the relation name:

```typescript
// entity.relations is Record<relationKey, string | null>
// entity.relationsObjects is Record<relationKey, Entity | null>

// ✅ Use the relation identifier from catalog design (README), not from upload-params.json
const PARENT_RELATION = "parent"; // matches Prerequisites → Relations table
const parentId = pluginData.entity?.relations?.[PARENT_RELATION];
const parentEntity = pluginData.entity?.relationsObjects?.[PARENT_RELATION];

// ✅ Or enumerate all relations if you need to discover an ambiguous link
const relatedIds = Object.values(pluginData.entity?.relations ?? {}).filter(Boolean);
```

When the widget is placed on a **known blueprint page** (e.g. always on a Task entity), read relations by the **designed** key — no param:

```typescript
// If the widget always lives on a "task" entity, read the assignee relation
// from the entity without asking the admin to name it
const assigneeId = pluginData.entity?.relations?.assignee;
```

#### When you need to find related entities via Port API

Use `POST /v1/blueprints/{blueprint}/entities/search` with a relation filter rule **before** requiring a relation-key param — this finds related rows by **current entity identity**, not by typing a relation field name in `upload-params.json`:

```typescript
// ✅ Find all comments linked to the current entity via search (preferred over a "parent relation" param when this suffices)
const body = {
  query: {
    combinator: "and",
    rules: [
      {
        operator: "relatedTo",
        blueprint: currentEntity.blueprint,
        value: currentEntity.identifier,
      },
    ],
  },
};
const res = await fetch(
  `${baseUrl}/v1/blueprints/${encodeURIComponent(config.commentBlueprint.identifier)}/entities/search`,
  {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }
);
```

#### Decision guide for relation params

Use this table **after** trying **entity context** (row 1) and **`entities/search`** (row 2). Treat a **`string` relation param** as the **fallback** column, not the default design.

| Situation | Preferred approach | Relation **string** param |
|-----------|-------------------|---------------------------|
| Widget is on an entity page — entity is in `PLUGIN_DATA` | Read `entity.relations` / `entity.relationsObjects` | Only if host payload omits the link you need |
| Need “all rows related to this entity” (e.g. comments on this bug) | **`POST .../entities/search`** with **`relatedTo`** (or supported relation rules) scoped to the comment (or child) blueprint | Only if the query API cannot express the join for your catalog |
| Relation key varies per deployment | Derive candidates from **`GET /v1/blueprints/{identifier}`** + `PLUGIN_DATA`, then pick in code | Optional override with default |
| Relation key is predictable / always the same | Hard-code the key in widget logic; don't expose as a param | N/A |
| Relation target blueprint is unknown | Enumerate `entity.relations` values and fetch each entity | Rarely needed |

### 6. Document blueprint reuse

If your widget reuses blueprints from other widgets, document this in your widget's README or in a comment at the top of `types.ts`:

```typescript
// types.ts
/**
 * Param lineage (update names to match sibling widgets in your project):
 * - discussionBlueprint: align with existing discussion-style widgets if any
 * - workItemBlueprint: align with existing planning widgets if any
 *
 * New concepts introduced by this widget:
 * - milestoneBlueprint — example only; use type: "blueprint" in upload-params.json
 */
export type BlueprintParam = { identifier: string; title: string };

export type PluginConfig = {
  discussionBlueprint: BlueprintParam;
  workItemBlueprint: BlueprintParam;
  milestoneBlueprint: BlueprintParam;
};
```

### 7. Update the README

Add a row to the repo-level **Plugins** widgets table in the project root `README.md`. Read **`version`** from the plugin’s `package.json` (same semver you ship with the build) and keep the table in sync when you bump that field.

```markdown
| [Widget Title](./widget-name) | 1.0.0 | One-sentence description |
```

If the widget reuses or extends existing blueprints, mention this in the description:

```markdown
| [Project Dashboard](./project-dashboard) | 0.2.1 | Example: combines work-tracking and discussion plugins already in the same project, plus any new blueprint-backed features |
```

When auditing or releasing, update the **Version** cell if `package.json` `version` changed and the description still matches.

### 8. Per-plugin `README.md`

Write the per-plugin README per **[readme-and-audit.md](readme-and-audit.md)** (required section order, preview image, params table before setup, canonical upload command, troubleshooting).

