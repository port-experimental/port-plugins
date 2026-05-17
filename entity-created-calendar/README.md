# Entity Created Calendar

A [Port](https://app.getport.io) custom widget that shows a month calendar for a chosen blueprint. Days that have at least one entity are highlighted; clicking a marked day opens a modal listing each entity’s **title** and **identifier**, with a link to open the entity in Port.

Works on **dashboards** (configure the blueprint parameter). Uses each entity’s Port **`createdAt`** timestamp by default, or a custom datetime property when you set **Created date property**.

## Features

- Month calendar with previous / next navigation and **Today**
- Marks days from entity creation dates
- Badge shows how many entities were created that day
- Modal with title, identifier, and **Open** link to the entity page
- Respects Port light/dark theme via `@port-labs/plugins-sdk`

## Prerequisites

- Port account with permission to add custom widgets and read entities for the configured blueprint
- Node.js **≥ 20** (see `package.json` `engines`)

## Widget parameters

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `blueprint` | `blueprint` | Yes | — | Blueprint whose entities appear on the calendar |
| `createdDateProperty` | `string` | No | *(uses `createdAt`)* | Optional property key on the entity (e.g. `createdDate`) when creation time is not on `createdAt` |

## Local development

```bash
cd entity-created-calendar
npm install
npm run dev
```

Open `http://localhost:9000`. Outside Port’s iframe, the widget uses **dev mock** data (see `src/hooks/usePostMessageData.ts` and `src/api/entities.ts`).

In Port: edit the custom widget → enable **Local development** to load `localhost:9000`.

## Setup

### Catalog

No catalog changes are required if your blueprint entities expose **`createdAt`** (Port’s standard creation timestamp). If you use a custom field, add a **datetime** property and set **Created date property** to its key.

### Build

```bash
npm install
npm run build
```

Artifact: **`dist/index.html`**

### Upload

```bash
port-plugins upload \
  --file dist/index.html \
  --identifier entity-created-calendar \
  --title "Entity Created Calendar" \
  --params "$(cat upload-params.json)" \
  --upsert
```

Install and authenticate the CLI per [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli).

### Add in Port

1. Dashboard → **+ Widget** → **Custom widget**
2. Select **Entity Created Calendar**
3. Choose the **Blueprint** (and optional **Created date property**)
4. Save

## Project structure

```
entity-created-calendar/
  upload-params.json
  package.json
  webpack.config.js
  tsconfig.json
  src/
    App.tsx
    App.css
    index.tsx
    index.html
    types.ts
    api/entities.ts
    components/Calendar.tsx
    components/EntityModal.tsx
    hooks/usePostMessageData.ts
    hooks/useCalendarEntities.ts
    utils/config.ts
    utils/dates.ts
    utils/entityDates.ts
    utils/portalUrl.ts
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|--------|-----|
| Blank iframe | Root height not set | Ensure `App.css` sets `height: 100%` on `html`, `body`, `#plugin-root` |
| No marked days | Wrong date field | Set **Created date property** or ensure entities have `createdAt` |
| API 422 on search | Malformed search body | Body must use `{ query: { combinator, rules } }` (already handled in `api/entities.ts`) |
| “Configure Blueprint” | Param missing | Set the blueprint parameter on the widget instance |
| Links open wrong region | Referrer missing in dev | Expected locally; in Port, links use `document.referrer` origin |
