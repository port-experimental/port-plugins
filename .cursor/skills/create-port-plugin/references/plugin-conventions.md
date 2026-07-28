# Plugin conventions

## Placement and naming

- **Repo root:** One folder per plugin at repository root (sibling of root `README.md`) unless team standard differs.
- **Directory:** kebab-case — `service-health-panel`.
- **`package.json` name:** `port-<dir-name>-plugin`.
- **Port title:** Title Case — `"Service Health Panel"`.
- **`--identifier`:** Same as directory; must pass regex before upload:

```javascript
const PLUGIN_IDENTIFIER_REGEX = /^(?!\.{1,2}$)[A-Za-z0-9@_.+:\\/=-]+$/;
```

| Valid | Invalid |
|-------|---------|
| `entity-calendar`, `my_widget` | `.`, `..`, spaces |

## Repository structure

```
<plugins-repo>/
├── README.md                 # Plugins table (link, Version, description)  
├── .gitignore                # **/dist/** ignored; !**/dist/index.html tracked
├── existing-plugin/
│   ├── src/
│   ├── dist/
│   │   └── index.html        # Committed upload artifact (rebuild on version bump)
│   ├── package.json
│   ├── upload-params.json
│   ├── webpack.config.js
│   └── tsconfig.json
└── new-plugin/               # Same shape
```

Pick **sibling plugins** as references when patterns match (lists, DnD, mutations, etc.).

## Required files

| File | Action |
|------|--------|
| `webpack.config.js`, `tsconfig.json`, `src/index.html`, `src/index.tsx`, `usePostMessageData.ts` | Copy verbatim from templates |
| `package.json`, `App.tsx`, `App.css`, `types.ts`, `upload-params.json`, `README.md` | Adapt |
| `dist/index.html` | **Commit** after `npm run build` — new plugin or version bump |

Scaffold map: [scaffolding.md](scaffolding.md).

## Tech stack

React 19, TypeScript 5.7, Webpack 5 (single inlined HTML), TanStack Query 5, `@port-labs/plugins-sdk`, PostCSS.

## Theming

Host sends `theme: { mode, css }` on `PLUGIN_DATA`. Call **`applyThemeCss()`**; map tokens in CSS with fallbacks — [plugin-architecture.md](plugin-architecture.md), [ui-and-styling.md](ui-and-styling.md).

## Upload automation (optional)

Local upload is fine:

```bash
npm run build
port-plugins upload \
  --file dist/index.html \
  --identifier <plugin-name>-port-plugin \
  --title "<title>" \
  --params "$(cat upload-params.json)" \
  --description "<description>" \
  --upsert
```

CI pattern: detect changed plugin dirs → `npm ci && npm run build` → upload. Secrets: `PORT_CLIENT_ID`, `PORT_CLIENT_SECRET`. Optional `PORT_API_BASE_URL` (`https://api.us.port.io` for US).

## Root README Plugins table

```markdown
| [Plugin Title](./plugin-name) | 1.0.0 | One-sentence description |
```

**Version** must match `package.json`. Bump once per branch — [readme-and-audit.md](readme-and-audit.md).

## Branching (optional)

| Item | Pattern |
|------|---------|
| Branch | `feat/add-<plugin-name>-plugin` |
| Commit | `feat: scaffold <plugin-name> custom plugin` |

PR body: behaviour, params, catalog prerequisites, deploy notes.
