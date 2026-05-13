# Widget Repository Conventions

## Placement and naming (required)

- **Root directory only:** Each widget is a **folder at the repository root** of `port-custom-widgets` (same level as `README.md`, `.github/`, `task-comment-chat/`, etc.). Do not scaffold new widgets under `widgets/` or other nested paths unless the maintainers have standardized that layout.
- **Lowercase, hyphen-separated names:** The folder name must be **kebab-case**: all lowercase, words joined with single hyphens, no spaces. Derive it from the widget title (for example, "Service Health Panel" → `service-health-panel`).

## Repository Structure

Each widget lives in its own top-level directory:

```
port-custom-widgets/
├── .github/
│   └── workflows/
│       └── deploy-widgets.yml    # Auto-deploys changed widgets on merge to main
├── README.md                     # Lists all widgets — update when adding a new one
├── .cursor/
│   └── skills/
│       └── create-custom-widget/ # Skill: scaffold & build Port custom widgets
│           ├── SKILL.md
│           ├── references/       # Architecture docs
│           └── assets/           # Template files for scaffolding new widgets
├── task-comment-chat/            # Reference widget — follow its structure
│   ├── src/
│   │   ├── index.html
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   ├── App.css
│   │   ├── types.ts
│   │   ├── hooks/
│   │   │   └── usePostMessageData.ts
│   │   └── utils/
│   ├── package.json
│   ├── upload-params.json
│   ├── webpack.config.js
│   └── tsconfig.json
├── hierarchy-pages/              # Reference widget for drag-and-drop hierarchies
│   └── ...                       # Folder tree with cross-container + in-folder reorder
│                                 # State stored in `pages` blueprint entity (JSON property)
└── your-new-widget/              # New widget — same structure
```

## Reference Widgets

| Widget | Best reference for |
|---|---|
| `task-comment-chat` | General structure, postMessage hook, basic API calls |
| `page-favorites` | Drag-to-reorder lists (simple single-list DnD), TanStack Query mutations |
| `hierarchy-pages` | Multi-container DnD with in-container reordering + insert indicators; optimistic local state; storing structured JSON on a blueprint entity |

## Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Directory location | Repo root (`port-custom-widgets/<name>/`) | `port-custom-widgets/service-health-panel/` |
| Directory name | kebab-case (lowercase + hyphens) | `service-health-panel` |
| Port plugin identifier | same as directory | `service-health-panel` |
| `package.json` name | `port-{dir-name}-plugin` | `port-service-health-panel-plugin` |
| Widget title in Port | Title Case | `"Service Health Panel"` |

## Required Files Per Widget

| File | Purpose | Action |
|---|---|---|
| `package.json` | Dependencies, build/dev scripts | Adapt from template (update name + description) |
| `webpack.config.js` | Bundles to single inlined HTML | **Copy verbatim** from template |
| `tsconfig.json` | TypeScript settings | **Copy verbatim** from template |
| `upload-params.json` | Widget parameter schema | Define for your widget |
| `src/index.html` | HTML root (`<div id="plugin-root">`) | **Copy verbatim** from template |
| `src/index.tsx` | React entry, wraps in QueryClientProvider | **Copy verbatim** from template |
| `src/App.tsx` | Main widget component | Implement widget logic |
| `src/App.css` | Widget styles | Adapt from template |
| `src/types.ts` | TypeScript types including `PluginConfig` | Adapt: add fields matching params |
| `src/hooks/usePostMessageData.ts` | postMessage listener | **Copy verbatim** from template |

## Tech Stack

- **React 19** + **TypeScript 5.7**
- **Webpack 5** with `InlineChunkHtmlPlugin` → single HTML output
- **TanStack React Query 5** for data fetching
- **@port-labs/plugins-sdk** for postMessage handling and theme inheritance
- **PostCSS** + `postcss-preset-env` for CSS

## Theming

Port sends **`theme: { mode, css }`** on **`PLUGIN_DATA`**. The SDK’s **`applyThemeCss()`**
injects **`theme.css`** into the iframe so the widget matches the portal (light/dark and
design tokens). Widget CSS should use **`var(--background-primary, …)`**-style mappings with
**fallbacks** for local dev.

- **Spec and checklist:** [plugin-architecture.md — Theming](./plugin-architecture.md) (also
  documents widgets that do not use the SDK).
- **Scaffold defaults:** `assets/template-usePostMessageData.ts` calls **`applyThemeCss()`**;
  `assets/template-App.css` shows token mapping.

## CI/CD Pipeline (`deploy-widgets.yml`)

On every merge to `main`:
1. Detects which widget directories changed
2. Runs `npm ci && npm run build` in each changed directory
3. Uploads `dist/index.html` to Port: `port-plugins upload --upsert`
4. Creates a GitHub release for each deployed widget

### Secrets Required

| Secret | Source |
|---|---|
| `PORT_CLIENT_ID` | Port → Settings → Credentials |
| `PORT_CLIENT_SECRET` | Port → Settings → Credentials |

### Optional Variable

| Variable | Default |
|---|---|
| `PORT_API_BASE_URL` | `https://api.getport.io` |

Use `https://api.us.port.io` for US region.

## README Widgets Table

Add a row when adding a new widget:

```markdown
| [Widget Title](./widget-name) | One-sentence description |
```

## Branching & PR Convention

| Item | Pattern |
|---|---|
| Branch name | `feat/add-{widget-name}-widget` |
| Commit message | `feat: scaffold {widget-name} custom widget` |
| PR title | `feat: add {widget-name} custom widget` |

PR body should describe: what the widget does, its parameters, required blueprints/relations, and deployment notes.
