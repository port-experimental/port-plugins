# Survey Builder

> Part of the **Survey Intelligence** suite (Port Engineering Intelligence): **Survey Builder** (author) → [Survey Forms](../engineering-intelligence-survey-forms) (run) → [Survey Analytics](../engineering-intelligence-survey-analytics) (analyze). See the [setup guide](https://docs.port.io/guides/all/create-survey-intelligence).

A visual **survey authoring** widget for Port. Compose an engineering survey -
questions, dimensions, rating scales, and metadata - and save it as a `survey`
entity. The survey's full definition is written to the entity's `definition`
property, which the **Survey Forms** runner and **Survey Analytics** dashboard
already consume. No code changes, no rebuilds: author a survey here and it is
immediately runnable.

## How these plugins connect

Survey Intelligence is three plugins over one shared data model:

- **Survey Builder** writes the `survey` entity (the definition) and a `surveyCampaign` when you share it.
- **Survey Forms** reads the active campaigns and writes one `surveyResponse` per submission.
- **Survey Analytics** reads `survey` and `surveyResponse` to render scores, trends, participation, and benchmarks.

A survey authored in Survey Builder flows straight through Forms and Analytics with no extra wiring; each plugin reads the blueprint identifiers from its widget parameters.

## Preview image

<img alt="Survey Builder plugin" src="assets/preview.png" />

## What it does

- **Lists** every `survey` entity (any status) on a dashboard, with an editor for each.
- **Creates** a new survey from a built-in template (**SPACE**, **AI Adoption**,
  **DORA**, **DX Core 4**) or a **blank** canvas.
- **Edits** everything that drives the survey:
  - **Setup** - title, framework, status, cadence, anonymity, description, and
    the default rating scale.
  - **Dimensions** - named groups used for per-dimension scoring (add / reorder /
    recolor / remove). Deleting a dimension detaches its questions automatically.
  - **Questions** - all five supported types, with required/reverse flags,
    dimension mapping, help text, and choice editing (with optional per-choice
    scores for single-choice items).
- **Live preview** - renders the working draft through the exact same form the
  runner uses, so authors see precisely what respondents get.
- **Saves** by upserting the `survey` entity (`upsert=true&merge=true`).

### Supported question types

| Type            | Scored?            | Notes                                       |
| --------------- | ------------------ | ------------------------------------------- |
| Rating scale    | yes                | Likert on the survey's default scale        |
| Single choice   | optional           | One option; choices may carry a score       |
| Multi-select    | no                 | Several options                             |
| Yes / No        | yes (1/0)          | Boolean                                     |
| Free text       | no                 | Open response                               |

## How it fits the data model

The plugin reads and writes the **`survey`** blueprint (unchanged):

| Property            | Type   | Written by the builder                              |
| ------------------- | ------ | --------------------------------------------------- |
| `framework`         | enum   | `SPACE` · `AI Adoption` · `DORA` · `DX Core 4` · `custom` |
| `status`            | enum   | `draft` · `active` · `closed`                       |
| `cadence`           | enum   | `one-off` · `monthly` · `quarterly`                 |
| `description`       | string | Markdown intro shown to respondents                 |
| `definition`        | object | **Full survey definition** (dimensions, questions, scale) |

The `definition` object is the same `SurveyDefinition` shape the runner resolves
with priority *inline definition → framework template → default* - so a survey
authored here overrides any built-in template automatically.

## Prerequisites

- Port account with permission to add custom plugins and read/write the blueprints below.
- Node.js **≥ 20**.
- [`@port-labs/port-plugins-cli`](https://www.npmjs.com/package/@port-labs/port-plugins-cli) to upload.
- **Build with AI** needs `@port-labs/plugins-sdk` **≥ 0.2.0** on the plugin (this plugin targets `^0.3.0`) and on the Port host, so `openAiChat` can open the side chat.

### Blueprints, relations & workflows

| Requirement | Details |
| --- | --- |
| `survey` blueprint | Holds survey definitions (see [How it fits the data model](#how-it-fits-the-data-model)); shared with Survey Forms and Survey Analytics. Read + written. |
| `surveyCampaign` blueprint | Upserted directly when you share a survey (id `<survey>-campaign`; deleted on unshare). Properties: `audience` (`all`/`teams`), `status`, `deadline`, `reminderCadence`. Relations: `survey` → `survey` (1:1), `teams` → `_team` (many). |
| `_team` (native) | Read to resolve team names for the sharing audience. |
| `survey-nudge-now` workflow | Triggered by the **Send reminder** button (`POST /v1/workflows/survey-nudge-now/runs`). Required only if you use reminders. |

## Parameters

| Param | Type | Required | Description |
| --- | --- | --- | --- |
| `surveyBlueprint` | blueprint | yes | Blueprint that holds survey definitions. |
| `respondentUrl` | string | no | Dashboard URL of the Survey Forms widget, used for the **Open survey** link. Optional; defaults are derived from the embedding portal. |
| `analyticsUrl` | string | no | Dashboard URL of the Survey Analytics widget, used for the **View responses** link. Optional; defaults are derived from the embedding portal. |

## Surfaces

- **Dashboard** - place the widget on a dashboard with `surveyBlueprint` set to
  manage all surveys (list, create, edit, delete).
- **Survey entity page** - placed on a `survey` entity page, it opens that survey
  in the editor directly.

## Develop

```bash
npm install
npm run dev      # http://localhost:9000 - runs with mock surveys/teams
npm run build    # → dist/index.html (single inlined file)
```

In dev (outside Port's iframe) the widget mocks the dashboard surface with a
couple of sample surveys and teams, so the full builder is exercisable offline.

Two host-only behaviors don't work at `localhost:9000` and must be checked in
Port's **Local development** iframe or after deploy:

- **Build with AI** opens the Port AI side chat via `openAiChat`; standalone dev
  has no host chat, so the starter prompt is copied to the clipboard instead.
- Share invites, the reminder-workflow config link, and the Survey Analytics
  "View responses" deep link (handed off via `localStorage` key
  `__port_analytics_survey`) are built from `document.referrer` + the token org,
  neither of which is present standalone.

## Upload to Port

```bash
port-plugins upload \
  --file dist/index.html \
  --identifier survey-builder-port-plugin \
  --title "Survey Builder" \
  --params "$(cat upload-params.json)" \
  --description "Author engineering surveys visually and save them as Port survey entities" \
  --upsert
```

See [`@port-labs/port-plugins-cli`](https://www.npmjs.com/package/@port-labs/port-plugins-cli)
for CLI install and credential setup (tokens vs client credentials, region).

## Add in Port

**On a dashboard (manage all surveys):**

1. **Add widget** → **Custom widget** → **Survey Builder**.
2. Set **Survey blueprint** = `survey`. Leave the URL params empty unless you need to override the derived links.
3. Save → list / create / edit / share surveys.

**On a survey entity page:**

1. Open a `survey` entity → **Add widget** → **Custom widget** → **Survey Builder**.
2. Set **Survey blueprint** = `survey`.
3. Save → the widget opens that survey in the editor directly.

## Adding a template

Drop a `SurveyDefinition` file in `src/surveys/` and register it in
`src/surveys/registry.ts` (`TEMPLATES`). It then appears as a starting point in
the "New survey" picker - no other changes needed.

## Project structure

```
engineering-intelligence-survey-builder/
  src/
    surveys/        # built-in templates (space/ai-adoption/dora/dx-core-4) + registry.ts
    api/            # portFetch, entities (survey CRUD), campaigns (share/nudge/unshare), teams
    hooks/          # usePostMessageData, useSurveys, useCampaign(s), useLaunchCampaign, useNudgeNow, useTeams, useUnshareCampaign
    components/     # SurveyListScreen, BuilderScreen, editors, TemplatePicker, ShareDrawer, SendReminderModal, preview/, states
    utils/          # config, portalUrl, share, surveyGrouping, draft, resolveHostEntity
    types.ts / scoring.ts
    App.tsx / App.css / index.tsx / index.html
  assets/preview.png
  upload-params.json
  webpack.config.js
  tsconfig.json
```

## Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| Blank white iframe | React hooks called after an early `return` | All hooks run before any return - keep it that way. |
| "Configure the Survey blueprint..." | `surveyBlueprint` param not set | Set the required **Survey blueprint** param, or place the widget on a `survey` entity page. |
| Build with AI copies instead of opening chat | Running standalone, or Port host / SDK below 0.2.0 | Expected at `localhost:9000`; in Port ensure the host supports `openAiChat` (SDK ≥ 0.2.0). |
| Share does nothing / campaign not created | `surveyCampaign` blueprint or its relations missing | Create the `surveyCampaign` blueprint with `survey` and `teams` relations (see Prerequisites). Errors include the Port response body. |
| Reminder button disabled or errors | Survey not shared, or `survey-nudge-now` workflow missing | Share the survey first; create the `survey-nudge-now` workflow. |
| 422 on save/search | Malformed request body | Entity search nests `{ query: { combinator, rules } }`; error text includes the Port response body. |
