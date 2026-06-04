# Implementation patterns

Runtime code for Port plugins. Host bridge and build details: [plugin-architecture.md](plugin-architecture.md). UI/CSS: [ui-and-styling.md](ui-and-styling.md). Params: [params-and-relations.md](params-and-relations.md).

## Table of contents

- [Implementation patterns](#implementation-patterns)
- [App entry](#app-entry)
  - [Hooks order (critical — blank iframe if wrong)](#hooks-order-critical-blank-iframe-if-wrong)
  - [Param and host helpers](#param-and-host-helpers)
  - [TanStack Query UI](#tanstack-query-ui)
- [Entity search](#entity-search)
- [Error handling](#error-handling)
- [Portal links](#portal-links)
- [Safe rendering](#safe-rendering)
- [Local dev mocks](#local-dev-mocks)
- [Relation resolution (runtime)](#relation-resolution-runtime)
- [Subject blueprint (entity pages)](#subject-blueprint-entity-pages)
- [Param lineage (reuse)](#param-lineage-reuse)

## App entry

In `App.tsx`:

- Use **`usePortPluginData()`** from **`@port-labs/plugins-sdk/react`** for new code, **or** keep template **`usePostMessageData()`** for repo consistency.
- **Runtime data — Port REST API only.** `Authorization: Bearer ${portToken}`, base `portApiBaseUrl`. Centralize in `api/`; TanStack Query in hooks with `enabled: !!portToken && !!portApiBaseUrl`. **No MCP** in iframe code.
- **Dashboard page filters:** **`mergePageFilters`** on search queries — pass **full** blueprint from `params.blueprint.value`, not `{ identifier }` only. [plugin-architecture.md](plugin-architecture.md) (**Dashboard page filters**).
- Remove the entity guard block for dashboard-only plugins.

### Hooks order (critical — blank iframe if wrong)

Port delivers `portToken` and `PLUGIN_DATA` **asynchronously**. The first render often has `portToken === null`; the next render has a token.

| Rule | Detail |
|------|--------|
| Call **all** hooks at the **top** of `App` | Before any `if (!portToken) return …` |
| Gate inside hooks | `useQuery({ enabled: !!portToken && !!portApiBaseUrl && … })` |
| Setup UI after hooks | Early returns only for **messages**, not for skipping hooks |

Copy **`assets/template-App.tsx`** structure. Full checklist: [production-readiness.md](production-readiness.md) §1.

### Param and host helpers

Copy verbatim and adapt:

| Template | Destination |
|----------|-------------|
| `assets/template-config.ts` | `src/utils/config.ts` — `readBlueprintParam`, `readParamValue`, `configFromParams` |
| `assets/template-resolveHostEntity.ts` | `src/utils/resolveHostEntity.ts` — entity-page widgets only |

Do not read blueprint params as `params.foo.value` only — use `readParamValue(params, "foo")`.

### TanStack Query UI

```tsx
const showLoading = query.isPending || query.isLoading;
```

Render **loading**, **empty**, **error**, and **data** branches so the main area is never empty while the user waits. See [production-readiness.md](production-readiness.md) §2.

## Entity search

Use `POST /v1/blueprints/{blueprint}/entities/search` — body nests rules inside **`query`**:

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

**Avoid:** top-level `combinator`/`rules` (422); `page`/`page_size` query params; generic `/v1/entities/search`.

With page filters:

```ts
import { mergePageFilters, type PageQuery } from "@port-labs/plugins-sdk";

let query = { combinator: "and" as const, rules: [] as unknown[] };
if (page?.pageFilters) {
  query = mergePageFilters(
    query,
    page.pageFilters as PageQuery[],
    config.blueprint // full object from params.blueprint.value
  );
}
```

## Error handling

Always include the response body:

```ts
if (!response.ok) {
  const body = await response.text();
  throw new Error(`Port API ${response.status}:\n${body}`);
}
```

## Portal links

| Use | For |
|-----|-----|
| `portApiBaseUrl` + token | REST `/v1/...` |
| `document.referrer` → origin | `<a href>`, `window.open` |
| `https://app.port.io` | Empty referrer (standalone local dev) |

**Do not** add a portal URL param for the common case.

Put helpers in **`src/utils/portalUrl.ts`**:

```ts
const DEFAULT_PORTAL_ORIGIN = "https://app.port.io";

export function getPortalOrigin(): string {
  try {
    const ref = document.referrer?.trim();
    if (ref) return new URL(ref).origin;
  } catch { /* invalid referrer */ }
  return DEFAULT_PORTAL_ORIGIN;
}

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

**Local dev:** mock IDs + fallback origin do **not** open real entities — document in README **Local development**; validate in Port **Local development** iframe or after deploy.

## Safe rendering

**Forbidden:** `innerHTML`, `outerHTML`, **`dangerouslySetInnerHTML`** for dynamic/user content.

**Use:** React text, components, structured mapping. Rich HTML only with explicit sanitizer + README note.

## Local dev mocks

When `npm run dev` runs outside Port’s iframe, **`DEV_MOCK`** in `usePostMessageData.ts` supplies host context.

| Layer | File | Mock |
|-------|------|------|
| Host bridge | `usePostMessageData.ts` | token, baseUrl, entity, user, params |
| Port API | `src/api/*.ts` or `src/dev/mockData.ts` | `if (DEV_MOCK) return …` |

Rules:

1. **Small fixtures** — 2–5 entities, one happy path.
2. **Mirror real API shapes** — same field names/nesting.
3. **Align with README** — blueprint, relation keys, property keys match Prerequisites.
4. **Short-circuit in `api/`** — no fetch when `DEV_MOCK` unless testing real token.
5. **Optional ~200ms delay** — exercises loading UI.
6. **`DEV_MOCK` false** when embedded in Port (`window.parent !== window`).

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

## Relation resolution (runtime)

**Order:** catalog constants (README) → `PLUGIN_DATA.entity` → `relatedTo` search → blueprint GET → optional string override (last resort).

```typescript
const PARENT_RELATION = "parent"; // from README / blueprint schema
const parentEntity = pluginData.entity?.relationsObjects?.[PARENT_RELATION];
```

```typescript
// relatedTo search — preferred over relation-key params
const body = {
  query: {
    combinator: "and",
    rules: [{
      operator: "relatedTo",
      blueprint: currentEntity.blueprint,
      value: currentEntity.identifier,
    }],
  },
};
```

Full param design rules: [params-and-relations.md](params-and-relations.md).

## Subject blueprint (entity pages)

Use **`resolveHostSubject(entity)`** from `template-resolveHostEntity.ts` — not only `entity.blueprint`:

```typescript
import { resolveHostSubject } from "./utils/resolveHostEntity";

const host = resolveHostSubject(entity);
if (!host) {
  return <ShellMessage>Place on an entity page…</ShellMessage>;
}
const { blueprint: subjectBlueprint, identifier: subjectIdentifier } = host;
```

Omit subject `type: "blueprint"` param when entity page + design default suffice.

## Param lineage (reuse)

Document shared params in README or `types.ts` header when adapting sibling plugins:

```typescript
/**
 * Param lineage:
 * - commentBlueprint: align with task-comment-chat if present
 * - milestoneBlueprint: new for this plugin
 */
```
