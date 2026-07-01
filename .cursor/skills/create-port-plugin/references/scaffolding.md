# Scaffolding a new plugin

Use when no close existing plugin matches. Complete [reuse-workflow.md](reuse-workflow.md) (catalog + relation strategy) **before** defining `upload-params.json`.

## 1. Create the directory

From the **plugins repo root**:

```bash
mkdir <plugin-name>   # kebab-case only, e.g. service-health-panel
```

See [plugin-conventions.md](plugin-conventions.md) for naming and identifier validation.

## 2. Copy templates verbatim

From `assets/` (this skill directory):

| Source | Destination |
|--------|-------------|
| `template-webpack.config.js` | `<plugin>/webpack.config.js` — keep **`devServer.port: 9000`** |
| `template-tsconfig.json` | `<plugin>/tsconfig.json` |
| `template-index.html` | `<plugin>/src/index.html` |
| `template-index.tsx` | `<plugin>/src/index.tsx` |
| `template-usePostMessageData.ts` | `<plugin>/src/hooks/usePostMessageData.ts` |

**SDK:** The template wraps **`usePortPluginData`** from **`@port-labs/plugins-sdk/react`**. It exposes `portToken`, `portApiBaseUrl`, `params`, `entity`, `page`, `user`, `theme`, and **`applyThemeCss`**. The wrapper adds a **local dev mock** outside Port’s iframe. Prefer **`@port-labs/plugins-sdk` ≥ 0.1.1**.

## 3. Adapt these files

| Source | Destination | Changes |
|--------|-------------|---------|
| `template-package.json` | `<plugin>/package.json` | `name`: `port-<plugin-name>-plugin`; `description` |
| `template-App.css` | `<plugin>/src/App.css` | Styles — see [ui-and-styling.md](ui-and-styling.md) |
| `template-useScrollMirror.ts` | `<plugin>/src/hooks/useScrollMirror.ts` | **Optional** — wide tables with bottom horizontal mirror |
| `template-App.tsx` | `<plugin>/src/App.tsx` | **Hooks before early returns** — see [production-readiness.md](references/production-readiness.md) |
| `template-config.ts` | `<plugin>/src/utils/config.ts` | `readBlueprintParam`, `readParamValue`, `configFromParams` |
| `template-resolveHostEntity.ts` | `<plugin>/src/utils/resolveHostEntity.ts` | **Entity-page** widgets only |
| `template-types.ts` | `<plugin>/src/types.ts` | `PluginConfig` matching params |
| `template-upload-params.json` | `<plugin>/upload-params.json` | Minimal params — see [params-and-relations.md](params-and-relations.md) |
| `template-README.md` | `<plugin>/README.md` | Replace `PLUGIN_*` placeholders — see [readme-and-audit.md](readme-and-audit.md) |

**Recharts:** When adding charts, copy `assets/webpack/lodash-root-shim.js` and apply [webpack-port-upload-safety.md](webpack-port-upload-safety.md).

## 4. Code layout

**Do not put everything in `App.tsx`.** Split beyond ~150 lines:

```
src/
  App.tsx                  # Compose components, wire data
  types.ts                 # PluginConfig + domain types
  hooks/
    usePostMessageData.ts  # Host bridge (template)
    useComments.ts         # One hook per data concern
  components/
    CommentList.tsx
    EmptyState.tsx
    ErrorBanner.tsx
  api/                     # Port REST calls
  utils/
    portalUrl.ts
  App.css
```

| Rule | Guidance |
|------|----------|
| Components | One per file; extract at ~80 lines or when state/effects grow |
| API | Calls in `api/` — hooks call `api/`, components call hooks |
| Hooks | One data concern per hook |
| Types | `types.ts` is single source of truth for `PluginConfig` |
| `App.tsx` | Thin shell: **all hooks first** → setup guards → loading/empty/error/data |

When adapting a monolithic plugin, apply this split before adding features.

## 5. Verify locally

```bash
cd <plugin-name>
npm install
npm run dev    # http://localhost:9000
npm run build  # dist/index.html
git add dist/index.html   # commit the upload artifact (not other dist/ files)
```

Checklist: `inject: "body"` in webpack; `height: 100%` + `#plugin-root` flex — [ui-and-styling.md](ui-and-styling.md); `applyThemeCss()` always — [production-readiness.md](production-readiness.md).

**Before marking done:** complete [production-readiness.md](production-readiness.md) §1–§10 (including `npm view @port-labs/plugins-sdk version` vs lockfile).

## 6. Document and ship

| Task | Reference |
|------|-----------|
| Per-plugin README | [readme-and-audit.md](readme-and-audit.md) + `assets/template-README.md` |
| Preview screenshot | Commit `assets/preview.png`; full GitHub blob URL in README — [readme-and-audit.md](readme-and-audit.md) (**Preview image**) |
| Version bump (once per branch) | [readme-and-audit.md](readme-and-audit.md) (**Versioning**) — rebuild and commit `dist/index.html` |
| Build artifact | `npm run build` then commit `dist/index.html` (greenfield + every version bump) |
| Root Plugins table row | Include **Version** from `package.json` |
| Upload | Canonical `port-plugins upload` in [readme-and-audit.md](readme-and-audit.md) |
| Anti-patterns | [guidelines.md](guidelines.md) before finishing |

Greenfield plugins stay at **`0.1.0`** for the entire first branch until merge/publish.
