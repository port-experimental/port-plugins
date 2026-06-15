# Skill Quality Dashboard

A [Port](https://app.getport.io) custom widget for **dashboard** pages. Choose a blueprint that has numeric score properties, configure up to four quality dimensions, and get an at-a-glance overview of average scores across your entire catalog — with a drillable per-entity detail view.

## Preview

The widget has two views:

**Overview** — avg quality score ring, per-dimension averages with mini progress bars, and a searchable/sortable table showing every entity with its overall and per-dimension scores.

**Entity detail** — click any row to see a breakdown card for each configured dimension with score, coloured progress bar, and label.

## Features

- **Blueprint** parameter — works with any blueprint that has numeric score properties
- Up to **four configurable quality dimensions** (label + property name each)
- Optional **group relation** to show a group/team tag per entity in the table
- Avg quality score ring with Great / Good / Needs work / Poor distribution counts
- Searchable and sortable entity table (by score or name) with pagination (15 per page)
- Score colouring: ≥80 green, ≥60 blue, ≥40 amber, <40 red
- Clickable rows drill into an entity detail view with dimension breakdown cards
- Port theme tokens via `@port-labs/plugins-sdk` (`applyThemeCss`)
- `DEV_MOCK` mode for local development without Port credentials

## Prerequisites

### Access

- Port account with permission to add custom widgets and read entities
- Node.js **≥ 20** (see `package.json` `engines`)
- [`@port-labs/port-plugins-cli`](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for upload

### Blueprint setup

Your target blueprint needs **numeric (0–100) properties** for each dimension you want to track. Example for a `skill` blueprint:

| Property identifier        | Type   | Description                        |
|---------------------------|--------|------------------------------------|
| `spec_compliance_score`   | number | Structure / spec compliance score  |
| `discoverability_score`   | number | Findability / discoverability score|
| `clarity_score`           | number | Clarity / instructional quality    |
| `maintainability_score`   | number | Maintenance / ownership score      |

Any blueprint with similar numeric score properties works — not just `skill`.

## Widget parameters

| Key             | Type        | Required | Default                    | Description                                                     |
|-----------------|-------------|----------|----------------------------|-----------------------------------------------------------------|
| `blueprint`     | `blueprint` | Yes      | —                          | Blueprint whose entities are shown                              |
| `dim1_label`    | `string`    | No       | `Structure`                | Label for dimension 1 column and detail card                    |
| `dim1_property` | `string`    | No       | `spec_compliance_score`    | Numeric property identifier for dimension 1 (0–100)            |
| `dim2_label`    | `string`    | No       | `Findability`              | Label for dimension 2                                           |
| `dim2_property` | `string`    | No       | `discoverability_score`    | Numeric property identifier for dimension 2                     |
| `dim3_label`    | `string`    | No       | `Clarity`                  | Label for dimension 3                                           |
| `dim3_property` | `string`    | No       | `clarity_score`            | Numeric property identifier for dimension 3                     |
| `dim4_label`    | `string`    | No       | `Maintenance`              | Label for dimension 4                                           |
| `dim4_property` | `string`    | No       | `maintainability_score`    | Numeric property identifier for dimension 4                     |
| `group_relation`| `string`    | No       | _(empty)_                  | Relation identifier whose value is shown as a group tag per row |

To use fewer than four dimensions, leave the unwanted `dim_label` / `dim_property` pairs empty — the widget skips any dimension where either value is blank.

## Local development

```bash
cd skill-quality-dashboard
npm install
npm run dev
```

Open `http://localhost:9000`. Outside Port's iframe, `DEV_MOCK` supplies five sample entities mapped to the default `skill` blueprint properties. Override `MOCK_ENTITIES` and `MOCK_PARAMS` in `src/dev/mockData.ts` to match your own blueprint.

| File | Purpose |
|------|---------|
| `src/hooks/usePostMessageData.ts` | Port SDK bridge + `DEV_MOCK` gate |
| `src/dev/mockData.ts` | Sample entities and params for local preview |
| `src/utils/config.ts` | Param parsing and score-colour helpers |

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
  --identifier skill-quality-dashboard \
  --title "Skill Quality Dashboard" \
  --params "$(cat upload-params.json)" \
  --description "Multi-dimension quality scores for any Port blueprint" \
  --upsert
```

For CLI install, authentication, and region (`--port-api-base-url`), see [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli).

### Add in Port

1. Open a dashboard page → **Add widget** → **Custom widget**
2. Select **Skill Quality Dashboard** (identifier `skill-quality-dashboard`)
3. Set **Blueprint** to your target blueprint
4. Optionally override dimension labels and property names to match your blueprint
5. Optionally set **Group relation** to surface a team or category tag per row
6. Save the page

## Project structure

```
skill-quality-dashboard/
├── src/
│   ├── api/
│   │   └── entities.ts          # Port entity search (POST /v1/blueprints/{bp}/entities/search)
│   ├── dev/
│   │   └── mockData.ts          # Sample data + params for local preview
│   ├── hooks/
│   │   └── usePostMessageData.ts # Port SDK bridge + DEV_MOCK gate
│   ├── utils/
│   │   └── config.ts            # Param parsing, score colours
│   ├── App.tsx                  # Main component (overview + entity detail)
│   ├── App.css                  # Port theme token styles
│   ├── index.html               # HTML shell
│   ├── index.tsx                # React entry point
│   └── types.ts                 # Shared TypeScript interfaces
├── upload-params.json
├── webpack.config.js
├── tsconfig.json
└── package.json
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Configure the Blueprint parameter" | `blueprint` widget param not set | Set **Blueprint** in widget settings |
| "Configure at least one dimension" | All dim label/property pairs are blank | Set at least `dim1_label` and `dim1_property` |
| All scores show 0 | Property names don't match the blueprint | Check property identifiers in Port's blueprint editor and update widget params |
| No entities shown | Blueprint has no entities | Verify the blueprint has entities in Port's catalog |
| Blank / unstyled UI | Theme not applied | Widget calls `applyThemeCss()` on mount; confirm the widget is embedded inside Port's iframe |
| Group tag missing | Relation not set or wrong key | Set `group_relation` to the exact relation identifier on the blueprint |
