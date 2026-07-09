# Github Copilot AI Adoption and Usage

Custom [Port](https://app.port.io) plugin that turns raw GitHub Copilot organization metrics into an interactive engineering intelligence dashboard. Tracks active users, acceptance rates, lines of code, PR activity, and (optionally) generates AI insight reports about your Copilot usage. See the [setup guide](https://docs.port.io/guides/all/create-github-copilot-ai-usage-dashboard).

## Preview image

<img width="1800" height="748" alt="Github Copilot AI Adoption and Usage plugin" src="https://github.com/port-experimental/port-plugins/blob/main/engineering-intelligence-ai-usage-copilot/assets/preview.png" />

## Features

- KPI header strip with active users, adoption rate, acceptance rate, lines accepted, suggestions, and Copilot PRs
- **Adoption & Engagement** tab with active users (DAU/WAU/MAU) and active users by surface
- **Usage & Acceptance** tab with suggestions vs. acceptances, acceptance-rate trend, lines suggested vs. accepted, Copilot PR activity, and a usage breakdown by IDE / feature / language / model
- **AI Insights** tab (optional) with AI-generated analysis of Copilot usage data and a Generate button that triggers a Port workflow to produce new insight reports
- Per-chart **granularity** (day / week / month) and **aggregation mode** (Latest / Avg / Median / Peak) controls for stock metrics such as active users
- **Save view**: an explicit Save button appears when your current filters differ from the saved defaults; Reset returns to the last saved state
- Respects dashboard page filters
- Light/dark theme support via Port SDK

## Prerequisites

### Access

- Port account with permission to add custom plugins and read the Copilot org usage blueprint
- Node.js **>= 20** (see `package.json` `engines`)
- [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for upload

### Blueprints and properties

Port's native [GitHub Copilot integration](https://docs.port.io/context-lake/ingestion/ingest-data-into-port/native-integrations/ai-usage-metrics/github-copilot/github-copilot) creates the `githubCopilotOrganizationUsage` blueprint and populates it with one entity per organization per day. That blueprint identifier is what you pass as `copilotOrgUsageBlueprint` when configuring the widget.

The plugin reads the `record_date` property (ISO date-time string) to identify which day each entity belongs to.

Property keys read from each entity's `properties` (snake_case, matching the GitHub Copilot metrics payload):

| Group | Keys |
|-------|------|
| Active users | `daily_active_users`, `weekly_active_users`, `monthly_active_users`, `monthly_active_chat_users`, `monthly_active_agent_users`, `daily_active_cli_users`, `daily_active_copilot_cloud_agent_users`, `weekly_active_copilot_cloud_agent_users`, `monthly_active_copilot_cloud_agent_users`, `daily_active_copilot_code_review_users`, `weekly_active_copilot_code_review_users`, `monthly_active_copilot_code_review_users`, `daily_passive_copilot_code_review_users`, `weekly_passive_copilot_code_review_users`, `monthly_passive_copilot_code_review_users` |
| Activity and LOC | `code_generation_activity_count`, `code_acceptance_activity_count`, `user_initiated_interaction_count`, `loc_suggested_to_add_sum`, `loc_added_sum`, `loc_suggested_to_delete_sum`, `loc_deleted_sum` |
| Breakdowns | `totals_by_ide`, `totals_by_feature`, `totals_by_language_feature`, `totals_by_language_model`, `totals_by_model_feature`, `totals_by_cli` (arrays) |
| Cohorts | `totals_by_ai_adoption_phase` (array) |
| PRs | `pull_requests` (object) |

Unrecognized or missing keys are treated as zero, so the widget degrades gracefully if your schema is a subset.

### Blueprints and properties — AI Insights tab (optional)

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

### Workflow (AI Insights tab, optional)

The **Generate** button in the AI Insights tab is enabled when `copilotInsightsAction` is set to a Port workflow identifier.

| Field | Value |
|---|---|
| Recommended identifier | `generate_github_copilot_insights` |
| Trigger | The widget calls `/v1/actions/<id>/runs` with the properties below |

The widget sends these inputs to the workflow on every **Generate** click:

| Input key | Type | Description |
|---|---|---|
| `period_from` | string | Start of the requested period (ISO date, e.g. `2026-06-01`) |
| `period_to` | string | End of the requested period (ISO date, e.g. `2026-07-01`) |
| `metrics_blueprint` | string | Identifier of the `copilotOrgUsageBlueprint` (omitted if not configured) |
| `org_filter` | string | GitHub org to scope the analysis to (omitted when generating for all orgs) |

The action is responsible for querying Copilot usage metrics, calling an AI model, and writing the result as a new entity to the `copilotInsightsBlueprint`. After triggering, the widget polls for new entities and displays them automatically.

## Plugin parameters

These are the fields exposed in the Port widget configuration UI (from `upload-params.json`):

| Key | Label in UI | Type | Required | Description |
|-----|-------------|------|----------|-------------|
| `copilotOrgUsageBlueprint` | GitHub Copilot Org Usage blueprint | blueprint | yes | The `githubCopilotOrganizationUsage` blueprint, holding one entity per organization per day of GitHub Copilot usage metrics |
| `licensedSeats` | Licensed seats | number | no | Licensed Copilot seats. When set, enables the **Adoption rate** KPI (MAU divided by seats) |
| `copilotInsightsBlueprint` | Github Copilot Insights blueprint | blueprint | no | Blueprint holding AI-generated Copilot insight entities. Required to enable the **AI Insights** tab |
| `copilotInsightsAction` | Github Copilot Insights workflow identifier | string | no | Port workflow identifier for generating new insights. Recommended value: `generate_github_copilot_insights`. Required to enable the **Generate** button in the AI Insights tab |

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

1. Open a dashboard page, click **Edit**, then **Add widget**, and select **Custom widget**
2. Select **Github Copilot AI Adoption and Usage**
3. Fill in the fields:

| Field | Input | Description |
|-------|-------|-------------|
| **GitHub Copilot Org Usage blueprint** (required) | `githubCopilotOrganizationUsage` | Blueprint holding the daily organization usage-metrics entities |
| **Licensed seats** | Number | Licensed Copilot seats. Enables the **Adoption rate** KPI (MAU divided by seats) |
| **Github Copilot Insights workflow identifier** | `generate_github_copilot_insights` | Required to enable the **Generate** button in the AI Insights tab |
| **Github Copilot Insights blueprint** | `github_copilot_insights` | Required to enable the **AI Insights** tab |

4. Save

## Project structure

```
engineering-intelligence-ai-usage-copilot/
  src/
    components/
      charts/
        LineChart.tsx        # Multi-series SVG line/area chart
        GroupedBars.tsx      # Grouped column chart
      FilterBar.tsx          # Date range picker, org filter, and view save/reset controls
      DateRangePicker.tsx    # Popover: preset rail + two-month range calendar
      InlineSelect.tsx       # Per-chart granularity and aggregation selectors
      KpiStrip.tsx           # Header KPI cards with deltas
      InsightsTab.tsx        # AI Insights tab with insight list and generate button
      RankedBreakdown.tsx    # Ranked bars + table (by IDE/feature/language/model)
      PhaseDistribution.tsx  # AI adoption-phase cohorts
      Section.tsx            # Card wrapper
      EmptyState.tsx / ErrorBanner.tsx / LoadingState.tsx
    hooks/
      usePostMessageData.ts  # Host bridge + dev mock
      useMetrics.ts          # Entity search over a date range + page filters
    api/
      portFetch.ts
      metrics.ts             # Entity to DailyMetric mapper + fetch
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

## Notes and limitations

- Data is **org-level, per-day**. When multiple GitHub organizations report data to the same blueprint, the org filter (shown automatically in the filter bar) lets you scope charts to a single org. Port team page-filters do not segment org-aggregate rows.
- Stock metrics (active users, adoption rate) default to the **Latest** in-range daily snapshot; per-chart aggregation controls switch them to Avg / Median / Peak across the range. Flow metrics (suggestions, acceptances, LOC, PRs) are always summed and are not affected by this control.
- Adoption-rate KPI requires `licensedSeats`; GitHub's usage metrics do not carry a seat count.
- GitHub does not always populate every field for every org (for example, `daily_active_cli_users` and `totals_by_cli` can arrive as `null`). The plugin treats missing values as 0 or empty, so those charts degrade gracefully.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "No usage data in range" | Blueprint empty for that window, or wrong `dayProp` | Verify ingestion; confirm the date property key and that records fall in the selected range |
| Adoption rate shows "–" | `licensedSeats` not set | Add the `licensedSeats` param |
| AI Insights tab not visible | `copilotInsightsBlueprint` not configured | Set `copilotInsightsBlueprint` to your insights blueprint identifier |
| Generate button not visible | `copilotInsightsAction` not configured | Set `copilotInsightsAction` to your workflow identifier |
| Org filter not shown | Only one organization in the data | The org filter appears only when two or more distinct organization IDs are present |
| All KPI values show 0 despite data existing | Property keys in the blueprint don't match what the plugin expects | Check that your integration mapping includes the full `organization-usage-metrics` resource block from the setup guide |
