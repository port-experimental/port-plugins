# Github Copilot AI Adoption and Usage

AI adoption & usage dashboard for GitHub Copilot — custom plugin for [Port](https://app.port.io). Runs on dashboard pages and merges page filters into entity search.

## Preview image

<!-- Replace assets/preview.png with a screenshot of this widget before publishing. -->

<img width="1800" height="748" alt="Github Copilot AI Adoption and Usage plugin" src="https://github.com/port-experimental/port-plugins/blob/main/engineering-intelligence-ai-usage-copilot/assets/ei-usage-github-copilot.png" />

## Features

- KPI header strip — active users, adoption rate, acceptance rate, lines accepted, suggestions, and Copilot PRs, with trend vs. the previous equal period
- **Adoption & Engagement** tab — active users (DAU/WAU/MAU), active users by surface, stickiness, and AI adoption-phase distribution
- **Usage & Acceptance** tab — suggestions vs. acceptances, acceptance-rate trend, lines suggested vs. accepted, and a usage breakdown by IDE / feature / language / model
- Shared filter bar:
  - **Date range** — a calendar picker with a preset rail (last 7 / 14 / 30 / 60 / 90 days, this month, last month) plus a two-month range calendar for custom windows
  - **Granularity** — day / week / month rollup
  - **Active users aggregation** — how active-user & stickiness metrics are summarized: Latest (default), Avg, Median, or Peak. Flow metrics (suggestions, lines, PRs) are always summed
  - **Compare** — overlay the previous equal period
  - Breakdown dimension + rank-by metric (Usage tab)
- **Remembers your view** — the last-used filters (range, granularity, aggregation, compare, breakdown) persist across reloads via `localStorage`. Day-count presets stay rolling (re-derived relative to today); custom ranges restore their exact window
- Respects dashboard page filters
- Light/dark theme support via Port SDK

## Prerequisites

### Access

- Port account with permission to add custom plugins and read the metrics blueprint
- Node.js **≥ 20** (see `package.json` `engines`)
- [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for upload

### Blueprints & properties

The widget reads one blueprint holding **one entity per organization per day** of GitHub Copilot organization usage metrics. An ingestion pipeline (e.g. a scheduled job calling the GitHub Copilot metrics API) must populate it.

| Requirement | Details |
|-------------|---------|
| Blueprint | The org usage-metrics blueprint (e.g. `githubCopilotOrganizationUsage`) — pass it as `metricsBlueprint` |
| Date property | `record_date` by default (ISO date-time). Override with `dayProp` if your schema differs |

Property keys read from each entity's `properties` (snake_case, matching the GitHub Copilot metrics payload):

| Group | Keys |
|-------|------|
| Active users | `daily_active_users`, `weekly_active_users`, `monthly_active_users`, `daily_active_cli_users`, `daily_active_copilot_cloud_agent_users`, `daily_active_copilot_code_review_users` (+ weekly/monthly variants) |
| Activity & LOC | `code_generation_activity_count`, `code_acceptance_activity_count`, `user_initiated_interaction_count`, `loc_suggested_to_add_sum`, `loc_added_sum` |
| Breakdowns | `totals_by_ide`, `totals_by_feature`, `totals_by_language_feature`, `totals_by_model_feature` (arrays) |
| Cohorts | `totals_by_ai_adoption_phase` (array) |
| PRs | `pull_requests` (object) |

Unrecognized or missing keys are treated as zero, so the widget degrades gracefully if your schema is a subset.

### Blueprints & properties — AI Insights tab (optional)

The **AI Insights** tab is enabled when `copilotInsightsBlueprint` is set. It reads one entity per generated insight report from a dedicated blueprint.

| Property key | Type | Required | Description |
|---|---|---|---|
| `raw_response` | string (JSON) | yes | Primary data: JSON object with `summary`, `findings` array, `risk_signals` array, and `confidence_note` |
| `period` | string | no | Human-readable period label, e.g. `"2026-06-01 to 2026-07-05"` |
| `generated_at` | string | no | ISO datetime of when the insight was generated |
| `run_id` | string | no | Port action run ID (used to link back to the run log) |
| `org` | string | no | GitHub org identifier this insight was generated for. Empty or absent means all orgs |

The expected `raw_response` JSON shape:

```json
{
  "summary": "Executive summary paragraph",
  "findings": [
    {
      "insight": "Finding text",
      "category": "Adoption",
      "severity": "High",
      "confidence": "Medium",
      "impact": "...",
      "evidence": "...",
      "recommended_action": "..."
    }
  ],
  "risk_signals": ["Risk signal text"],
  "confidence_note": "Based on 30 days of data"
}
```

Legacy properties (`summary`, `key_findings`, `recommendations`, `risk_signals`, `confidence_note` as top-level entity properties) are also read as a fallback when `raw_response` is absent.

### Self-service actions (SSA) — AI Insights tab (optional)

The **Generate** button in the AI Insights tab is enabled when `copilotInsightsAction` is set to a Port self-service action (or workflow) identifier.

| Field | Value |
|---|---|
| Identifier | Any — passed as the `copilotInsightsAction` param |
| Trigger | The widget calls `/v1/actions/<id>/runs` with the properties below |

The widget sends these inputs to the action on every **Generate** click:

| Input key | Type | Description |
|---|---|---|
| `period_from` | string | Start of the requested period (ISO date, e.g. `2026-06-01`) |
| `period_to` | string | End of the requested period (ISO date, e.g. `2026-07-01`) |
| `metrics_blueprint` | string | Identifier of the `metricsBlueprint` (omitted if not configured) |
| `org_filter` | string | GitHub org to scope the analysis to (omitted when generating for all orgs) |

The action is responsible for querying Copilot usage metrics, calling an AI model, and writing the result as a new entity to the `copilotInsightsBlueprint`. After triggering, the widget polls for new entities and displays them automatically.

## Plugin parameters

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `metricsBlueprint` | blueprint | yes | — | Blueprint holding the daily organization usage-metrics entities |
| `licensedSeats` | number | no | — | Licensed Copilot seats. When set, enables the **Adoption rate** KPI (MAU ÷ seats) |
| `dayProp` | string | no | `record_date` | Property key holding each record's ISO date/date-time |
| `copilotInsightsBlueprint` | blueprint | no | — | Blueprint holding AI-generated Copilot insight entities. Required to enable the **AI Insights** tab |
| `copilotInsightsAction` | string | no | — | Port self-service action identifier that generates new insights. Required to enable the **Generate** button in the AI Insights tab |

## Local development

```bash
cd engineering-intelligence-ai-usage-copilot
npm install
npm run dev   # http://localhost:9000
```

Outside Port's iframe, `DEV_MOCK` activates and the widget renders ~45 days of synthetic metrics generated relative to today (see `src/dev/mockData.ts`). Adjust `MOCK_PARAMS` / `MOCK_METRIC_ENTITIES` to test other shapes.

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
  --identifier ai-usage-github-copilot \
  --title "Github Copilot AI Adoption and Usage" \
  --params "$(cat upload-params.json)" \
  --description "AI adoption & usage dashboard for GitHub Copilot" \
  --upsert
```

See [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for CLI install and credential setup.

### Add in Port

1. Open a dashboard page → **Edit** → **Add widget** → **Custom widget**
2. Select **Github Copilot AI Adoption and Usage**
3. Set `metricsBlueprint` to your org usage-metrics blueprint
4. Optionally set `licensedSeats` (to enable adoption rate) and `dayProp`
5. Save

## Project structure

```
engineering-intelligence-ai-usage-copilot/
  src/
    components/
      charts/
        LineChart.tsx        # Multi-series SVG line/area chart
        GroupedBars.tsx      # Grouped column chart
      FilterBar.tsx          # Date picker, granularity, aggregation, compare, breakdown, metric
      DateRangePicker.tsx    # Popover: preset rail + two-month range calendar
      KpiStrip.tsx           # Header KPI cards with deltas
      RankedBreakdown.tsx    # Ranked bars + table (by IDE/feature/language/model)
      PhaseDistribution.tsx  # AI adoption-phase cohorts
      Section.tsx            # Card wrapper
      EmptyState.tsx / ErrorBanner.tsx / LoadingState.tsx
    hooks/
      usePostMessageData.ts  # Host bridge + dev mock
      useMetrics.ts          # Entity search over a date range + page filters
    api/
      portFetch.ts
      metrics.ts             # Entity → DailyMetric mapper + fetch
    utils/
      aggregations.ts        # KPIs, trends, breakdown, stock reducers (avg/median/max)
      constants.ts           # Chart series + palette
      config.ts              # Param readers
      format.ts              # Number/date formatters
      view.ts                # localStorage load/save of the current filter view
    types.ts
    App.tsx
    App.css
    index.tsx
  upload-params.json
  webpack.config.js
  tsconfig.json
```

## Notes & limitations

- Data is **org-level, per-day**, so the primary filter is the date range; Port team page-filters do not segment org-aggregate rows. Multi-org / per-team views are a future scope item.
- Stock metrics (active users, adoption rate, stickiness) default to the **latest** in-range daily snapshot; the **Active users** aggregation control switches them to Avg / Median / Peak across the range. Flow metrics (suggestions, acceptances, LOC, PRs) are always summed and ignore this control.
- Filter state is remembered per browser via `localStorage` (key `port_ai_adoption_view_v1`); it is not shared across users. Named / shareable saved views are a future scope item.
- Adoption-rate KPI requires `licensedSeats`; GitHub's usage metrics do not carry a seat count.
- GitHub does not always populate every field for every org (e.g. `daily_active_cli_users`, `totals_by_cli` can arrive `null`). The plugin treats missing values as 0 / empty, so those widgets degrade gracefully.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "No usage data in range" | Blueprint empty for that window, or wrong `dayProp` | Verify ingestion; confirm the date property key and that records fall in the selected range |
| Adoption rate shows "–" | `licensedSeats` not set | Add the `licensedSeats` param |
| Setup prompt / waiting for Port context | Opened outside Port or missing token | Embed via Port **Local development** or deploy |
| Port API error | Auth, wrong blueprint, or malformed search body | Error includes the response body; confirm the blueprint identifier and nested `{ query: { combinator, rules } }` |
| KPIs show no trend arrows | No data in the previous equal period | Expected until at least two comparable periods exist |
