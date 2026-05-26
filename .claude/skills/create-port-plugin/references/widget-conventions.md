# Widget Repository Conventions

## Placement and naming (required)

- **Root directory only:** Each widget is typically a **folder at the repository root** of your plugins repo (same level as `README.md` and sibling plugin folders). Do not scaffold new widgets under arbitrary nested paths unless your team has standardized that layout.
- **Lowercase, hyphen-separated names:** The folder name must be **kebab-case**: all lowercase, words joined with single hyphens, no spaces. Derive it from the widget title (for example, "Service Health Panel" → `service-health-panel`).

## Repository Structure

Each widget lives in its own top-level directory:

```
<plugins-repo>/
├── README.md                     # Plugins table (Widget, Version, Description) — update when adding one or bumping package.json version
├── .cursor/                      # Optional — e.g. editor skills / templates
│   └── skills/
│       └── create-port-plugin/
│           ├── SKILL.md
│           ├── references/
│           └── assets/
├── your-existing-widget/         # Example plugin — each plugin mirrors this shape
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
└── your-new-widget/              # New plugin — same structure
```

## Reference plugins in *your* repo

Pick **existing** sibling plugins as references when they match what you are building. The table below is **illustrative** — fill in real directory names from your `README.md`.

| Plugin folder (example) | Often useful when you need |
|---|---|
| `your-existing-widget` | Baseline layout, host hook, simple Port API calls |
| another sibling plugin | Patterns you already use (DnD, mutations, JSON property editors, …) |

## Naming Conventions

| Item | Convention | Example |
|---|---|---|
| Directory location | Repo root (`<plugins-repo>/<name>/`) | `<plugins-repo>/service-health-panel/` |
| Directory name | kebab-case (lowercase + hyphens) | `service-health-panel` |
| Port plugin identifier | same as directory | `service-health-panel` |
| `package.json` name | `port-{dir-name}-plugin` | `port-service-health-panel-plugin` |
| Widget title in Port | Title Case | `"Service Health Panel"` |

### Plugin identifier validation (required before upload)

Port rejects identifiers outside its allowed character set. **Always** validate the directory name and `port-plugins upload --identifier` before uploading:

```javascript
const PLUGIN_IDENTIFIER_REGEX = /^(?!\.{1,2}$)[A-Za-z0-9@_.+:\\/=-]+$/;
```

| Outcome | Examples |
|---------|----------|
| **Valid** | `entity-calendar`, `service-health-panel`, `my_widget`, `plugin@v1` |
| **Invalid** | `.`, `..`, empty string, identifiers with spaces or characters outside the class above |

If validation fails, rename the plugin folder and update README upload commands and any CI paths — do not upload until the identifier passes.

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
  `assets/template-App.css` shows **surface** token mapping and **decoration** examples (`.example-dot`, `.example-link`).

## Upload automation (optional)

Publishing a plugin **does not require** GitHub Actions or any other pipeline. Many teams run **`npm run build`** locally and upload **`dist/index.html`** with the [Port plugins CLI](https://www.npmjs.com/package/@port-labs/port-plugins-cli) from a laptop or from a one-off job in whatever CI they already use.

If you add a **build-and-upload** workflow (for example under `.github/workflows/`), a common pattern on merge to `main` is:

1. Detect which plugin directories changed
2. Run `npm ci && npm run build` in each changed directory
3. Upload `dist/index.html` with `port-plugins upload --upsert` (see npm docs for auth: token or client ID + secret)

### Secrets (only if you automate uploads)

| Secret | Source |
|---|---|
| `PORT_CLIENT_ID` | Port → Settings → Credentials |
| `PORT_CLIENT_SECRET` | Port → Settings → Credentials |

### Optional variable

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
