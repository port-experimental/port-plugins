# Scorecard Grid

A colour-coded health grid widget for [Port](https://app.port.io) dashboards. Displays all entities of a blueprint as sized cubes grouped by their scorecard level, with counters, drill-down panels, and a sticky detail sidebar.

## Preview image

<img width="1024" height="458" alt="Scorecard Grid widget showing colour-coded entity cubes grouped by scorecard level" src="https://github.com/port-experimental/port-plugins/blob/main/add-scorecard-grid/scorecard-grid/assets/preview.png" />

## Features

- Entities rendered as colour-coded cubes grouped by scorecard level (e.g. Gold / Silver / Bronze)
- Lowest-rank cubes pulse with a glow animation to draw attention
- Summary bar with configurable emoji counters (e.g. 🪲 bugs, 🐛 vulnerabilities) and level filter buttons
- Click any cube to open a sticky detail sidebar showing:
  - Scorecard rule pass/fail status
  - Stat cards per counter with one-click drill-down to related entities
  - "View in Port" button that navigates to the entity page
- Live polling at a configurable interval
- Light/dark theme support via Port SDK

## Prerequisites

### Access

- Port account with permission to add custom plugins and read the blueprints this widget uses
- Node.js **≥ 20** (see `package.json` `engines`)
- [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for upload

### Blueprints & properties

The main blueprint (set via the `blueprint` param) must have:

| Requirement | Details |
|-------------|---------|
| Scorecard | At least one scorecard attached (see **Scorecards** below) |
| Counter properties | One **number** property per `counters[n].property` entry (e.g. `open_bug_count`) |
| Icon property (optional) | A **string** property for `iconProperty` (e.g. `language`) — used for simple-icons lookup on cubes |

Drill-down blueprints need the properties referenced in each `drillDown[n].include` array and any `query.rules` filters.

### Relations

Each `drillDown[n].blueprint` must have a relation **back to the main blueprint**. The widget injects a `relatedTo` filter for the selected entity at runtime — you do not pass relation keys as plugin params.

| Relation | Source blueprint | Target blueprint | Required | Usage |
|----------|------------------|------------------|----------|-------|
| `service` (example) | `jira_bug` | `service` | yes | Bugs drill-down links bugs to the grid entity |
| `service` (example) | `security_vulnerability` | `service` | yes | Vulnerabilities drill-down links findings to the grid entity |

See `examples/blueprints/` for a full sample catalog.

### Scorecards / rules

Attach a scorecard to the main blueprint with **levels** (title + colour) and **rules** that determine each entity's level. The widget reads the scorecard via `scorecardIdentifier` and groups cubes by level. Entities with varying rule pass/fail states will appear in different level groups.

Example: [`examples/scorecard.json`](examples/scorecard.json) on blueprint `service` with identifier `production_readiness`.

## Widget parameters

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `blueprint` | blueprint | yes | — | Blueprint whose entities to display |
| `scorecardIdentifier` | string | yes | — | Identifier of the scorecard on that blueprint |
| `counters` | array | yes | — | Counter badges. Each item: `{"emoji":"🪲","label":"Bugs","property":"open_bug_count"}` |
| `drillDown` | array | yes | — | Drill-down sections. Each item: `{"label":"Bugs","blueprint":"jira_bug","query":{"combinator":"and","rules":[]},"include":["$title","priority"]}`. A `relatedTo` filter for the selected entity is always injected automatically. |
| `pollIntervalSeconds` | number | no | 60 | How often to re-fetch data from Port (seconds) |
| `iconProperty` | string | no | — | Property key for icon lookup (e.g. `language`) via simple-icons; falls back to entity title/identifier when unset |

## Local development

```bash
cd scorecard-grid
npm install
npm run dev   # http://localhost:9000
```

Configure mock data in `src/hooks/usePluginData.ts` — edit `DEV_PARAMS` to simulate the values you'd set in Port. Set `PORT_TOKEN` and `PORT_API_BASE_URL` environment variables (via a `.env` file) for the widget to call the real Port API in dev mode.

Entity and portal links built from mock identifiers do **not** work at `http://localhost:9000` outside Port's iframe — there is no `document.referrer` and mock IDs are not real catalog entities. Validate links via Port **Local development** (iframe) or after deploy.

## Setup

### Build

```bash
npm install
npm run build   # output: dist/index.html
git add dist/index.html   # commit the upload artifact (tracked in repo)
```

### Upload

```bash
port-plugins upload \
  --file dist/index.html \
  --identifier scorecard-grid-port-plugin \
  --title "Scorecard Grid" \
  --params "$(cat upload-params.json)" \
  --description "Colour-coded health grid for blueprint entities grouped by scorecard level" \
  --upsert
```

See [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for CLI install and credential setup.

### Add in Port

1. Go to a dashboard page → **Edit** → **Add widget** → **Custom widget**
2. Select **Scorecard Grid**
3. Set `blueprint` to the blueprint you want to visualize
4. Set `scorecardIdentifier` to the scorecard's identifier
5. Define `counters` — one object per numeric property you want shown as a badge (e.g. `[{"emoji":"🪲","label":"Bugs","property":"open_bug_count"}]`)
6. Define `drillDown` — one object per counter, pointing to a related blueprint whose entities you want to drill into
7. Optionally set `pollIntervalSeconds` (default: 60)
8. Optionally set `iconProperty` to a string property on the main blueprint (e.g. `language`)
9. Save

## Examples

The `examples/` folder contains a full sample setup: three blueprints, matching entities, a scorecard, and widget params.

### Blueprints

| File | Purpose |
|------|---------|
| [`examples/blueprints/service.json`](examples/blueprints/service.json) | Main blueprint — counter properties and relations to drill-down targets |
| [`examples/blueprints/jira_bug.json`](examples/blueprints/jira_bug.json) | Bug blueprint used by the Bugs drill-down |
| [`examples/blueprints/security_vulnerability.json`](examples/blueprints/security_vulnerability.json) | Vulnerability blueprint used by the Vulnerabilities drill-down |

### Entities

Sample catalog data that works with the scorecard and drill-down queries. Each bug/vulnerability points to its service via a `service` relation — that's the only link the drill-down needs.

| File | Entities |
|------|----------|
| [`examples/entities/service.json`](examples/entities/service.json) | `payment-api`, `user-service`, `legacy-batch` — varying scorecard levels and counter values |
| [`examples/entities/jira_bug.json`](examples/entities/jira_bug.json) | Bugs linked to `payment-api` and `legacy-batch` |
| [`examples/entities/security_vulnerability.json`](examples/entities/security_vulnerability.json) | Vulnerabilities linked to `payment-api` and `legacy-batch` |

### Widget configuration

| File | Purpose |
|------|---------|
| [`examples/scorecard.json`](examples/scorecard.json) | Scorecard on the `service` blueprint — levels and rules the widget reads |
| [`examples/counters.json`](examples/counters.json) | Widget `counters` param — maps emoji badges to blueprint properties |
| [`examples/drilldown.json`](examples/drilldown.json) | Widget `drillDown` param — one section per counter, with optional extra query filters |
| [`examples/widget-params.json`](examples/widget-params.json) | Full widget configuration you can paste into Port |

`drillDown[n]` index matches `counters[n]` — the first drill-down section opens when you click the first counter stat card. The widget always injects a `relatedTo` filter for the selected entity, so drill-down targets only need a relation back to the main blueprint (e.g. `jira_bug` → `service`). Add extra rules in `query` only when you want to narrow results further (e.g. `status != Done` for open bugs only).

## Project structure

```
scorecard-grid/
  assets/
    preview.png
  dist/
    index.html
  src/
    components/
      Cube.tsx          # Individual entity cube
      DetailPanel.tsx   # Sticky sidebar with rules + stat cards
      DrillDown.tsx     # Related-entity list inside the sidebar
      EntityIcon.tsx    # simple-icons lookup with initials fallback
    hooks/
      usePluginData.ts  # SDK wrapper + DEV_MOCK params
    api.ts              # fetchAll (scorecard + entities) and fetchDrillDownItems
    App.tsx             # Layout: nav, summary bar, cube grid, detail aside
    App.css             # All styles — uses Port theme CSS variables with fallbacks
    constants.ts        # Port colour → hex map and hexToRgba helper
    types.ts            # PluginConfig, Entity, ScorecardLevel, etc.
  upload-params.json
  examples/
    blueprints/
      service.json
      jira_bug.json
      security_vulnerability.json
    entities/
      service.json
      jira_bug.json
      security_vulnerability.json
    scorecard.json
    counters.json
    drilldown.json
    widget-params.json
  webpack.config.js
  tsconfig.json
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Widget configuration is incomplete" | Required params not set | Ensure `blueprint`, `scorecardIdentifier`, `counters`, and `drillDown` are all configured |
| All cubes show the same level | Scorecard has no rules or all entities pass/fail identically | Verify the scorecard has rules and entities have varying compliance |
| Drill-down shows "No items found" | No related entities match the query | Check `drillDown[n].blueprint` and that related entities have a relation pointing to the selected service |
| Port API error in error banner | Auth failure or wrong identifiers | Verify `blueprint` and `scorecardIdentifier`; confirm the token has read access |
| Counters always show 0 | Wrong property key in `counters[n].property` | Check the exact property identifier on your blueprint |
