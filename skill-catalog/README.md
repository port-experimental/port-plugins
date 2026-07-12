# Skills Marketplace

A [Port](https://app.getport.io) custom widget that displays all skills as a **card grid** with readiness scores, search, and category grouping. Cards expose inline **Create** and **Edit** flows (markdown editor, multi-file authoring, AI drafting, live diff) rendered in modal overlays, so a single dashboard widget covers browsing and authoring.

Designed for **dashboard** pages.

## Preview image

<img alt="Skills Marketplace widget" src="https://github.com/port-experimental/port-plugins/blob/main/skill-catalog/assets/preview.gif" />

## Badges

Dashboard · React 19 · TypeScript · [Port Plugins](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins)

## Features

- Card grid of all skills with a 0–100 **readiness score** badge
- Search and category grouping
- Inline **Create Skill** flow (markdown editor, multi-file authoring, optional AI drafting)
- Per-card **Edit** flow with live diff, submitting a `skill_request` for review
- Respects Port light/dark theme via `@port-labs/plugins-sdk`
- Loading, empty, and error states

## Prerequisites

### Access

- Port account with permission to add custom widgets, read entities, and create `skill_request` entities
- Node.js **≥ 20** (see `package.json` `engines`)
- [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for upload

### Catalog

| Blueprint | Role |
|-----------|------|
| `_skill` | Skills listed as cards |
| `_skill_version` | Latest version per skill |
| `_skill_file` | File content (SKILL.md, references, scripts, assets) |
| `skill_group` | Grouping / ownership (picker) |
| `skill_request` | Intermediary entity created by the create/edit flows for approval |

The create/edit flows write `skill_request` entities; an approval workflow (outside this widget) finalizes them.

## Widget parameters

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `skillRequestBlueprint` | `string` | No | — | Skill request blueprint identifier used by the create/edit flows. |
| `skillGroupBlueprint` | `string` | No | — | Skill group blueprint identifier backing the group picker. |
| `aiAgentIdentifier` | `string` | No | — | Port AI agent identifier for "Create with AI". Leave blank to use the general-purpose Port AI assistant. |

## Local development

```bash
cd skill-catalog
npm install
npm run dev
```

Open `http://localhost:9000` (webpack `devServer.port: 9000` — required for Port **Local development** iframe mode). Outside Port's iframe, `DEV_MOCK` supplies a token and mock skills.

| File | Purpose |
|------|---------|
| `src/hooks/usePostMessageData.ts` | Host bridge + `DEV_MOCK` gate |
| `src/dev/mockData.ts` | Sample skills for the card grid |

## Setup

### Build

```bash
npm install
npm run build
```

Artifact: `dist/index.html`

### Upload

```bash
port-plugins upload \
  --file dist/index.html \
  --identifier skill-catalog \
  --title "Skills Marketplace" \
  --params "$(cat upload-params.json)" \
  --description "Dashboard card grid with readiness scores, search, filtering, and inline create/edit" \
  --upsert
```

CLI install, auth, and region: [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli).

### Add in Port

1. Dashboard → **Add widget** → **Custom widget**
2. Select **Skills Marketplace**
3. Optionally set the request/group blueprint and AI agent parameters

### Entity-page behaviour

N/A — this widget is intended for dashboards. It does not require `PLUGIN_DATA.entity`.

## Project structure

```
skill-catalog/
├── src/
│   ├── api/                      # skills + AI calls
│   ├── components/               # Modal, CreateFlow, UpdateFlow, editor, etc.
│   ├── hooks/usePostMessageData.ts
│   ├── utils/                    # config, draft, diff, SSE, portalUrl
│   ├── dev/mockData.ts
│   ├── constants.ts
│   ├── types.ts
│   ├── styles.css
│   ├── form-styles.css
│   ├── index.html
│   ├── index.tsx
│   └── App.tsx
├── upload-params.json
├── webpack.config.js
├── tsconfig.json
└── package.json
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Empty grid | No skill entities | Confirm `_skill` entities exist |
| 422 on search | Malformed search body | Ensure `{ query: { combinator, rules } }` (already handled in `api/`) |
| Create/edit fails | Missing request blueprint | Set `skillRequestBlueprint`; confirm `skill_request` blueprint exists |
| "Create with AI" missing | No AI agent configured | Set `aiAgentIdentifier` or rely on the default assistant |
| Theme mismatch in Port | `applyThemeCss()` not applied | Widget calls SDK theme on host path; surfaces use Port tokens in `styles.css` |
| Local dev blank in Port | Wrong dev server port | Use port **9000** (`npm run dev`) |
```

