# Skill View

A [Port](https://app.getport.io) custom widget for **skill entity pages**. It renders a skill's authored content — `SKILL.md` plus grouped references, scripts, and assets — as a file navigator with a markdown/raw content pane, and shows status and scope badges from the entity.

Designed for **entity** pages scoped to a skill blueprint.

## Preview image

<img alt="Skill View widget" src="https://github.com/port-experimental/port-plugins/blob/main/skill-view/assets/preview.png" />

## Badges

Entity page · React 19 · TypeScript · [Port Plugins](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins)

## Features

- File navigator grouping `SKILL.md`, **References**, **Scripts**, and **Assets**
- Markdown rendering (GFM) for `.md` files; raw content for other files
- Status badges (Active / Deprecated / Draft) and scope badges (Global / Project) from entity properties
- Resolves the latest skill version and its files at runtime via the Port API
- Respects Port light/dark theme via `@port-labs/plugins-sdk`
- Loading, empty, and error states with retry

## Prerequisites

### Access

- Port account with permission to add custom widgets and read entities
- Node.js **≥ 20** (see `package.json` `engines`)
- [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for upload

### Catalog

The widget reads a skill's files by traversing the skill data model:

| Blueprint | Role |
|-----------|------|
| `_skill` (or your skill blueprint) | Host entity the widget is embedded on |
| `_skill_version` | Versions related to a skill via `skill_version_to_skill` |
| `_skill_file` | File content related to a version via `skill_file_to_skill_version` |

`_skill_file` entities are expected to expose `path` and `content` properties. The default blueprint identifier is `_skill`; override with the `skillBlueprint` parameter if yours differs.

## Widget parameters

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `skillBlueprint` | `string` | No | `_skill` | Blueprint identifier for skills, used when the widget cannot infer it from the host entity. |

## Local development

```bash
cd skill-view
npm install
npm run dev
```

Open `http://localhost:9000` (webpack `devServer.port: 9000` — required for Port **Local development** iframe mode). Outside Port's iframe, `DEV_MOCK` supplies a token, a sample skill entity, and mock file content.

| File | Purpose |
|------|---------|
| `src/hooks/usePostMessageData.ts` | Host bridge + `DEV_MOCK` gate |
| `src/api/skills.ts` | Version/file search + mock content |

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
  --identifier skill-view \
  --title "Skill View" \
  --params "$(cat upload-params.json)" \
  --description "File-navigator viewer for a skill entity (SKILL.md, references, scripts, assets)" \
  --upsert
```

CLI install, auth, and region: [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli).

### Add in Port

1. Open a skill entity page → **Edit page** → **Add widget** → **Custom widget**
2. Select **Skill View**
3. Optionally set **Skill blueprint** if your identifier is not `_skill`

### Entity-page behaviour

Requires `PLUGIN_DATA.entity`. When embedded on a non-skill page (no host entity), it prompts to embed on a skill entity.

## Project structure

```
skill-view/
├── src/
│   ├── api/skills.ts             # version + file search, dev mock content
│   ├── hooks/usePostMessageData.ts
│   ├── types.ts
│   ├── styles.css
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
| "Embed this widget on a skill entity page" | No host entity | Add the widget to a skill entity page, not a dashboard |
| Empty state | No version or files for the skill | Confirm `_skill_version` / `_skill_file` entities exist and relations are set |
| 422 on search | Malformed search body | Ensure `{ query: { combinator, rules } }` (already handled in `api/skills.ts`) |
| Wrong blueprint | Custom skill blueprint identifier | Set the `skillBlueprint` parameter |
| Theme mismatch in Port | `applyThemeCss()` not applied | Widget calls SDK theme on host path; surfaces use Port tokens in `styles.css` |
| Local dev blank in Port | Wrong dev server port | Use port **9000** (`npm run dev`) |
```

