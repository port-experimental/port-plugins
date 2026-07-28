# Survey Forms

> Part of the **Survey Intelligence** suite (Port Engineering Intelligence): [Survey Builder](../engineering-intelligence-survey-builder) (author) → **Survey Forms** (run) → [Survey Analytics](../engineering-intelligence-survey-analytics) (analyze). See the [setup guide](https://docs.port.io/guides/all/create-survey-intelligence).

Run engineering surveys inside [Port](https://app.port.io) and store every
submission as a catalog entity you can score, filter, and build dashboards on.
Renders any survey authored in **Survey Builder** (SPACE, DORA, DX Core 4, AI
Adoption, or a custom framework). Works on a `survey` entity page (the host
entity is the survey) and on dashboards (with a survey picker).

> **Upload identifier:** `survey-forms-port-plugin`. The widget title is **Survey Forms**.

The survey itself is **data, not code**: every survey is described by a
declarative definition (dimensions, questions, answer scales). Change the
questions, dimensions, scale, or even the framework by editing the survey entity
in Port - **no rebuild required**. See [Customizing the survey](#customizing-the-survey).

## How these plugins connect

Survey Intelligence is three plugins over one shared data model:

- **Survey Builder** writes the `survey` entity (the definition) and a `surveyCampaign` when you share it.
- **Survey Forms** reads the active campaigns and writes one `surveyResponse` per submission.
- **Survey Analytics** reads `survey` and `surveyResponse` to render scores, trends, participation, and benchmarks.

A survey authored in Survey Builder flows straight through Forms and Analytics with no extra wiring; each plugin reads the blueprint identifiers from its widget parameters.

## Preview image

<img width="812" height="651" alt="Survey Forms respondent form: a SPACE survey rendered with likert questions grouped by dimension" src="https://github.com/port-experimental/port-plugins/blob/main/engineering-intelligence-survey-forms/assets/preview.png" />

<img width="814" height="336" alt="Survey Forms dashboard picker: choose an active survey shared with your team" src="https://github.com/port-experimental/port-plugins/blob/main/engineering-intelligence-survey-forms/assets/preview-picker.png" />

## Features

- **Definition-driven forms** - likert, single-/multi-choice, boolean, eNPS, and
  open-text questions rendered dynamically from the survey definition.
- **Built-in templates** - SPACE, DORA, DX Core 4, and AI Adoption, plus any
  custom framework authored in Survey Builder, with reverse-coded items.
- **Automatic scoring** - per-dimension scores (0-100) and an overall score are
  computed on submit and saved on the response entity.
- **Audience-gated dashboard picker** - on a dashboard, only active surveys
  shared with your team (via a `surveyCampaign`) are listed; a deadline badge is
  shown when the campaign has one.
- **Two surfaces** - entity page (host = the survey) or dashboard (survey picker).
- Loading, empty, error, and setup states; light/dark theme via the Port SDK.

## Prerequisites

### Access

- Port account with permission to add custom plugins and read/write the
  blueprints below.
- Node.js **≥ 20** (see `package.json` `engines`).
- [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli)
  for upload.

### Blueprints & properties

This plugin persists submissions and reads campaigns for audience gating, so it
uses three blueprints. The schemas are:

**`survey`** - a configurable survey instance

| Property | Type | Notes |
|----------|------|-------|
| `framework` | string (enum: `SPACE`, `AI Adoption`, `DORA`, `DX Core 4`, `custom`) | Selects the built-in template used when no inline definition is set. |
| `definition` | object | Full survey definition (dimensions, questions, scale). **When set, overrides the template** - this is how you change questions without a rebuild. |
| `status` | string (enum: `draft`, `active`, `closed`) | `closed` surveys hide the form; the dashboard picker lists `active` ones. |
| `cadence` | string (enum: `one-off`, `monthly`, `quarterly`) | Informational. |
| `description` | string (markdown) | Optional. |

**`surveyResponse`** - one submission (written by the plugin)

| Property | Type | Notes |
|----------|------|-------|
| `respondent` | string | `PLUGIN_DATA.user.email`, or `anonymous` for anonymous surveys. |
| `answers` | object | Raw answers keyed by question id. |
| `dimensionScores` | object | Per-dimension normalized score (0-100). |
| `overallScore` | number | Mean of dimension scores (0-100). |
| `enps` | number | Per-respondent eNPS contribution (+100 / 0 / -100), when the survey has an `nps` question. |
| `submittedAt` | string (date-time) | |

**`surveyCampaign`** - a share of a survey to an audience (read on dashboards)

Authored by Survey Builder. This plugin reads it (blueprint id is a code
constant, not a param) to decide which active surveys to show on a dashboard.

| Property | Type | Notes |
|----------|------|-------|
| `audience` | enum (`all`, `teams`) | `all` shows the survey to everyone; `teams` restricts to the `teams` relation. |
| `status` | enum (`active`, `closed`) | Only `active` campaigns gate visibility. |
| `deadline` | date-time | Optional; rendered as a deadline badge on the form header. |

### Relations

| Relation | Source blueprint | Target blueprint | Required | Usage |
|----------|------------------|------------------|----------|-------|
| `survey` | `surveyResponse` | `survey` | yes | Links each response to its survey. Read/written as a code constant (`RESPONSE_TO_SURVEY_RELATION`) - **not** a plugin parameter. |
| `survey` | `surveyCampaign` | `survey` | yes | Which survey a campaign shares (used to match campaigns to surveys). |
| `teams` | `surveyCampaign` | `_team` | no | Target teams when `audience = teams`. |

**Dashboard visibility rule:** on a dashboard, an `active` survey is shown only
when it has an `active` `surveyCampaign` shared with `all` teams or with one of
the current user's teams. An active survey with **no** campaign is hidden. If the
user's email or the campaign/team lookup is unavailable, the picker **degrades
open** (shows everything) rather than appear empty. The **entity-page** surface
is not gated - a direct entity link always opens the form.

## Plugin parameters

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `responseBlueprint` | blueprint | yes | - | Blueprint where submissions are written (`surveyResponse`). Cannot be inferred, so it is required. |
| `surveyBlueprint` | blueprint | no | host entity's blueprint | Blueprint that holds survey definitions (`survey`). Only needed on **dashboards**, where there is no host entity to pick a survey from. On a survey entity page the blueprint and survey id come from `PLUGIN_DATA.entity`. |

## Customizing the survey

The form is generated from a `SurveyDefinition` (see `src/types.ts`). Two layers
decide which definition is used, in priority order:

1. **Inline definition on the survey entity** - set the `definition` property of a
   `survey` entity to a full definition object. This always wins, so editing the
   entity in Port changes the live survey instantly. **No rebuild.**
2. **Built-in template** - if a survey entity has no inline `definition`, the
   plugin falls back to a template matched on the entity's `framework`
   (`src/surveys/registry.ts`). `SPACE` ships in the box.

A definition looks like:

```jsonc
{
  "id": "space",
  "title": "SPACE Developer Experience Survey",
  "framework": "SPACE",
  "anonymous": true,
  "scale": { "min": 1, "max": 5, "minLabel": "Strongly disagree", "maxLabel": "Strongly agree" },
  "dimensions": [
    { "id": "satisfaction", "name": "Satisfaction & well-being", "color": "#6366f1" }
    /* … */
  ],
  "questions": [
    { "id": "sat_satisfied", "dimension": "satisfaction", "type": "likert", "required": true,
      "text": "I am satisfied with my work as a developer on this team." },
    { "id": "sat_exhausted", "dimension": "satisfaction", "type": "likert", "reverse": true,
      "text": "I often feel emotionally or physically exhausted by my work." },
    { "id": "enps", "type": "nps", "text": "How likely are you to recommend this team as a place to work?" },
    { "id": "biggest_improvement", "type": "text", "text": "What would most improve your effectiveness?" }
  ]
}
```

Supported question `type`s: `likert`, `single_choice`, `multi_choice`, `boolean`,
`nps`, `text`. Likert/boolean/scored single-choice questions with a `dimension`
contribute to that dimension's score; `reverse: true` inverts the scale (e.g.
"I feel exhausted"). To add a **new framework** as a built-in default, drop a
definition file next to `src/surveys/space.ts` and register it in
`src/surveys/registry.ts`.

## Catalog setup

The plugin needs the `survey` and `surveyResponse` blueprints described in
[Blueprints & properties](#blueprints--properties), plus at least one `survey`
entity to render. A survey entity with an inline `definition` renders immediately;
one with only a `framework` falls back to the matching built-in template.

Author surveys with the **Survey Builder** plugin, which writes valid `survey`
entities for you, then collect responses here and analyze them in **Survey
Analytics**.

## Local development

```bash
cd engineering-intelligence-survey-forms
npm install
npm run dev   # http://localhost:9000
```

Outside Port's iframe, `DEV_MOCK` (in `src/hooks/usePostMessageData.ts`) supplies
a mock host: it simulates landing on the `space-sample` survey entity page with
both blueprint params set. Submissions are mocked locally (no write). Edit
`src/dev/mockData.ts` to change the sample survey.

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
  --identifier survey-forms-port-plugin \
  --title "Survey Forms" \
  --params "$(cat upload-params.json)" \
  --description "Run engineering surveys (SPACE, DORA, DX Core 4, AI Adoption, or custom) inside Port" \
  --upsert
```

> Use this exact identifier on every upload. Deriving the identifier from the title would create a duplicate plugin.

`--identifier` must satisfy Port's plugin identifier regex:

```javascript
const PLUGIN_IDENTIFIER_REGEX = /^(?!\.{1,2}$)[A-Za-z0-9@_.+:\\/=-]+$/;
```

See [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli)
for CLI install and credential setup.

### Add in Port

**On a survey entity page (recommended):**

1. Open a `survey` entity (e.g. `space-sample`) → **Add widget** → **Custom widget**.
2. Select **Survey Forms**.
3. Set **Response blueprint** = `surveyResponse`. Leave **Survey blueprint** empty.
4. Save → fill in the survey → **Submit response** → a `surveyResponse` entity is
   created, related to the survey. Analyze responses in **Survey Analytics**.

**On a dashboard:**

1. **Add widget** → **Custom widget** → **Survey Forms**.
2. Set **Response blueprint** = `surveyResponse` and **Survey blueprint** = `survey`.
3. Save → pick an active survey → fill it in.

## Project structure

```
engineering-intelligence-survey-forms/
  src/
    surveys/        # space.ts (SPACE template) + registry.ts (resolve/fallback)
    scoring.ts      # normalization, reverse-coding, dimension/overall/eNPS scoring
    api/            # portFetch.ts, entities.ts (search/create), campaigns.ts (audience read)
    hooks/          # usePostMessageData, useActiveSurveys, useCampaigns, useUserTeams, useSubmitResponse
    components/     # SurveyForm, QuestionField, SurveyPicker, states
    utils/          # config, resolveHostEntity, surveyContext, audience
    types.ts        # SurveyDefinition, Question, PluginConfig, …
    dev/mockData.ts # local-dev fixtures (DEV_MOCK)
    App.tsx / App.css / index.tsx / index.html
  upload-params.json
  webpack.config.js
  tsconfig.json
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Blank white iframe | React hooks called after an early `return` | All hooks run at the top of `App` before any return - keep it that way. |
| "Configure the Response blueprint…" | `responseBlueprint` param not set | Set the required **Response blueprint** param. |
| "Place this widget on a survey entity page…" | Dashboard placement without **Survey blueprint** | Set the **Survey blueprint** param, or place the widget on a `survey` entity. |
| Form shows the SPACE default unexpectedly | Survey entity has no inline `definition` | Expected fallback - set the `definition` property to override. |
| Dashboard picker is empty though active surveys exist | Surveys not shared with your team, or no campaign | Share the survey to your team (or all teams) from Survey Builder; an active survey with no campaign is hidden on dashboards. |
| 422 on submit/search | Malformed search body or relation value | Search bodies nest `{ query: { combinator, rules } }`; the `survey` relation value is the survey identifier. Error text includes the Port response body. |
