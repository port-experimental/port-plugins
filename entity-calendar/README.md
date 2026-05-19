# Entity Calendar

A Port custom widget that shows a month calendar for a chosen blueprint. Days with at least one entity are highlighted using each entity’s creation date. Click a marked day to open a modal listing **title** and **identifier**, with a link to the entity page in Port.

Designed for **dashboard** pages (not entity-scoped).

## Preview image

N/A — add a screenshot under `docs/` after first deploy in Port and link it here.

## Features

- Native **blueprint** parameter to choose which entities to load
- Marks calendar days from entity `createdAt`, optional `createdDate` property, or a custom datetime property
- Month navigation and **Today** shortcut
- Modal with entity title, identifier, and **Open in Port** link
- Respects Port light/dark theme via `@port-labs/plugins-sdk`

## Prerequisites

- Port account with permission to add custom widgets and read entities
- Node.js **≥ 20** (see `package.json` `engines`)
- [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for upload

## Widget parameters

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `blueprint` | `blueprint` | Yes | — | Blueprint whose entities appear on the calendar |
| `createdDateProperty` | `string` | No | *(see below)* | Optional blueprint property identifier for the date used on the calendar |

When `createdDateProperty` is set, only that property is used for the date, otherwise it will use entity system field `createdAt`

## Local development

```bash
cd entity-calendar
npm install
npm run dev
```

Open `http://localhost:9000`. Outside Port’s iframe, the dev mock supplies API base URL, token, and a sample `blueprint` param. Edit `src/hooks/usePostMessageData.ts` to adjust mock values.

Enable Port **Local development** on the widget to point at your dev server while testing in the portal.

## Setup

### Catalog

| Concept | Requirement |
|---------|-------------|
| Blueprint | Any blueprint with entities you want on the calendar |
| Date field | Port sets `createdAt` on every entity; optional `datetime` property (e.g. `createdDate`) if you override via parameter |

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
