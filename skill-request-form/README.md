# Skill Request Form

A Port custom widget that lets **non-technical users author skills** and submit them for review. It runs in two modes: on a **dashboard** it creates a brand-new skill; on a **skill entity page** it proposes an update to that skill (pre-loading the current files and showing a live diff). On submit it creates a `skill_request` entity in [Port](https://app.getport.io); a workflow then notifies the owning team and routes the request through approval before it is applied to the live skill catalog.

A skill is treated as a **bundle**, not a single file: a primary `SKILL.md` plus optional supporting **references**, **scripts**, and **assets**. The widget edits all of them in one place.

This widget reads the `skill`, `skill_group`, `skill_version`, and `skill_file` blueprints, calls Port AI for drafting, and writes to `skill_request`.

## Preview

<img alt="Skill Request Form widget" src="https://github.com/port-experimental/port-plugins/blob/main/skill-request-form/assets/preview.gif" />

## Features

- One widget for both **create** (dashboard) and **update** (skill entity page) flows — mode is inferred from the host entity.
- **Three ways to start a new skill:**
  - **Create with AI** — describe the skill in plain language and Port AI drafts the `SKILL.md` (and any helpful supporting files) via `/v1/ai/invoke` or a configured agent, using structured output.
  - **Write it myself** — start from a ready-to-edit `SKILL.md` template.
  - **Upload a SKILL.md** — bring an existing file; the name is derived from it.
- **Multi-file authoring**: add/remove/rename **references, scripts, assets, and other** files alongside `SKILL.md` from a file sidebar.
- Markdown editor with a formatting toolbar (heading, bold, italic, list, link) — no raw-markdown knowledge required; works for any file in the bundle.
- **Live diff** in update mode: existing files are loaded and the selected file's changes are highlighted line-by-line.
- Skill-group picker and location (global/project) selector.
- Submits a `skill_request` entity (including the file bundle, create method, and AI prompt); downstream version, path, and approval are handled by automations.
- Loading, empty, and error states; theme-aware (light/dark) via the Port SDK.

## Prerequisites

Node.js **>= 20** (see `package.json` `engines`). If you run the upload CLI from the same machine, match the [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) Node requirement.

### Blueprints & properties

| Blueprint | Role | Key properties used |
|-----------|------|---------------------|
| `skill_request` | **New** — the request the widget creates | `request_type`, `status`, `skill_name`, `skill_content` (markdown = SKILL.md), `files` (array of `{path, content, type}`), `create_method` (`ai`/`write`/`upload`), `ai_prompt`, `change_summary`, `location`, `skill_path`, `source`, `version`, `submitted_at` |
| `skill` | Subject on entity pages (update mode) — **holds only `location`** | `location`; `title` is the skill name |
| `skill_version` | Timestamp of the latest version | `version`, `description`; mirror `commit_date` |
| `skill_file` | **Holds the content of ALL skill files** (SKILL.md, references, scripts, assets — everything) | `content`, `path` |

How the model works:

```
skill_file (content + path)  →  skill_version (timestamp)  →  skill (location)  →  skill_group
```

- **`skill_file`** entities hold every file in the skill bundle: the primary `SKILL.md`, references (`references/…`), scripts (`scripts/…`), assets (`assets/…`), and anything else. Each has `content` (full text) and `path`.
- **`skill_version`** carries the version timestamp and relates to `skill` via `skill_version_to_skill`.
- **`skill`** holds only the skill's `location` (global/project) and relates to `skill_group` via `skill_to_skill_group`.
- The widget traverses `skill ← skill_version ← skill_file` to load all current files for an existing skill in update mode.

On submit, the widget stores the SKILL.md in `skill_request.skill_content` and supporting files in `skill_request.files[]`. On approval, the downstream automation creates `skill_file` entities for each file.

The `skill_request` blueprint definition is committed at `port/blueprints/skill_request.json`.

### Relations

| Relation | Source → Target | Required | How the widget uses it |
|----------|-----------------|----------|------------------------|
| `target_skill` | `skill_request` → `skill` | no | Set on **update** requests to point at the skill being changed |
| `skill_group` | `skill_request` → `skill_group` | no | Set from the picker; its owning team are the reviewers |
| `requester` | `skill_request` → `_user` | no | Set to the current user's **email** (`_user` is keyed by email in this org); the widget reads `user.email` from the host SDK |
| `skill_version_to_skill` | `skill_version` → `skill` | yes | Traversed to find the skill's latest version |
| `skill_file_to_skill_version` | `skill_file` → `skill_version` | yes | Traversed to read ALL current files for the skill |
| `skill_to_skill_group` | `skill` → `skill_group` (many) | no | Read from the host entity to pre-select the group in update mode |

### Automations / workflows (downstream — not part of this widget)

| Object | Trigger | Purpose |
|--------|---------|---------|
| Notification workflow | `skill_request` entity created | Resolve reviewers from the `skill_group` owning team and send a Slack notification (clone of `send_slack_notification`) |
| Approval automation | `skill_request` `status` → `approved` | Create `skill_file` entities for SKILL.md (`skill_content`) and each entry in `files[]`; create/update `skill_version` + `skill`; finalize `skill_path` and `version`; notify subscribers; set `status` → `applied` |

The widget only **creates** the `skill_request`. All version stamping, path resolution, requester resolution, notification, and approval are handled by these automations.

### AI drafting

"Create with AI" calls Port AI with the user's host token, so the user (or org default) needs Port AI access. The widget sends an `outputSchema` so the response is a structured skill draft (`skill_name`, `skill_md`, `files[]`) rather than free-form text, and restricts the AI to read-only catalog tools. By default it uses the general-purpose assistant (`/v1/ai/invoke`); set the optional `aiAgentIdentifier` param to route through a specific [AI agent](https://docs.port.io/ai-interfaces/ai-agents/overview) (`/v1/agent/{id}/invoke`) instead.

## Widget parameters

Mirrors `upload-params.json`. The three blueprint pickers let the widget be re-pointed without code changes; defaults match this org's catalog.

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `skillRequestBlueprint` | `blueprint` | yes | `skill_request` | Blueprint the widget creates entities in |
| `skillBlueprint` | `blueprint` | yes | `skill` | Skill blueprint; detected as the subject on entity pages (update mode) |
| `skillGroupBlueprint` | `blueprint` | yes | `skill_group` | Blueprint backing the group picker |
| `aiAgentIdentifier` | `string` | no | _(empty)_ | Optional Port AI agent identifier for "Create with AI". Blank = general-purpose `/v1/ai/invoke` |

The `skill_version` and `skill_file` blueprint identifiers are fixed code constants (`src/constants.ts`) since they are stable in this catalog; re-point them there if your model differs.

## Local development

```bash
npm install
npm run dev   # webpack-dev-server on http://localhost:9000
```

Outside Port's iframe the widget uses a dev mock (`src/hooks/usePostMessageData.ts`):

- `MOCK_ENTITY_ID` / `MOCK_ENTITY_BLUEPRINT` simulate a `skill` entity page (**update** mode with multi-file diff). Set `MOCK_ENTITY_ID` to `null` to preview the dashboard **create** experience (method picker + AI/upload/write).
- API responses (skill groups, current files, AI draft) are mocked in `src/dev/mockData.ts` and short-circuited in `src/api/skills.ts` and `src/api/ai.ts` when `DEV_MOCK` is true — "Create with AI" returns a canned draft so the editor flow can be previewed offline.

To validate the full token + `PLUGIN_DATA` flow, toggle **Local development** on the widget inside Port to load `http://localhost:9000`.

## Setup

### 1. Catalog

Create the `skill_request` blueprint (commit at `port/blueprints/skill_request.json`) and confirm the relations in **Prerequisites** exist. The `skill`, `skill_group`, `skill_version`, and `skill_file` blueprints already exist in this org.

### 2. Build

```bash
npm install
npm run build   # → dist/index.html (self-contained, all JS/CSS inlined)
```

### 3. Upload

```bash
port-plugins upload \
  --file dist/index.html \
  --identifier skill-request-form \
  --title "Skill Request Form" \
  --params "$(cat upload-params.json)" \
  --upsert
```

`skill-request-form` satisfies Port's identifier regex `/^(?!\.{1,2}$)[A-Za-z0-9@_.+:\\/=-]+$/`. For CLI install, credentials, and region/base-url flags, see [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli).

### 4. Add in Port

- **Create flow (dashboard):** open/create a dashboard → **Edit page** → **Add widget** → **Custom plugin** → **Skill Request Form**. Defaults work as-is; override the blueprint params only if your identifiers differ.
- **Update flow (entity page):** add the same widget to the `skill` entity page layout. The widget detects the host `skill` entity, loads its current files (SKILL.md + references/scripts/assets), and switches to update mode with the per-file **Changes** (diff) tab.

## Project structure

```
src-skill-request-form/
  package.json
  tsconfig.json
  webpack.config.js
  upload-params.json
  README.md
  src/
    index.html
    index.tsx
    App.tsx
    App.css
    types.ts
    constants.ts
    hooks/
      usePostMessageData.ts
    api/
      skills.ts            # search groups, read current SKILL.md, create skill_request
      ai.ts                # generateSkillDraft (Port AI invoke, streamed)
    components/
      CreateFlow.tsx       # create-mode state machine (choose → ai → editor)
      ModePicker.tsx       # AI / write / upload entry cards
      AiPrompt.tsx         # prompt + streaming progress for AI drafting
      FileManager.tsx      # file sidebar (SKILL.md + references/scripts/assets)
      SkillRequestForm.tsx # multi-file editor + submit
      MarkdownEditor.tsx
      DiffView.tsx
      LoadingState.tsx
      ErrorBanner.tsx
    utils/
      config.ts            # configFromParams (blueprint + string param parsing)
      draft.ts             # SkillDraft helpers (build from AI/upload/files, payload)
      diff.ts              # LCS line diff (pure)
      sse.ts               # Server-Sent Events reader for AI streaming
      portalUrl.ts         # portal origin from document.referrer
    dev/
      mockData.ts
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Waiting for Port context…" persists | No token/baseUrl (opened outside Port, or token not yet delivered) | Embed in a Port dashboard/entity page, or use **Local development** toggle; in local dev the mock provides both |
| Create mode shown on a skill page | `skillBlueprint` param doesn't match the host entity's blueprint | Set `skillBlueprint` to the skill blueprint identifier |
| Diff tab missing | Widget is in create mode (not on a `skill` entity) | Add the widget to the `skill` entity page layout |
| Empty group picker | No `skill_group` entities or wrong `skillGroupBlueprint` | Confirm groups exist and the param points at the right blueprint |
| 422 on submit/search | Malformed search/create body | Search uses `{ query: { combinator, rules } }`; check the error text surfaced in the banner |
| Current files not loading | Missing `skill_version`/`skill_file` entities for the skill | Ensure the skill has a version + files (via GitLab sync or prior approval) |
| "Create with AI" fails (401/403) | User/org lacks Port AI access, or token can't reach the AI endpoint | Confirm Port AI is enabled; the call uses the host user token |
| AI returns text but no draft | Model didn't honor `outputSchema` | Rephrase the prompt; the widget falls back to using the raw text as `SKILL.md` |
| Configured agent 404 | `aiAgentIdentifier` doesn't match an existing agent | Leave blank to use `/v1/ai/invoke`, or set a valid agent identifier |
| Colors look off in dark mode | Theme not applied | Ensure the SDK `applyThemeCss()` runs (handled by `usePostMessageData`); not active in local dev mock |
