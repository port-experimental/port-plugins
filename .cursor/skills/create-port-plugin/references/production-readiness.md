# Production readiness (mandatory before “done”)

Port plugins that **build** but show a **blank iframe** in Port almost always fail one of the checks below. Run this list on every greenfield plugin and after every audit.

Reference templates (copy into new plugins): **`assets/template-App.tsx`**, **`assets/template-config.ts`**, **`assets/template-resolveHostEntity.ts`**, **`assets/template-usePostMessageData.ts`**.

## Table of contents

- [Production readiness (mandatory before “done”)](#production-readiness-mandatory-before-done)
- [1. React hooks — async host context](#1-react-hooks-async-host-context)
- [2. TanStack Query — no empty main area](#2-tanstack-query-no-empty-main-area)
- [3. Layout — iframe height](#3-layout-iframe-height)
- [4. Theme](#4-theme)
- [5. Widget parameters](#5-widget-parameters)
- [6. Entity-page host entity](#6-entity-page-host-entity)
- [7. UX states (non-optional)](#7-ux-states-non-optional)
- [8. Local dev smoke test](#8-local-dev-smoke-test)
- [9. Port iframe smoke test (before handing to user)](#9-port-iframe-smoke-test-before-handing-to-user)
- [Quick symptom table](#quick-symptom-table)

## 1. React hooks — async host context

Port sends `PORT_TOKEN` and `PLUGIN_DATA` **after** the first paint. `portToken` goes from `null` → JWT on a later render.

| ❌ Forbidden | ✅ Required |
|-------------|------------|
| `if (!portToken) return …` **before** `useQuery` / `useMutation` / custom data hooks | Call **all** hooks on **every** render at the top of `App` |
| Different hook count between renders | Gate fetches with `enabled` **inside** the hook: `enabled: !!portToken && !!portApiBaseUrl && …` |
| Early `return` before hooks that only run when token exists | Early `return` only **after** all hooks, for UI messages |

```tsx
export function App() {
  const { params, entity, portToken, portApiBaseUrl } = usePostMessageData();
  const config = configFromParams(params);
  const host = resolveHostSubject(entity); // entity-page widgets

  // ALWAYS call — never behind portToken guard
  const { query, createMutation } = usePluginData(
    config,
    portToken,
    portApiBaseUrl,
    host?.blueprint,
    host?.identifier
  );

  if (!portApiBaseUrl || !portToken) {
    return <ShellMessage>Waiting for Port context…</ShellMessage>;
  }
  if (!config) {
    return <ShellMessage>Configure widget parameters…</ShellMessage>;
  }
  // …render loading / empty / data using query.isPending, query.isSuccess, etc.
}
```

**Symptom when violated:** blank white widget, no composer, no error text; browser console may show *Rendered more hooks than during the previous render*.

## 2. TanStack Query — no empty main area

| State | UI |
|-------|-----|
| `query.isPending \|\| query.isLoading` | `LoadingState` (skeleton/spinner) |
| `query.isError` | `ErrorBanner` + retry |
| `query.isSuccess && data.length === 0` | `EmptyState` with next step |
| `query.isSuccess && data.length > 0` | Main content |

**Do not** rely on `isLoading` alone in TanStack Query v5 — use **`isPending || isLoading`** while the first fetch runs.

**Do not** leave the main panel with **no branch** when the query is idle/disabled and guards passed — primary actions (e.g. composer, toolbar) should still render when sensible.

## 3. Layout — iframe height

Copy from `assets/template-App.css` (updated). Minimum:

```css
html, body, #plugin-root {
  height: 100%;
  min-height: 100%;
}

#plugin-root {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.shell {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 120px; /* prevents 0px collapse in short tiles */
  overflow-y: auto;
}
```

**Symptom when violated:** Port card looks empty; content exists but height is 0.

## 4. Theme

In `usePostMessageData.ts` (or direct SDK usage):

```ts
useEffect(() => {
  applyThemeCss();
}, [applyThemeCss]);
```

Call on **every** host path (not only `!DEV_MOCK`). Use CSS fallbacks: `var(--text-high, #111827)`.

## 5. Widget parameters

Copy `assets/template-config.ts` → `src/utils/config.ts`.

| Rule | Detail |
|------|--------|
| Blueprint param | Accept **string** or **object** with `.identifier` |
| Param envelope | Read via `readParamValue(params, key)` — handles `{ type, value }` and bare values |
| Never assume | `params.foo.value` alone can be undefined in Port |

## 6. Entity-page host entity

Copy `assets/template-resolveHostEntity.ts` when the widget anchors on `PLUGIN_DATA.entity`.

Resolve blueprint from, in order:

1. `entity.blueprint`
2. `entity.blueprintIdentifier`
3. `entity.properties.$blueprint`

Require **both** blueprint and `entity.identifier` before search/create.

## 7. UX states (non-optional)

- **Loading** — visible while token or first fetch pending
- **Empty** — zero rows with catalog/placement hint
- **Error** — human message; Port API body in `Error` / console
- **Setup** — missing param / wrong surface (dashboard vs entity page) with explicit copy

Use `.shell--message` + `.muted` with **explicit** text color fallbacks for guard screens.

## 8. Local dev smoke test

```bash
npm run dev   # http://localhost:9000 — must show UI (not blank)
npm run build
```

| Check | Pass criteria |
|-------|----------------|
| Standalone dev | Guard or mock data visible; primary UI visible when mocked |
| `DEV_MOCK` | Only when `development && window.parent === window` |
| Fixtures | `mockData.ts` shapes match README Prerequisites |

## 9. Port iframe smoke test (before handing to user)

1. Upload `dist/index.html`
2. Add widget on **correct surface** (entity page vs dashboard per README)
3. Configure **all required** params (especially `type: "blueprint"`)
4. Confirm: loading → empty or data; no blank card
5. Open DevTools → Console: **no** React hooks errors

## Quick symptom table

| Symptom | Likely cause | Fix section |
|---------|--------------|-------------|
| Blank white iframe | Conditional hooks | §1 |
| Blank, no console error | Zero iframe height | §3 |
| Blank after brief flash | `isLoading` only, not `isPending` | §2 |
| “Configure blueprint” never shows | Param read too strict | §5 |
| “Entity page” never shows | `entity.blueprint` missing | §6 |
| Works locally, blank in Port | `DEV_MOCK` true in iframe / hooks | §1, §8 |
| Dark/unstyled text | `applyThemeCss` skipped | §4 |
