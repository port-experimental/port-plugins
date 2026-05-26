# Port Plugin Architecture

## Overview

Port plugins (custom widgets) run inside an `<iframe>` in Port dashboards and entity pages. They are self-contained HTML files — React/TypeScript compiled by webpack into a single `dist/index.html` with all JS and CSS inlined. Port hosts the file; no external infrastructure is required.

## postMessage Protocol

Widgets communicate with the Port host exclusively via `window.postMessage`. All messages use a `type` field.

### Plugin → Host

| Event type | When | Payload |
|---|---|---|
| `REQUEST_PORT_TOKEN` | On mount (when in iframe) | `{ type: 'REQUEST_PORT_TOKEN' }` |

Always send this when `window.parent !== window`. Post it on mount (not in an event handler) so it is received correctly even with React Strict Mode's double-mount.

### Host → Plugin

| Event type | Payload |
|---|---|
| `PORT_TOKEN` | `{ type: 'PORT_TOKEN', token: string }` |
| `PLUGIN_DATA` | `{ type: 'PLUGIN_DATA', params?, page?, user?, entity?, baseUrl?, theme? }` |

## PLUGIN_DATA Payload

```ts
{
  type: 'PLUGIN_DATA';

  // Widget instance configuration — keys match upload-params.json
  params?: Record<string, { type: string; value: unknown }>;

  // Current page context
  page?: { identifier?: string; pageFilters?: unknown };

  // Authenticated user
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
    picture?: string;
  };

  // Entity in context (only on entity pages)
  entity?: {
    identifier: string;
    title?: string;
    blueprint?: string;
    properties?: Record<string, unknown>;
    relations?: Record<string, unknown>;
  };

  // Port API base URL — always use this, never hardcode
  baseUrl?: string; // e.g. "https://api.getport.io"

  // Active portal theme — sent by the Port host so the iframe matches light/dark and tokens
  theme?: {
    mode: string; // e.g. "light" | "dark"
    css: string; // full CSS text (typically defines design tokens on :root)
  };
}
```

## Token Flow

1. On mount, plugin sends `REQUEST_PORT_TOKEN` to `window.parent`
2. Host replies with `PORT_TOKEN` event containing a short-lived JWT
3. Plugin stores the JWT and uses it as `Authorization: Bearer <token>` on all API calls
4. API base URL comes from `PLUGIN_DATA.baseUrl` — always use this, never hardcode

## Portal app links (not the API host)

User-facing links (entity pages, dashboards, actions) must target the **portal app**, not
`PLUGIN_DATA.baseUrl` / `portApiBaseUrl`.

| Concern | Source |
|---------|--------|
| REST API | `portApiBaseUrl` + bearer token (e.g. `https://api.getport.io`) |
| In-app navigation (`<a href>`, `window.open`) | **`document.referrer`** → `new URL(document.referrer).origin` |
| Local dev / empty referrer | Default origin **`https://app.port.io`** |

The iframe’s referrer is the parent Port page, so links stay on the same region and hostname
(EU, US, or custom) without a `portalAppUrl` param. See **Portal app links
(`document.referrer`)** in [SKILL.md](../SKILL.md).

## Calling Port APIs

### Search a blueprint's entities (recommended)

Use **`POST /v1/blueprints/{blueprint}/entities/search`** — the body must wrap
filter fields inside a top-level `query` key:

```ts
const res = await fetch(
  `${baseUrl}/v1/blueprints/${encodeURIComponent(blueprint)}/entities/search`,
  {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: {
        combinator: 'and',
        rules: [
          // empty rules → return all entities for the blueprint
          // { property: 'status', operator: '=', value: 'Active' },
        ],
      },
    }),
  }
);
```

> **Common 422 pitfalls:**
> - Placing `combinator`/`rules` at the top level instead of inside `query`.
> - Adding unsupported query-string params like `page` or `page_size`.
> - Using the generic `/v1/entities/search` endpoint instead of the
>   blueprint-scoped version above.

### GET all entities (simpler, no filtering)

```ts
const res = await fetch(
  `${baseUrl}/v1/blueprints/${encodeURIComponent(blueprint)}/entities`,
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### With TanStack Query (recommended pattern)

```ts
const { data } = useQuery({
  queryKey: ['entities', blueprint, portToken],
  queryFn: async () => {
    const res = await fetch(
      `${portApiBaseUrl}/v1/blueprints/${encodeURIComponent(blueprint)}/entities/search`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${portToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: { combinator: 'and', rules: [] } }),
      }
    );
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Port API ${res.status}: ${body}`);
    }
    return res.json();
  },
  enabled: !!portToken && !!portApiBaseUrl,
  staleTime: 5 * 60 * 1000,
});
```

### Error handling best practice

Always read the response body on non-OK responses — Port returns a JSON object
with `ok`, `error`, and `message` fields that pinpoint the issue:

```ts
if (!response.ok) {
  const errorBody = await response.text();
  throw new Error(`Port API ${response.status}:\n${errorBody}`);
}
```

## upload-params.json Parameter Types

| Type | Description |
|---|---|
| `string` | Text input |
| `number` | Numeric input |
| `boolean` | Toggle |
| `object` | JSON object |
| `array` | JSON array |
| `blueprint` | Blueprint identifier picker |

Schema per parameter — **all three fields are required** on every param:

| Field | Required | Purpose |
|-------|----------|---------|
| `type` | yes | `string`, `number`, `boolean`, `object`, `array`, or `blueprint` |
| `isRequired` | yes | `true` or `false` |
| `label` | yes | Short label in Port’s widget configuration UI |

```json
{
  "paramKey": {
    "type": "string",
    "isRequired": true,
    "label": "Short label in Port UI"
  }
}
```

**Labels vs README:** `label` is shown in Port’s widget configuration UI only — keep it short and meaningful. Defaults, examples, and setup detail belong in the per-plugin README **Widget parameters** and **Prerequisites** tables (see [scaffolding-and-implementation.md](scaffolding-and-implementation.md) (**Param labels**)).

Reading a parameter value in TypeScript:

```ts
const value = params["paramKey"]?.value as string ?? "defaultValue";
```

## Rendering and UX

- **No unsafe HTML** — do not use `innerHTML`, `outerHTML`, or `dangerouslySetInnerHTML` for entity properties, comments, or other dynamic strings. Render with React text and components; use a vetted sanitizer only when rich HTML is an explicit, documented requirement.
- **Params vs runtime** — do not add `upload-params.json` entries for blueprint lists, relation keys, entity inventories, or full property schemas; load them with `GET /v1/blueprints`, `GET /v1/blueprints/{identifier}`, `PLUGIN_DATA.entity`, and `POST .../entities/search`. Params only scope what the host and API cannot infer.
- **Product-quality UI** — loading, empty, and error states; `applyThemeCss()`; full-iframe responsive layout. See **UX and UI** in [scaffolding-and-implementation.md](scaffolding-and-implementation.md).
- **No duplicate Port chrome** — do not render the plugin’s Port **title**, **description**, or **icon** inside the iframe; Port’s wrapper already shows them.
- **Icons** — no hardcoded emoji; use **`<i>`** with icon classes or a vetted icon library when the UI needs icons (see [scaffolding-and-implementation.md](scaffolding-and-implementation.md) (**Icons (no hardcoded emoji)**)).

## Theming — Inheriting Port's Visual Style

Widgets should match Port's current theme (light/dark, catalog colours) without
hard-coding colours. The host passes theme data on **`PLUGIN_DATA`**; the
**`@port-labs/plugins-sdk`** applies it for you.

### What the host sends

When the user switches light/dark or the portal theme updates, Port sends (or
re-sends) `PLUGIN_DATA` with:

- **`theme.mode`** — string such as `"light"` or `"dark"` (useful for
  `color-scheme` on `document.documentElement` if you want native controls to
  match).
- **`theme.css`** — a string of CSS. The SDK injects this into the document as a
  `<style id="port-plugin-theme">` element. In practice it usually defines Port
  design tokens (custom properties) on `:root`, e.g. `--background-primary`,
  `--text-high`.

If `theme` is missing or invalid, the SDK removes that style element.

### What your widget should do

1. **Use the SDK** — `usePortPluginData()` exposes **`applyThemeCss()`**. Call it
   whenever the host theme may change: the SDK wires `applyThemeCss` to the
   latest `theme.css` (e.g. depend on `applyThemeCss` from the hook in
   `useEffect`, which updates when `theme.css` changes).
2. **Map tokens in your CSS** — reference Port variables with **local
   fallbacks** so the widget still looks acceptable in local dev (no host, no
   injection):

```css
:root {
  --bg:     var(--background-primary, #f0f2f5);
  --card:   var(--background-dim, #ffffff);
  --border: var(--border-medium, rgba(0, 0, 0, 0.09));
  --text:   var(--text-high, #111827);
  --muted:  var(--text-medium, #6b7280);
}

body {
  background: var(--bg);
  color: var(--text);
}
```

3. **Separate decorations from surfaces** — `:root` aliases are for **backgrounds, body text, and borders**. UI **decorations** (dots, badges, accent labels, entity links, chart marks) should define **class-local** color variables with a hex fallback (e.g. `--day-dot-color: #2563eb`), not a global `--accent` tied to `var(--primary)`. Marked/highlighted **cell backgrounds** may use `color-mix` on a local token on that class. Full pattern: [scaffolding-and-implementation.md — Surface vs decoration colors](scaffolding-and-implementation.md#surface-vs-decoration-colors).

4. **Avoid fighting the host** — Prefer Port tokens over `prefers-color-scheme`
   blocks that hard-code a second palette; when embedded, the **host-injected theme** should
   drive light/dark.

### Widgets without the SDK

If you handle `postMessage` yourself, you must still read **`event.data.theme`**
from `PLUGIN_DATA` and inject **`theme.css`** (or adopt `@port-labs/plugins-sdk`
and call **`applyThemeCss()`**). Otherwise the iframe will not track the portal
theme.

### Common design tokens in `theme.css`

These names are commonly mapped in plugin CSS; the exact set is defined by
the host CSS string:

| Variable | Purpose |
|---|---|
| `--background-primary` | Page / widget background |
| `--background-dim` | Card / surface background |
| `--background-dim-transparent` | Subtle hover / badge background |
| `--text-high` | Primary text |
| `--text-medium` | Secondary / muted text |
| `--border-medium` | Standard borders |
| `--border-contrast-medium` | Hover / active borders |

Always provide a local fallback in `var(...)` so the widget looks correct when
running outside Port's iframe (local webpack dev).

## Drag-and-Drop (Reorder + Cross-Container)

The pattern below uses **native HTML5 drag events** (no specific library required). It supports reordering within a container and moving items between containers, with a visual insert indicator for the drop position. Adapt types and persistence to your plugin’s data model.

### State

```ts
type DragState = { itemId: string; sourceContainer: string };

const dragRef = useRef<DragState | null>(null);           // synchronous source — always readable in event handlers
const [dragOverContainer, setDragOverContainer] = useState<string | null>(null);
const [dragInsert, setDragInsert] = useState<{ containerId: string; insertAt: number } | null>(null);
```

### Handlers

```ts
// Item onDragStart
onDragStart={(e) => {
  e.stopPropagation();
  e.dataTransfer.effectAllowed = "move";
  dragRef.current = { itemId, sourceContainer };
}}

// Item onDragOver — determines top/bottom half → precise insertAt
onDragOver={(e) => {
  e.preventDefault();
  e.stopPropagation(); // prevent container handler from clearing dragInsert
  const rect = e.currentTarget.getBoundingClientRect();
  const insertAt = e.clientY < rect.top + rect.height / 2 ? index : index + 1;
  setDragInsert({ containerId, insertAt });
  setDragOverContainer(containerId);
}}

// Container onDragOver (fires only over empty space because items stop propagation)
onDragOver={(e) => {
  e.preventDefault();
  setDragOverContainer(containerId);
  setDragInsert(null); // signals "append to end"
}}

// Container onDragLeave
onDragLeave={(e) => {
  const rel = e.relatedTarget as Node | null;
  if (rel && (e.currentTarget as HTMLElement).contains(rel)) return; // moved to child
  setDragOverContainer(prev => prev === containerId ? null : prev);
  setDragInsert(prev => prev?.containerId === containerId ? null : prev);
}}
```

### Drop handler

```ts
const handleDrop = (targetContainer: string) => {
  const drag = dragRef.current;
  if (!drag) return;
  const insertAt = dragInsert?.containerId === targetContainer ? dragInsert.insertAt : null;

  if (drag.sourceContainer === targetContainer) {
    // Same-container reorder
    const items = getContainerItems(targetContainer);
    const srcIdx = items.indexOf(drag.itemId);
    const dest = insertAt ?? items.length;
    if (dest === srcIdx || dest === srcIdx + 1) return; // no-op
    const arr = [...items];
    arr.splice(srcIdx, 1);
    arr.splice(dest > srcIdx ? dest - 1 : dest, 0, drag.itemId);
    // save arr
  } else {
    // Cross-container move: remove from source, splice into target at insertAt
    const targetItems = [...getContainerItems(targetContainer)];
    targetItems.splice(insertAt ?? targetItems.length, 0, drag.itemId);
    // save
  }
  dragRef.current = null;
  setDragOverContainer(null);
  setDragInsert(null);
};
```

### Insert indicator line

Render a 2 px blue hairline before the item at `dragInsert.insertAt`, and after the last item when `dragInsert.insertAt === items.length` (or when hovering over empty container space with `dragInsert === null`):

```tsx
{items.map((id, index) => (
  <Item
    key={id}
    showInsertBefore={dragInsert?.containerId === cid && dragInsert.insertAt === index}
    onDragOver={(e) => handleDragOverItem(cid, index, e)}
  />
))}
{dragInsert?.containerId === cid && dragInsert.insertAt === items.length && (
  <div className="insert-indicator" />
)}
```

```css
.insert-indicator {
  height: 2px;
  border-radius: 1px;
  background: var(--primary, #2563eb);
  margin: 1px 6px;
  pointer-events: none;
}
```

### Optimistic local state

For interactive widgets that write back to Port, keep a `localState` and drive it optimistically:

```ts
const [localData, setLocalData] = useState<Data | null>(null);
const initialized = useRef(false);

// Seed from server once on first load
useEffect(() => {
  if (!initialized.current && serverData) {
    setLocalData(serverData);
    initialized.current = true;
  }
}, [serverData]);

const apply = (next: Data) => {
  setLocalData(next); // immediate UI update
  saveMutation.mutate(next); // background API call
};
```

## Build Requirements

- Output **must be a single self-contained `dist/index.html`** — all JS and CSS inlined
- Use `InlineChunkHtmlPlugin` from `react-dev-utils` in the webpack config (see `.cursor/skills/create-port-plugin/assets/template-webpack.config.js`)
- No external CDN/asset requests from the built file — Port hosts it

### Critical Webpack Configuration

HtmlWebpackPlugin **must** include `inject: "body"` to ensure scripts load after the DOM:

```javascript
new HtmlWebpackPlugin({
  template: "./src/index.html",
  filename: "index.html",
  chunks: ["ui"],
  cache: false,
  inject: "body",  // REQUIRED
}),
```

Without this, the inlined script executes before `#plugin-root` exists, causing a blank screen.

### Critical CSS Configuration

Root elements must have explicit heights to prevent layout collapse:

```css
html,
body,
#plugin-root {
  height: 100%;
  min-height: 100%;
}
```

## Deployment

**Plugin identifier:** `--identifier` must match Port’s allowed format. Before upload, validate (folder name too when it matches `--identifier`):

```javascript
const PLUGIN_IDENTIFIER_REGEX = /^(?!\.{1,2}$)[A-Za-z0-9@_.+:\\/=-]+$/;
```

Do not upload if the identifier fails this check — rename the plugin directory and fix README/CI references first. See [widget-conventions.md](widget-conventions.md) (**Naming conventions**).

```bash
# Install CLI globally
npm install -g @port-labs/port-plugins-cli

# Configure credentials (interactive — needs Port client ID + secret)
port-plugins config

# Upload or update a plugin (canonical flags only — see readme-and-audit.md)
port-plugins upload \
  --file dist/index.html \
  --identifier <your-widget-name> \
  --title "<widget title in Port>" \
  --params "$(cat upload-params.json)" \
  --description "<short plugin description>" \
  --upsert
```

## Local Development

```bash
npm run dev  # starts webpack-dev-server on http://localhost:9000
```

### Dev Mock Mode

The template's `usePostMessageData.ts` includes a dev mock that activates when running outside Port's iframe (`window.parent === window`). This provides mock values for `portToken`, `portApiBaseUrl`, `entity`, and `user` so you can preview the widget locally.

```typescript
export const DEV_MOCK =
  process.env.NODE_ENV === "development" && window.parent === window;
```

**Configure mock host context** at the top of `usePostMessageData.ts` (entity page vs dashboard, blueprint identifier, optional `relations` / `relationsObjects` aligned with README defaults).

**Add small API mocks** for widgets that fetch data — keep fixtures in `src/dev/mockData.ts` (or similar) and short-circuit in `src/api/*`:

- **2–5 sample entities** is enough for most UIs; mirror Port response shapes (`entities` array, `properties`, `relations`).
- Import `DEV_MOCK` from `usePostMessageData.ts`; return early before `fetch` unless you intentionally hit a real API with a dev token.
- Optional ~200ms delay to exercise loading states.

Full pattern: [scaffolding-and-implementation.md](scaffolding-and-implementation.md) (**Local dev mock data**).

```typescript
import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_ENTITIES } from "../dev/mockData";

export async function searchEntities(...) {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return { entities: MOCK_ENTITIES, ok: true };
  }
  // real fetch...
}
```

### Testing in Port

In Port, when adding/editing a custom widget, toggle **"Local development"** to load `http://localhost:9000` in the iframe. The full postMessage flow (token + PLUGIN_DATA) works in this mode.
