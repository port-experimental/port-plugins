# Validation report — AI Invocation Viewer

**Plugin:** `ai-invocation-viewer`  
**Date:** 2026-08-26  
**Branch:** `cursor/ai-invocation-viewer-0d17`  
**Skill:** `.cursor/skills/create-port-plugin`

## 1. Build & runtime (passed)

| Check | Status |
|-------|--------|
| `npm install` | Pass |
| `npm run build` → `dist/index.html` | Pass (2.56 MiB — AnchorUI + markdown bundle) |
| Webpack `inject: "body"` | Pass |
| `html, body, #plugin-root { height: 100% }` | Pass (`App.css`) |
| `#plugin-root` flex column + `.shell` min-height | Pass |
| Entity API GET with error body text | Pass (`fetchInvocationEntity.ts`) |
| No `innerHTML` / `dangerouslySetInnerHTML` | Pass |
| Hooks before early returns in `App` | Pass |
| `useQuery` gated with `enabled` | Pass (`useInvocationEntity`) |
| `applyThemeCss()` on Port iframe path | Pass (`usePostMessageData`) |
| Empty `upload-params.json` (no duplicate catalog params) | Pass |
| Plugin identifier `ai-invocation-viewer` matches regex | Pass |

## 2. Dependencies

| Package | Declared | Resolved (lockfile) | Latest (npm) | Status |
|---------|----------|---------------------|--------------|--------|
| `@port-labs/plugins-sdk` | `^0.4.0` | `0.4.0` | `0.4.0` | Pass |

Other Port packages: `@port-labs/anchor-ui` `^0.0.11` (bundled UI kit — not audited against npm latest in this run).

## 3. Production readiness gaps (addressed)

| Gap | Resolution |
|-----|------------|
| SDK behind latest (`0.1.1` resolved from `^0.1.0`) | Bumped to `^0.4.0`, lockfile resolves `0.4.0` |
| `useInvocationEntity` used `isLoading` only | Now `isPending \|\| isLoading \|\| isFetching` |
| Local `Avatar` component shadowed AnchorUI `Avatar` import | Renamed to `ConversationAvatar` |
| Missing committed `dist/index.html` | Built and committed |
| Missing README / preview image | Added `README.md` + `assets/preview.png` |
| Root `README.md` Plugins table row missing | Added |

## 4. README / audit gaps (addressed)

| Item | Status |
|------|--------|
| Per-plugin README section order | Pass |
| Prerequisites before parameters | Pass |
| Canonical `port-plugins upload` command | Pass |
| Preview image blob URL with dimensions | Pass (`1200×700`) |
| Troubleshooting table | Pass |
| Root Plugins table row | Pass (pending merge) |

## 5. Intentional / acceptable choices

- **Session storage** for selected tab per entity (`sessionStorage`) — local UI preference only; acceptable per guidelines.
- **Large bundle** (~2.56 MiB) — `@port-labs/anchor-ui` + `react-markdown` inlined for single-file upload; acceptable for Port plugin artifact.
- **Hard-coded blueprint identifiers** (`_ai_invocations`, `_ai_conversation`) — required for Port AI catalog; documented in README Prerequisites.
- **Extensive dev mocks in `usePostMessageData.ts`** — enables rich local QA without Port iframe; matches sibling plugins pattern.

## 6. Not verified in this run

- Live Port iframe smoke test after CLI upload
- `_ai_conversation` page with real `latest_invocation` relation
- Light theme in Port host (dark theme verified via local dev mock)

## 7. Recommended fix priority (post-merge)

1. Optional: capture light-theme preview screenshot after Port deploy
2. Monitor `@port-labs/anchor-ui` releases for bundle-size / security updates
3. Run Port iframe smoke test on both `_ai_invocations` and `_ai_conversation` entity pages
