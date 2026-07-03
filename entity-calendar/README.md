# Entity Calendar

A [Port](https://app.getport.io) custom widget that shows a month calendar for a chosen blueprint. Days with at least one entity are highlighted using each entity’s creation date. Click a marked day to open a modal listing **title** and **identifier**, with a link to the entity page in Port.

Designed for **dashboard** pages (not entity-scoped).

## Preview image

<img width="1266" height="1212" alt="Entity Calendar widget" src="https://github.com/port-experimental/port-plugins/blob/main/entity-calendar/assets/preview.png" />

## Badges

Dashboard · React 19 · TypeScript · [Port Plugins](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins)

## Features

- Native **blueprint** parameter to choose which entities to load
- Marks calendar days from entity `createdAt` or an optional blueprint **datetime** property
- Month navigation and **Today** shortcut (today highlighted in blue)
- Modal with entity title, identifier, and **Open in Port** link
- Respects Port light/dark theme via `@port-labs/plugins-sdk`
- Respects dashboard **page filters** via `mergePageFilters` — passes the **full** blueprint object from the widget param (so `$team` filters apply when the blueprint has `ownership`)

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
| `createdDateProperty` | `string` | No | `createdAt` | Blueprint property identifier for the calendar date. When empty, uses entity `createdAt`. When set, only that property is used (no fallback to `createdAt`). |
| `weekStartsOnMonday` | `boolean` | No | `false` | When enabled, the calendar week starts on Monday; otherwise Sunday. |

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

**Portal links:** “Open in Port” in the entity modal uses mock fixture identifiers and `https://app.port.io` when there is no `document.referrer`. At `http://localhost:9000` outside Port’s iframe those URLs are for UI layout only — they will not open real catalog entities. Validate links with Port’s **Local development** toggle (iframe + real `PLUGIN_DATA`) or after deploy.

Enable Port **Local development** on the widget to test real `postMessage`, API calls, and entity links in the portal.

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
  --identifier entity-calendar-port-plugin \
  --title "Entity Calendar" \
  --params "$(cat upload-params.json)" \
  --description "Show amount of entities based on date field" \
  --upsert
```

CLI install, auth, and region: [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli).

### Add in Port

1. Dashboard → **Add widget** → **Custom widget**
2. Select **Entity Calendar**
3. Set **Blueprint** to your target blueprint
4. Optionally set **Datetime property** if dates live on a custom field
5. Optionally enable **Week starts on Monday** for a Monday-first calendar grid

### Entity-page behaviour

N/A — this widget is intended for dashboards. It does not require `PLUGIN_DATA.entity`.

## Project structure

```
entity-calendar/
├── src/
│   ├── api/entities.ts          # search + mergePageFilters
│   ├── components/Calendar.tsx
│   ├── components/EntityModal.tsx
│   ├── hooks/useCalendarEntities.ts
│   ├── hooks/usePostMessageData.ts
│   ├── dev/mockData.ts
│   ├── utils/config.ts          # params → PluginConfig (full blueprint object)
│   ├── utils/dates.ts
│   ├── utils/entityDates.ts
│   ├── utils/portalUrl.ts
│   ├── types.ts
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
| Entity link 404 or wrong org in local dev | Mock IDs + no referrer at `localhost:9000` | Expected outside Port’s iframe; test links via Port **Local development** or after deploy |
| Local dev blank in Port | Wrong dev server port | Use port **9000** (`npm run dev`); Port Local development expects `http://localhost:9000` |
| Theme mismatch in Port | `applyThemeCss()` not applied | Widget calls SDK theme on host path; surfaces use Port tokens in `App.css` `:root` |
| Calendar empty in local dev | No mock entities | `DEV_MOCK` returns sample entities from `src/dev/mockData.ts` when not in Port’s iframe |
| Page filters ignored (e.g. `$team`) | Only `{ identifier }` passed to `mergePageFilters` | Pass the full blueprint from `params.blueprint.value` via `config.blueprint` (see `utils/config.ts`) |
| Fewer entities than dashboard table | Page filters applied to search | Expected — calendar search respects the same filters as other dashboard widgets |
