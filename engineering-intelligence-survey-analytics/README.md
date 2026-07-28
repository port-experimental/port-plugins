# Survey Analytics

> Part of the **Survey Intelligence** suite (Port Engineering Intelligence): [Survey Builder](../engineering-intelligence-survey-builder) (author) → [Survey Forms](../engineering-intelligence-survey-forms) (run) → **Survey Analytics** (analyze). See the [setup guide](https://docs.port.io/guides/all/create-survey-intelligence).

Read-only analytics for engineering surveys run in [Port](https://app.port.io).
Reads `survey` definitions and their `surveyResponse` entities and renders
scores, trends, participation, and benchmark comparisons - no data is written.

## How these plugins connect

Survey Intelligence is three plugins over one shared data model:

- **Survey Builder** writes the `survey` entity (the definition) and a `surveyCampaign` when you share it.
- **Survey Forms** reads the active campaigns and writes one `surveyResponse` per submission.
- **Survey Analytics** reads `survey` and `surveyResponse` to render scores, trends, participation, and benchmarks.

A survey authored in Survey Builder flows straight through Forms and Analytics with no extra wiring; each plugin reads the blueprint identifiers from its widget parameters.

## Preview image

<img width="1474" height="741" alt="Survey Analytics plugin" src="https://github.com/port-experimental/port-plugins/blob/main/engineering-intelligence-survey-analytics/assets/preview.png" />

## Features

- **Filters** - scope by survey, framework, and team, and **Compare with** a specific previous survey of the same framework.
- **Summary cards** - responses, overall score, average responses per team, teams responded, and the weakest dimension.
- **Team by dimension heatmap** - each team's score per dimension, plus an overall column.
- **Dimension scores** - average per-dimension score (0-100), with the compare survey overlaid when selected.
- **Trend over time** - overall and per-dimension scores across surveys of the same framework; dimension lines are toggleable.
- **Participation** - responses versus target per team (uses `survey.targetRespondents`, falling back to Port team size).
- **Questions ranked by score** - every scored question, lowest first, with its answer distribution.
- **Multi-select responses** - per-option popularity for "select all that apply" questions (unscored), with percentage-point deltas vs the compare survey.
- **Response log** - individual submissions (anonymous-aware).
- **Benchmark tab** - compares supported frameworks (e.g. DORA) against a bundled industry reference (DORA 2025).
- Loading, empty, and error states; light/dark theme via the Port SDK.

## Prerequisites

- Port account with permission to add custom plugins and read the blueprints below.
- Node.js **≥ 20**.
- [`@port-labs/port-plugins-cli`](https://www.npmjs.com/package/@port-labs/port-plugins-cli) to upload.

## Blueprints (read-only)

| Blueprint | Used for |
|-----------|----------|
| `survey` | Definition (dimensions, questions, scale) and `targetRespondents`. |
| `surveyResponse` | One submission: `dimensionScores`, `overallScore`, raw `answers`, and owning team. |
| Team (Port native) | Team names and sizes for participation. |

### Relations

| Relation | Source blueprint | Target blueprint | Required | Usage |
|----------|------------------|------------------|----------|-------|
| `survey` | `surveyResponse` | `survey` | yes | Responses are fetched per survey via a `relatedTo` search on this relation. |

Owning team for a response comes from native Port ownership (`_user` team), not a relation.

## Widget parameters

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `surveyBlueprint` | blueprint | yes | Blueprint holding survey definitions. |
| `responseBlueprint` | blueprint | yes | Blueprint holding submissions. |

## Local development

```bash
cd engineering-intelligence-survey-analytics
npm install
npm run dev     # http://localhost:9000
npm run build   # output: dist/index.html
```

Outside Port's iframe, `DEV_MOCK` (in `src/hooks/usePostMessageData.ts`) supplies
a mock host and `src/dev/mockData.ts` provides sample surveys and responses, so
the full dashboard renders offline. Edit `src/dev/mockData.ts` to change the
fixtures. To test inside Port during development, use Port's **Local development**
widget mode (loads `localhost:9000` in the real iframe with host context).

**Deep link:** the Survey Builder "View responses" action hands off a survey id
via `localStorage` key `__port_analytics_survey` (with a `?survey=` referrer
fallback), read here on mount and via a `storage` event. URL-based deep links are
not required and would not work cross-origin. The key is consumed once applied.

## Setup

### Build

```bash
npm install
npm run build   # output: dist/index.html (single self-contained file)
```

### Upload

```bash
port-plugins upload \
  --file dist/index.html \
  --identifier survey-analytics-port-plugin \
  --title "Survey Analytics" \
  --params "$(cat upload-params.json)" \
  --description "Developer survey analytics: results, trends, team breakdown, question ranking" \
  --upsert
```

See [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for CLI install and credential setup.

### Add in Port

1. Go to a dashboard page → **Edit** → **Add widget** → **Custom widget**.
2. Select **Survey Analytics**.
3. Set **Survey blueprint** = `survey` and **Response blueprint** = `surveyResponse`.
4. Save.

## Benchmark

The DORA 2025 reference distribution ships with the plugin, so the **Benchmark** tab works out of the box for DORA surveys - no benchmark blueprint or seed step required. The tab appears only for surveys whose questions resolve to a bundled benchmark.

## Project structure

```
engineering-intelligence-survey-analytics/
  src/
    api/            # portFetch, entities (survey + response search)
    benchmarks/     # dora-2025.ts, registry.ts, compare.ts, types.ts (bundled reference data)
    surveys/        # definition fallbacks + registry.ts
    hooks/          # usePostMessageData, survey/response/team query hooks
    components/     # SummaryStrip, DimensionBars, TrendLine, TeamHeatmap, QuestionRanking, ParticipationTable, ResponsesTable, BenchmarkView, FilterBar, states
    utils/          # config, aggregations
    dev/mockData.ts # local-dev fixtures (DEV_MOCK)
    types.ts
    App.tsx / App.css / index.tsx / index.html
  assets/           # preview image(s)
  upload-params.json
  webpack.config.js
  tsconfig.json
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Configure both blueprints…" | A required param is unset | Set both `surveyBlueprint` and `responseBlueprint`. |
| No surveys listed | No published surveys | Only `active`/`closed` surveys appear; publish one in Survey Builder. |
| Empty charts | No responses for the selected survey | Collect responses via Survey Forms first. |
| No Benchmark tab | Survey has no benchmarked questions | Expected; the tab shows only for frameworks with a bundled benchmark (e.g. DORA). |
