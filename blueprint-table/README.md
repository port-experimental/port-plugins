# Blueprint Table

A multi-blueprint entity table widget for [Port](https://app.port.io) dashboards. Displays entities from up to five blueprints in a tabbed table with configurable columns, search, column picker, and drag-to-reorder columns. Respects dashboard page filters.

## Preview image

<img width="2000" height="503" alt="Blueprint Table widget" src="https://github.com/port-experimental/port-plugins/blob/library-prep/blueprint-table/assets/preview.png" />

## Features

- Up to 5 blueprint tabs with entity counts
- Per-tab column picker (show/hide properties, relations, metadata)
- Drag-to-reorder columns within each tab
- Real-time search filtering across visible entities
- Clickable entity identifier and title links open the entity page in Port
- Respects dashboard page-level filters (team, custom)
- Horizontal and vertical scroll with visible native scrollbars
- Light/dark theme support via Port SDK

## Prerequisites

### Access

A Port user account with at least **viewer** access to the blueprints you configure.

### Blueprints & properties

No new blueprints are required. Configure the widget with the identifiers of blueprints that already exist in your catalog. The widget fetches property schemas at runtime via `GET /v1/blueprints`.

## Widget parameters

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `blueprint1` | blueprint | yes | — | First blueprint tab |
| `blueprint1_properties` | string | no | all | Comma-separated property keys to show as columns (e.g. `status,owner,tier`) |
| `blueprint2` | blueprint | no | — | Second blueprint tab |
| `blueprint2_properties` | string | no | all | Columns for blueprint 2 |
| `blueprint3` | blueprint | no | — | Third blueprint tab |
| `blueprint3_properties` | string | no | all | Columns for blueprint 3 |
| `blueprint4` | blueprint | no | — | Fourth blueprint tab |
| `blueprint4_properties` | string | no | all | Columns for blueprint 4 |
| `blueprint5` | blueprint | no | — | Fifth blueprint tab |
| `blueprint5_properties` | string | no | all | Columns for blueprint 5 |

When `blueprint*_properties` is omitted all properties are included. Columns always include `identifier`, `title`, `blueprint`, and `updatedAt`.

## Local development

```bash
cd blueprint-table
npm install
npm run dev   # http://localhost:9000
```

Mock data is configured at the top of `src/hooks/usePostMessageData.ts`. Set `MOCK_ENTITY_ID` and `MOCK_ENTITY_BLUEPRINT` to preview entity-page context.

## Setup

### Build

```bash
npm install
npm run build   # output: dist/index.html
```

### Upload

```bash
port-plugins upload \
  --file dist/index.html \
  --identifier blueprint-table-port-plugin \
  --title "Blueprint Table" \
  --params "$(cat upload-params.json)" \
  --upsert
```

See [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for CLI install and credential setup.

### Add in Port

1. Go to a dashboard page → **Edit** → **Add widget** → **Custom widget**
2. Select **Blueprint Table**
3. Set at least `blueprint1` to a blueprint from your catalog
4. Optionally set `blueprint1_properties` to limit displayed columns
5. Save

## Project structure

```
blueprint-table/
  src/
    components/
      EntityCatalogue/
        EntityCatalogue.tsx   # Main component
        EntityCatalogue.css   # Scoped styles + scrollbar fix
        EntityTable.tsx       # Table renderer with drag-reorder
        TabBar.tsx            # Blueprint tabs + search bar
        ColumnPicker.tsx      # Show/hide column overlay
        types.ts              # Column, Blueprint, Tab types
    hooks/
      useBlueprints.ts        # Fetches blueprint schemas
      useEntities.ts          # Fetches entities with page-filter merge
      entitiesSearch.ts       # Generic entities/search hook
      entityCatalogueUtils.ts # Value formatting helpers
    utils/
      portEntityUrl.ts        # Entity page URL via document.referrer
    types.ts                  # Entity shape
    App.tsx
    index.tsx
  upload-params.json
  webpack.config.js
  tsconfig.json
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Tab shows 0 entities | Blueprint identifier wrong or no entities | Verify blueprint exists; check Port API response in browser devtools |
| Columns not showing expected properties | `blueprint*_properties` has a typo | Use exact property keys from `GET /v1/blueprints/{id}` |
| Search doesn't filter | Filtered on client-side after fetch | Search matches identifier, title, and string property values |
| No scrollbars visible | Previous `scrollbar-width: none` bug | Already fixed; both axes use `scrollbar-width: thin` |
| Entity links open wrong region | `document.referrer` unavailable in dev | Expected in local dev; works correctly inside Port iframe |
| Port API error surfaced | Network or auth issue | Error message includes full API response body for diagnosis |
