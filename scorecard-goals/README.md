# Scorecard Goals

A [Port](https://app.getport.io) custom widget for **dashboard** pages. Choose a blueprint, then see a progress bar for each scorecard on that blueprint showing what share of entities **passed every rule** in that scorecard.

Compliance is computed from entity search results: for each entity, every rule on the scorecard must have a passing status (for example `Passed`). Dashboard **page filters** are merged into the entity search when present.

## Preview image

<img width="1213" height="593" alt="image" src="https://github.com/user-attachments/assets/de622d9e-bd95-48f2-9ff4-8e7f57daeea9" />


## Features

- **Blueprint** parameter to scope entities and scorecards
- One horizontal bar per scorecard with pass percentage
- **Show gaps for completion** opens a modal listing entities that did not pass all rules, with the specific rules (and scorecard) still failing
- Counts of entities that passed all rules vs total entities
- Respects dashboard page filters via `mergePageFilters`
- Loading, empty, and error states
- Port theme tokens via `@port-labs/plugins-sdk` (`applyThemeCss`) and shared widget CSS (`App.css`)
- Icons via [lucide-react](https://lucide.dev/)

## Prerequisites

### Access

- Port account with permission to add custom widgets and read entities and scorecards
- Node.js **≥ 20** (see `package.json` `engines`)
- [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for upload

### Scorecards

| Requirement | Details |
|-------------|---------|
| Blueprint | Any blueprint with entities and scorecards you want to summarize |
| Scorecards | At least one scorecard defined on the chosen blueprint ([Scorecards](https://docs.port.io/scorecards/overview)) |
| Rules | Each scorecard should have one or more rules; scorecards with zero rules show as not applicable |
| Entities | Entities on the blueprint are loaded via `POST /v1/blueprints/{blueprint}/entities/search` |

## Widget parameters

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `blueprint` | `blueprint` | Yes | — | Blueprint whose entities and scorecards are summarized |

## Local development

```bash
cd scorecard-goals
npm install
npm run dev
```

Open `http://localhost:9000` (webpack `devServer.port: 9000` — required for Port **Local development** iframe mode). Outside Port’s iframe, `DEV_MOCK` supplies a sample blueprint, scorecards, and entities with mixed rule results.

| File | Purpose |
|------|---------|
| `src/hooks/usePostMessageData.ts` | Host bridge + `DEV_MOCK` gate |
| `src/dev/mockData.ts` | Sample blueprint, scorecards, and entities |

**Portal links:** Entity links in the gaps modal use mock fixture identifiers and `https://app.port.io` when there is no `document.referrer`. At `http://localhost:9000` outside Port’s iframe those URLs are for UI layout only — they will not open real catalog entities. Validate links with Port’s **Local development** toggle (iframe + real `PLUGIN_DATA`) or after deploy.

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
  --identifier scorecard-goals-port-plugin \
  --title "Scorecard goals" \
  --params "$(cat upload-params.json)" \
  --description "Per-scorecard compliance bars for a chosen blueprint" \
  --upsert
```

For CLI install, authentication, and region (`--port-api-base-url`), see [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli).

### Add in Port

1. Open a dashboard page → **Add widget** → **Custom widget**
2. Select **Scorecard goals** (identifier `scorecard-goals`)
3. Set **Blueprint** to the catalog blueprint you want to track
4. Save the page

### Entity-page behaviour

N/A — this widget is intended for dashboards. It does not require `PLUGIN_DATA.entity`.

## Project structure

```
scorecard-goals/
├── src/
│   ├── api/              # Port REST: scorecards + entity search
│   ├── components/       # Bars, loading, empty, error, gaps modal
│   ├── dev/mockData.ts   # Local preview data
│   ├── hooks/
│   ├── utils/            # Config + compliance math
│   ├── App.tsx
│   └── App.css
├── upload-params.json
├── webpack.config.js
└── package.json
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| “Configure the Blueprint parameter” | Widget param not set | Set **Blueprint** in widget settings |
| No scorecards shown | Blueprint has no scorecards | Create scorecards for that blueprint in Port |
| 0% for all bars | Entities missing scorecard evaluations | Confirm entities exist and scorecards are active |
| Counts ignore dashboard filters | Page filters not applied | Widget merges `page.pageFilters` into entity search; confirm filters are set on the dashboard page |
| API 422 on search | Malformed query body | Ensure search uses `{ query: { combinator, rules } }` |
| Blank / unstyled UI | Theme not applied | Widget uses `applyThemeCss()` when embedded in Port |
| Entity link 404 or wrong org in local dev | Mock IDs + no referrer at `localhost:9000` | Expected outside Port’s iframe; test links via Port **Local development** or after deploy |
