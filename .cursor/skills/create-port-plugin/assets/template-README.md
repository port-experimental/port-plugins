# PLUGIN_TITLE

PLUGIN_SUMMARY — custom plugin for [Port](https://app.port.io). PLUGIN_SURFACE_CONTEXT.

<!-- PLUGIN_SURFACE_CONTEXT examples:
  - "Runs on dashboard pages and merges page filters into entity search."
  - "Must be placed on an entity page; traverses catalog relations from PLUGIN_DATA.entity."
  - "Works on dashboard and entity pages."
-->

## Preview image

<!-- Commit a screenshot or GIF under assets/ or docs/ after first run in Port. -->

<img alt="PLUGIN_TITLE plugin" src="assets/preview.png" />

## Features

<!-- User-visible capabilities only — loading/empty/error states, theme, Recharts, i18n, etc. -->

- Feature one
- Feature two
- Light/dark theme support via Port SDK

## Prerequisites

<!-- Catalog and Port setup come before plugin parameters. Document every blueprint, relation, automation, SSA, or integration the plugin needs. Omit subsections that do not apply. -->

### Access

<!-- Port roles, org settings, where to place the plugin (dashboard vs entity page). -->

- Port account with permission to add custom plugins and read the blueprints this plugin uses
- Node.js **≥ 20** (see `package.json` `engines`)
- [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for upload

### Blueprints & properties

<!-- Existing or new blueprints; property tables when the plugin depends on specific fields. -->

No new blueprints required. Configure the plugin with blueprints that already exist in your catalog.

| Requirement | Details |
|-------------|---------|
| Blueprint | `example-blueprint` — purpose |
| Properties | Optional — list keys the plugin reads or displays |

### Relations

<!-- Omit when not applicable. Include identifier, source, target, required, and how the plugin uses each link. -->

| Relation | Source blueprint | Target blueprint | Required | Usage |
|----------|------------------|------------------|----------|-------|
| `parent` | `child` | `parent` | yes | Resolve related entities at runtime |

<!-- Optional subsections — delete if unused:
### Integrations
### Automations
### Self-service actions (SSA)
### Scorecards / rules / other
-->

## Plugin parameters

<!-- Mirror upload-params.json exactly. This table is authoritative for defaults, examples, and when to override. Keep upload-params.json labels short. Remove rows that duplicate catalog data (relation keys, subject blueprint on entity pages). -->

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `exampleParam` | string | yes | — | What this param scopes |

## Local development

```bash
cd PLUGIN_NAME
npm install
npm run dev   # http://localhost:9000
```

Configure mock host context in `src/hooks/usePostMessageData.ts`. For API fixtures, add early returns in `src/api/` or `src/dev/mockData.ts` when `DEV_MOCK` is true.

<!-- When the plugin links to Port entity pages or other portal routes, uncomment and keep this paragraph:
Entity and portal links built from mock identifiers do **not** work at `http://localhost:9000` outside Port's iframe — there is no `document.referrer` and mock IDs are not real catalog entities. Validate links via Port **Local development** (iframe) or after deploy.
-->

## Setup

### Build

```bash
npm install
npm run build   # output: dist/index.html
```

<!-- Add notes here when build needs extra steps (e.g. post-build patch script, Recharts webpack safety). -->

### Upload

```bash
port-plugins upload \
  --file dist/index.html \
  --identifier PLUGIN_IDENTIFIER \
  --title "PLUGIN_TITLE" \
  --params "$(cat upload-params.json)" \
  --description "PLUGIN_DESCRIPTION" \
  --upsert
```

`PLUGIN_IDENTIFIER` must satisfy Port's plugin identifier regex:

```javascript
const PLUGIN_IDENTIFIER_REGEX = /^(?!\.{1,2}$)[A-Za-z0-9@_.+:\\/=-]+$/;
```

See [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for CLI install and credential setup.

### Add in Port

1. Open a dashboard or entity page → **Add widget** → **Custom widget**
2. Select **PLUGIN_TITLE**
3. Configure plugin parameters (see **Plugin parameters** above)
4. Save

<!-- Optional — when behaviour differs on entity pages:
### Entity-page behaviour
-->

## Project structure

```
PLUGIN_NAME/
  src/
    components/           # One component per file; EmptyState, ErrorBanner, etc.
    hooks/
      usePostMessageData.ts
    api/                  # Port REST calls (optional)
    utils/                # portalUrl.ts, formatters, etc.
    types.ts
    App.tsx
    App.css
    index.tsx
  upload-params.json
  webpack.config.js
  tsconfig.json
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Blank white iframe (no text, no composer) | React hooks called after `if (!portToken) return` | Call all hooks before early returns; use `enabled` in `useQuery` — skill [production-readiness.md](../references/production-readiness.md) §1 |
| Blank iframe, zero height | Missing `#plugin-root` flex / shell `min-height` | Copy layout from `assets/template-App.css` — production-readiness §3 |
| Setup prompt / waiting for Port context | Opened outside Port or missing token | Embed via Port **Local development** or deploy; check `usePostMessageData.ts` mocks for `npm run dev` |
| Empty data | Wrong blueprint, missing relations, or no entities | Verify catalog prerequisites; inspect Port API response in browser devtools |
| Port API error | Auth, wrong host, or malformed search body | Error includes response body; confirm nested `{ query: { combinator, rules } }` on entity search |
| Entity links open wrong region | `document.referrer` unavailable in standalone dev | Expected at `localhost:9000`; test inside Port iframe or after deploy |

<!-- Add plugin-specific rows (theme, page filters, Recharts upload rejection, etc.). -->
