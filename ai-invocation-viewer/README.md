# AI Invocation Viewer

Overview and execution-log chat viewer for Port AI invocations. Place this plugin on an `_ai_invocations` or `_ai_conversation` entity page in [Port](https://app.port.io). On conversation pages, the widget loads the related invocation via the `latest_invocation` relation. The **Overview** tab shows identity, run metrics, usage gauges, and details; the **Flow** tab parses `execution_logs` into a chronological chat with expandable markdown and clickable tool-call dialogs.

## Preview image

<img width="1200" height="700" alt="AI Invocation Viewer plugin showing Overview tab with identity, metrics, and usage gauges" src="https://github.com/port-experimental/port-plugins/blob/cursor/ai-invocation-viewer-0d17/ai-invocation-viewer/assets/preview.png" />

## Features

- **Overview tab** — identity (avatar, title, status chips), summary KPIs (duration, tool count), context/quota gauges, details grid, and optional feedback panel
- **Flow tab** — parses `execution_logs` into user/assistant chat bubbles with markdown (GFM) rendering
- **Tool calls** — assistant turns show tool pills; open a dialog with formatted JSON input/output (including nested stringified JSON)
- **Expandable messages** — long bubbles collapse with a compact chevron expand control
- **Conversation pages** — resolves the latest invocation from `_ai_conversation` via `latest_invocation` (Port API GET)
- **Fallback transcript** — when `execution_logs` is empty, shows `prompt` / `response` properties
- Loading, empty, and error states with explicit setup messages
- Light/dark theme via Port SDK (`applyThemeCss`) and AnchorUI tokens
- Rich local dev mocks in `usePostMessageData.ts` for standalone `npm run dev`

## Prerequisites

### Access

- Port account with permission to add custom plugins and read `_ai_invocations` / `_ai_conversation` entities
- Node.js **≥ 22** (see `package.json` `engines`)
- [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for upload

### Blueprints & properties

This plugin reads Port's built-in AI catalog blueprints. No new blueprints are required.

| Blueprint | Purpose |
|-----------|---------|
| `_ai_invocations` | Primary surface — displays the invocation entity on its entity page |
| `_ai_conversation` | Alternate surface — loads the invocation linked by `latest_invocation` |

Properties the widget reads on the invocation entity (when present):

| Property | Type | Usage |
|----------|------|--------|
| `execution_logs` | string (markdown/JSON) | Parsed into Flow chat transcript |
| `prompt` | string | Fallback user message when logs are empty |
| `response` | string | Fallback assistant message when logs are empty |
| `status` | string | Overview status chip |
| `model` | string | Overview model chip |
| `provider` | string | Overview details |
| `source` | string | Overview source chip |
| `asked_at` | string (datetime) | Overview timestamps; duration calc |
| `replied_at` | string (datetime) | Overview timestamps; duration calc |
| `error` | string | Overview error callout (when status is failed) |
| `context_usage_percent` | number | Context usage gauge |
| `quota` | object | Quota gauge (`remainingQuota`, `monthlyLimit`) |
| `feedback_rating` | string | Feedback panel |
| `feedback_comment` | string | Feedback panel |
| `labels` | object | Overview label chips |
| `agent_title` | string | Fallback when `agent` relation is missing |

### Relations

| Relation | Source blueprint | Target | Required | Usage |
|----------|------------------|--------|----------|--------|
| `latest_invocation` | `_ai_conversation` | `_ai_invocations` | yes (on conversation pages) | Fetches invocation via Port API |
| `agent` | `_ai_invocations` | agent blueprint | no | Overview agent chip |
| `conversation` | `_ai_invocations` | `_ai_conversation` | no | Overview conversation label |
| `asked_by` | `_ai_invocations` | `_user` | no | Overview "Asked by" field |

## Plugin parameters

This plugin has **no configurable parameters**. Catalog shape and host entity context (`PLUGIN_DATA.entity`) supply everything at runtime.

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| — | — | — | — | No parameters (`upload-params.json` is empty) |

## Local development

```bash
cd ai-invocation-viewer
npm install
npm run dev   # http://localhost:9000
```

Mock host context and a rich `_ai_invocations` fixture are built into `src/hooks/usePostMessageData.ts` when `DEV_MOCK` is true (`development` + not embedded in Port's iframe). Edit `MOCK_EXECUTION_LOGS` and `mockEntity` there to exercise Flow scrolling, tool dialogs, and Overview gauges.

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
  --identifier ai-invocation-viewer \
  --title "AI Invocation Viewer" \
  --params "$(cat upload-params.json)" \
  --description "Overview and execution-log chat for AI invocations and conversations" \
  --upsert
```

`ai-invocation-viewer` satisfies Port's plugin identifier regex:

```javascript
const PLUGIN_IDENTIFIER_REGEX = /^(?!\.{1,2}$)[A-Za-z0-9@_.+:\\/=-]+$/;
```

See [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for CLI install and credential setup.

### Add in Port

1. Open an `_ai_invocations` or `_ai_conversation` **entity page** → **Add widget** → **Custom widget**
2. Select **AI Invocation Viewer**
3. No parameters to configure — save and resize the widget tile as needed

### Entity-page behaviour

- On **`_ai_invocations`**: reads the current entity from `PLUGIN_DATA.entity`
- On **`_ai_conversation`**: reads `relations.latest_invocation` and calls `GET /v1/blueprints/_ai_invocations/entities/{id}`
- Not intended for dashboard-only placement without an entity context

## Project structure

```
ai-invocation-viewer/
├── assets/
│   └── preview.png
├── dist/
│   └── index.html          # production upload artifact (committed)
├── src/
│   ├── api/
│   │   └── fetchInvocationEntity.ts
│   ├── hooks/
│   │   ├── useInvocationEntity.ts
│   │   └── usePostMessageData.ts
│   ├── utils/
│   │   └── parseConversation.ts
│   ├── App.tsx
│   ├── App.css
│   ├── index.tsx
│   ├── index.html
│   └── types.ts
├── package.json
├── upload-params.json
├── tsconfig.json
├── webpack.config.js
└── README.md
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Waiting for Port context…" | Widget not embedded in Port iframe or token not yet delivered | Open on an entity page in Port or use `npm run dev` with mocks |
| "Open this widget on an AI Invocation or AI Conversation entity page" | No host entity in `PLUGIN_DATA` | Place on entity page, not a bare dashboard |
| "This conversation has no latest invocation…" | `latest_invocation` relation empty | Ensure conversation entity links to an invocation |
| "Could not load the latest invocation" | API error (auth, missing entity) | Check token scopes; verify invocation identifier exists; read error body in UI |
| Blank Flow tab after tab switch | Flex height chain broken | Confirm `.tabs-group` and `.chat-thread` CSS; see `App.css` |
| Tool dialog offset left | `--side-chat-width` from host theme | Widget zeros this in `usePostMessageData`; rebuild and re-upload |
| Unstyled / wrong colors | Theme CSS not applied | Confirm `applyThemeCss()` runs in Port iframe path |
