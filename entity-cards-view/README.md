# Entity Cards View

A [Port](https://app.port.io) custom widget for **dashboard** pages. Pick a blueprint, browse entities as cards with **search by title**, **pagination**, and a **Manage properties** panel to choose which blueprint properties appear on each card.

Dashboard **page filters** are merged into entity search when present.

## Preview image
<img width="2340" height="1470" alt="Entity Cards View widget" src="https://github.com/port-experimental/port-plugins/blob/main/entity-cards-view/assets/preview.png" />

## Features

- **Blueprint** parameter to scope entities
- **Search** by entity title and property values (e.g. typing `active` finds entities whose Status is `active`; case-insensitive)
- **Pagination** (12 entities per page) with previous/next controls
- **Manage properties** — Port-style **Shown** / **Hidden** lists with search, drag-and-drop order for card properties, and per-blueprint **array** (count vs list items) and **boolean** (pill vs labeled) display options; persisted in browser `localStorage`
- Scrollable card grid with Port-style surfaces, borders, and typography
- Entity titles use neutral text (not accent-colored); links open the Port entity page
- **Booleans** render as labeled rows by default (property name + status pill), or as footer pills only when configured in **Manage properties**; **enums** and sentiment fields (e.g. Status, Type, Priority) render as colored pills in the property list
- **Arrays** — default to count on cards; switch to list items in **Manage properties**
- **Refresh** in the toolbar and on each card
- **Multilingual UI** (en, he, fr, de, es, pt) — follows Port user locale when provided, else browser language; RTL for Hebrew
- **Coordinated enum colors** — the same value gets the same pill color on every property (e.g. `active` and `Automatic` are green, `inactive` is red, `Approval Required` is orange); works across languages (values are shown as stored in Port, not translated)
- Loading, empty, and error states
- Port theme via `@port-labs/plugins-sdk` (`applyThemeCss`)
- Icons via [lucide-react](https://lucide.dev/)

## Prerequisites

### Access

- Port account with permission to add custom widgets and read entities and blueprints
- Node.js **≥ 20** (see `package.json` `engines`)
- [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for upload

### Blueprints & properties

| Requirement | Details |
|-------------|---------|
| Blueprint | Any blueprint with entities you want to display as cards |
| Properties | Optional — the widget loads the blueprint schema and lets operators pick properties to show |
| Entities | Loaded via `POST /v1/blueprints/{blueprint}/entities/search` |

## Widget parameters

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `blueprint` | `blueprint` | Yes | — | Blueprint whose entities are shown as cards |

## Local development

```bash
cd entity-cards-view
npm install
npm run dev
```

Open `http://localhost:9000` (webpack `devServer.port: 9000` — required for Port **Local development** iframe mode). Outside Port’s iframe, `DEV_MOCK` supplies a sample blueprint, properties, and entities.

| File | Purpose |
|------|---------|
| `src/hooks/usePostMessageData.ts` | Host bridge + `DEV_MOCK` gate |
| `src/dev/mockData.ts` | Sample blueprint, properties, and entities |

**Portal links:** Card links use mock fixture identifiers and `https://app.port.io` when there is no `document.referrer`. At `http://localhost:9000` outside Port’s iframe those URLs are for UI layout only. Validate links with Port’s **Local development** toggle (iframe + real `PLUGIN_DATA`) or after deploy.

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
  --identifier entity-cards-view-port-plugin \
  --title "Entity Cards View" \
  --params "$(cat upload-params.json)" \
  --description "Paginated entity cards with search and configurable properties" \
  --upsert
```

CLI install, auth, and region: [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli).

### Add in Port

1. Dashboard → **Add widget** → **Custom widget**
2. Select **Entity Cards View**
3. Set **Blueprint** to your target blueprint
4. Use **Manage properties** to choose fields on each card

### Entity-page behaviour

N/A — this widget is intended for dashboards. It does not require `PLUGIN_DATA.entity`.

## Project structure

```
entity-cards-view/
├── upload-params.json
├── webpack.config.js
├── package.json
└── src/
    ├── App.tsx
    ├── api/                 # blueprint schema + entity search
    ├── components/          # cards, toolbar, manage properties, pagination
    ├── dev/mockData.ts
    ├── hooks/
    └── utils/               # config, portal URLs, property formatting, storage
```

## Troubleshooting

| Symptom | Likely cause | What to do |
|---------|----------------|------------|
| “Configure Blueprint” | Widget param not set | Set the blueprint parameter in the widget config |
| No properties in Manage panel | Blueprint has no custom properties | Add properties to the blueprint schema in Port |
| Search returns nothing | No title match or page filters | Clear search; check dashboard page filters |
| API errors | Token or permissions | Confirm the widget can read entities on the blueprint |
