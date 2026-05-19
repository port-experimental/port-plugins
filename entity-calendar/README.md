# Entity Calendar

A Port custom widget that shows a month calendar for a chosen blueprint. Days with at least one entity are highlighted using each entity’s creation date. Click a marked day to open a modal listing **title** and **identifier**, with a link to the entity page in Port.

Designed for **dashboard** pages (not entity-scoped).

## Preview image

<img width="653" height="623" alt="image" src="https://github.com/user-attachments/assets/7afdf1eb-282b-4d3c-b796-4f2744927a42" />


## Features

- Native **blueprint** parameter to choose which entities to load
- Marks calendar days from entity `createdAt`, optional `createdDate` property, or a custom datetime property
- Month navigation and **Today** shortcut
- Modal with entity title, identifier, and **Open in Port** link
- Respects Port light/dark theme via `@port-labs/plugins-sdk`

## Prerequisites

### Access

- Port account with permission to add custom widgets and read entities
- Node.js **≥ 20** (see `package.json` `engines`)
- [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for upload

### Catalog

| Concept | Requirement |
|---------|-------------|
| Blueprint | Any blueprint with entities you want on the calendar |
| Date field | Port sets `createdAt` on every entity; optional `datetime` property (e.g. `createdDate`) if you override via parameter |

## Widget parameters

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `blueprint` | `blueprint` | Yes | — | Blueprint whose entities appear on the calendar |
| `createdDateProperty` | `string` | No | *(empty)* | Blueprint property identifier for the calendar date. When empty, uses entity `createdAt`. When set, only that property is used (no fallback to `createdAt`). |

## Local development

```bash
cd entity-calendar
npm install
npm run dev
```

Open `http://localhost:9000` (webpack `devServer.port: 9000` — required for Port **Local development** iframe mode). Outside Port’s iframe, `DEV_MOCK` supplies token, a sample blueprint param, and dated entities.

| File | Purpose |
|------|---------|
| `src/hooks/usePostMessageData.ts` | Host bridge + `DEV_MOCK` gate |
| `src/dev/mockData.ts` | Blueprint param and sample entities for the calendar |

Enable Port **Local development** on the widget to test real `postMessage` and API calls in the portal.

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
  --identifier entity-calendar \
  --title "Entity Calendar" \
  --params "$(cat upload-params.json)" \
  --upsert
```

CLI install, auth, and region: [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli).

### Add in Port

1. Dashboard → **Add widget** → **Custom widget**
2. Select **Entity Calendar**
3. Set **Blueprint** to your target blueprint
4. Optionally set **Datetime property** if dates live on a custom field

### Entity-page behaviour

N/A — this widget is intended for dashboards. It does not require `PLUGIN_DATA.entity`.

## Project structure

```
entity-calendar/
├── src/
│   ├── api/entities.ts
│   ├── components/Calendar.tsx
│   ├── components/EntityModal.tsx
│   ├── hooks/useCalendarEntities.ts
│   ├── hooks/usePostMessageData.ts
│   ├── dev/mockData.ts
│   ├── utils/
│   ├── App.tsx
│   └── App.css
├── upload-params.json
├── webpack.config.js
└── package.json
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Empty calendar | No entities or no parseable dates | Confirm entities exist; check `createdAt` or set `createdDateProperty` |
| 422 on search | Malformed search body | Ensure `{ query: { combinator, rules } }` (already handled in `api/entities.ts`) |
| “Configure Blueprint” | Param missing in widget instance | Set the blueprint parameter in Port |
| Wrong portal link region | Empty `document.referrer` in dev | Test inside Port iframe; EU/US links follow referrer origin |
| Local dev blank in Port | Wrong dev server port | Use port **9000** (`npm run dev`); Port Local development expects `http://localhost:9000` |
| Theme mismatch in Port | `applyThemeCss()` not applied | Widget calls SDK theme on host path; surfaces use Port tokens in `App.css` `:root` |
| Calendar empty in local dev | No mock entities | `DEV_MOCK` returns sample entities from `src/dev/mockData.ts` when not in Port’s iframe |
