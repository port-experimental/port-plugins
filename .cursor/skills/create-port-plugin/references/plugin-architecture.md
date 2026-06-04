# Plugin architecture

How Port plugins run in the iframe: host bridge, API, build, and deploy. Implementation patterns: [implementation.md](implementation.md). UI: [ui-and-styling.md](ui-and-styling.md).

## Table of contents

- [Plugin architecture](#plugin-architecture)
- [Overview](#overview)
- [postMessage protocol](#postmessage-protocol)
  - [Plugin → Host](#plugin-host)
  - [Host → Plugin](#host-plugin)
- [PLUGIN_DATA shape](#plugin_data-shape)
- [Token flow](#token-flow)
- [Portal vs API host](#portal-vs-api-host)
- [Entity search](#entity-search)
- [Dashboard page filters](#dashboard-page-filters)
- [TanStack Query pattern](#tanstack-query-pattern)
- [upload-params.json types](#upload-paramsjson-types)
- [Theming](#theming)
- [Build requirements](#build-requirements)
  - [Critical webpack](#critical-webpack)
  - [Critical CSS](#critical-css)
  - [Upload safety (Recharts / lodash)](#upload-safety-recharts-lodash)
- [Deployment](#deployment)
- [Local development](#local-development)
- [Drag-and-drop (optional)](#drag-and-drop-optional)
- [Rendering rules (summary)](#rendering-rules-summary)

## Overview

Plugins compile to a single **`dist/index.html`** (webpack, inlined assets), run in a Port `<iframe>`, register via CLI. Communication is **`window.postMessage`** only.

## postMessage protocol

### Plugin → Host

| Event | When |
|-------|------|
| `REQUEST_PORT_TOKEN` | On mount when `window.parent !== window` |

Send on mount (handles React Strict Mode double-mount).

### Host → Plugin

| Event | Payload |
|-------|---------|
| `PORT_TOKEN` | `{ type, token }` |
| `PLUGIN_DATA` | `{ type, params?, page?, user?, entity?, baseUrl?, theme? }` |

## PLUGIN_DATA shape

```ts
{
  params?: Record<string, { type: string; value: unknown }>;
  page?: { identifier?: string; pageFilters?: unknown };
  user?: { firstName?, lastName?, email?, picture? };
  entity?: {
    identifier: string;
    title?: string;
    blueprint?: string;
    properties?: Record<string, unknown>;
    relations?: Record<string, unknown>;
    relationsObjects?: Record<string, unknown>;
  };
  baseUrl?: string;  // portApiBaseUrl — never hardcode
  theme?: { mode: string; css: string };
}
```

## Token flow

1. Plugin sends `REQUEST_PORT_TOKEN`
2. Host replies `PORT_TOKEN` (short-lived JWT)
3. Plugin uses `Authorization: Bearer <token>` on `/v1/...`
4. API base from `PLUGIN_DATA.baseUrl`

## Portal vs API host

| Concern | Source |
|---------|--------|
| REST API | `portApiBaseUrl` + bearer token |
| In-app links | `document.referrer` origin; fallback `https://app.port.io` |

Details: [implementation.md](implementation.md) (**Portal links**).

## Entity search

`POST /v1/blueprints/{blueprint}/entities/search` with nested **`query`**. Errors: include response body text.

Common 422 causes: top-level `combinator`/`rules`; unsupported URL params; wrong endpoint.

## Dashboard page filters

Merge **`page.pageFilters`** with **`mergePageFilters`** from **`@port-labs/plugins-sdk`**:

| Argument | Source |
|----------|--------|
| Widget query | `{ combinator, rules }` |
| Page filters | `page?.pageFilters` |
| Blueprint | **Full** object from `params.blueprint.value` — not `{ identifier }` only |

Passing only `{ identifier }` drops **`$team`** filters. Preserve full object in `readBlueprintParam` / `PluginConfig`.

Include `page?.pageFilters` in React Query keys. Entity pages: usually no page filters.

## TanStack Query pattern

```ts
useQuery({
  queryKey: ["entities", blueprint, portToken, page?.pageFilters],
  queryFn: async () => { /* fetch with mergePageFilters when needed */ },
  enabled: !!portToken && !!portApiBaseUrl,
  staleTime: 5 * 60 * 1000,
});
```

## upload-params.json types

| Type | UI control |
|------|------------|
| `string`, `number`, `boolean`, `object`, `array` | Scalar / JSON |
| `blueprint` | Blueprint picker (object at runtime) |

Every param: **`type`**, **`isRequired`**, **`label`**. Detail in README — [params-and-relations.md](params-and-relations.md).

## Theming

1. Call **`applyThemeCss()`** from SDK when `theme.css` changes.
2. Map Port tokens in CSS with fallbacks:

```css
:root {
  --bg:   var(--background-primary, #f0f2f5);
  --card: var(--background-dim, #ffffff);
  --text: var(--text-high, #111827);
  --muted: var(--text-medium, #6b7280);
  --border: var(--border-medium, rgba(0, 0, 0, 0.09));
}
```

3. Decorations on class-local vars — [ui-and-styling.md](ui-and-styling.md).

Without SDK: inject `theme.css` from `PLUGIN_DATA` yourself.

## Build requirements

- Output: **single self-contained `dist/index.html`**
- `InlineChunkHtmlPlugin` in webpack template
- No external CDN requests in built file

### Critical webpack

```javascript
new HtmlWebpackPlugin({
  template: "./src/index.html",
  inject: "body",  // REQUIRED — prevents blank screen
}),
```

### Critical CSS

```css
html, body, #plugin-root {
  height: 100%;
  min-height: 100%;
}
```

### Upload safety (Recharts / lodash)

Apply [webpack-port-upload-safety.md](webpack-port-upload-safety.md) when using Recharts or upload rejects `Function`.

## Deployment

Validate identifier with `PLUGIN_IDENTIFIER_REGEX` before upload.

```bash
port-plugins upload \
  --file dist/index.html \
  --identifier <plugin-name>-port-plugin \
  --title "<title>" \
  --params "$(cat upload-params.json)" \
  --description "<description>" \
  --upsert
```

CLI setup: [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli).

## Local development

```bash
npm run dev   # http://localhost:9000 — port 9000 always
```

**DEV_MOCK** activates when `development` + `window.parent === window`. Configure mocks in `usePostMessageData.ts` + `api/` — [implementation.md](implementation.md).

Port **Local development** toggle loads localhost in iframe with real `PLUGIN_DATA`.

## Drag-and-drop (optional)

Native HTML5 DnD for reorder/cross-container lists:

- `dragRef` for synchronous drag source
- Item `onDragOver` → insert index from top/bottom half
- Container handlers for empty-space append
- Optimistic local state + background PATCH/POST to Port

Full handler pattern available in repo plugins with DnD (e.g. column pickers). Keep persistence on Port API when order should survive reload — [guidelines.md](guidelines.md) (**Data persistence**).

## Rendering rules (summary)

- No unsafe HTML for dynamic content
- No params duplicating API-fetchable catalog data
- Loading/empty/error states; no duplicate plugin title in iframe
- No emoji — icon library

Details: [guidelines.md](guidelines.md), [ui-and-styling.md](ui-and-styling.md).
