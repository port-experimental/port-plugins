# Entity Comment Thread

A [Port](https://app.getport.io) custom widget for **entity pages** that shows threaded comments stored as `entityComment` catalog entities. Users can post **markdown** (bold, lists, fenced code blocks), **@mention** Port users, **reply** to comments, and mark threads **open** or **resolved**. Subject entity and blueprint come from host `PLUGIN_DATA.entity`; relation keys are resolved from the comment blueprint schema at runtime.

## Preview image

![Entity comment thread widget schematic](./docs/preview.svg)

**Entity page** · React 19 · TypeScript · [Port Plugins](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins)

## Features

- Loads comments related to the current entity via Port search (`relatedTo`)
- New top-level comments and nested replies (`parentComment` relation)
- Markdown rendering (safe React markdown — no `dangerouslySetInnerHTML`)
- @mention autocomplete from active Port users
- Per-thread **Open** / **Resolved** status on root comments
- Resolves subject link from catalog relations (no relation string params)

## Prerequisites

### Access

- **Node.js** `>=20` (see `package.json` `engines`) for build and [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli).
- Widget runs on an **entity page** with a valid Port API token from the host (`PLUGIN_DATA`).

### Blueprints & properties

| Concept | Identifier | Notes |
|---------|------------|--------|
| Comment blueprint | `entityComment` (default) | Created by this plugin setup (body, author, threadStatus, mentions) |
| Self-relation | `parentComment` → `entityComment` | Replies |

### Relations

| Relation key | Target | Purpose |
|--------------|--------|---------|
| `parentComment` | `entityComment` | Nested replies (required; do not remove) |
| Subject relation(s) | e.g. `service` → `service` | **One relation per subject blueprint** the widget should support |

The widget discovers which subject relation targets the host entity’s blueprint at runtime (excluding `parentComment`). If none exists, it shows setup instructions.

### Blueprint definition (`blueprints/entityComment.blueprint.json`)

Use this file as the **source of truth** when creating or updating the `entityComment` blueprint in Port (Port UI, API, or MCP). It ships with the built-in relations the widget expects; you extend it for your catalog.

| Section | Purpose |
|---------|---------|
| `identifier` / `title` / `icon` | Blueprint identity and display in Port (`entityComment`, **Entity Comment**, `Chat`). |
| `schema.properties` | Fields on each comment entity — see **Properties** below. |
| `schema.required` | Every comment must have `body` and `author`. |
| `mirrorProperties` / `calculationProperties` / `aggregationProperties` | Empty in the template; add computed or mirrored fields later if needed. |
| `relations` | Links between comments and other blueprints (threading + subject). |

**Built-in relations** (do not remove):

| Relation key | Target | Purpose |
|--------------|--------|---------|
| `parentComment` | `entityComment` | Nested replies (self-relation). |
| `service` | `service` | Example subject link for Service entity pages. |

#### Subject relations (`[YOUR-BLUEPRINT-RELATIONS-HERE]`)

The template JSON cannot include a literal `[YOUR-BLUEPRINT-RELATIONS-HERE]` placeholder — JSON does not support comments or placeholders. In practice, that marker means: **add one relation per subject blueprint** you want comments on, as new keys under the existing `"relations": { ... }` object, alongside `parentComment` and `service`.

**Add a subject relation** (example for blueprint `githubPullRequest`):

| Relation key | Target blueprint | Required | Many |
|--------------|------------------|----------|------|
| `pullRequest` | `githubPullRequest` | false | false |

In `blueprints/entityComment.blueprint.json`, add an entry next to `service`:

```json
"pullRequest": {
  "title": "Pull request",
  "target": "githubPullRequest",
  "required": false,
  "many": false
}
```

Then create or patch the blueprint in Port (UI, API, or MCP) so `entityComment.relations` includes every subject blueprint you need. The widget picks the relation whose `target` matches the host entity’s blueprint at runtime (excluding `parentComment`).

### Properties (`entityComment`)

| Property | Type | Purpose |
|----------|------|---------|
| `body` | markdown | Comment text |
| `author` | user | Author email |
| `threadStatus` | enum `open` \| `resolved` | Root comments only |
| `mentions` | array (user) | Emails @mentioned in body |

### Slack notifications

Install the [Port Slack app](https://docs.port.io/ai-interfaces/slack-application/) so Port stores `__SLACK_APP_BOT_TOKEN_<team_id>` as a system secret.

Create an **automation** (Settings → Automations) that fires when a comment is created:

```json
{
  "identifier": "entity_comment_slack_notify",
  "title": "Notify Slack on new entity comment",
  "icon": "Slack",
  "description": "Posts to Slack when an entityComment is created",
  "trigger": {
    "type": "automation",
    "event": {
      "type": "ENTITY_CREATED",
      "blueprintIdentifier": "entityComment"
    }
  },
  "invocationMethod": {
    "type": "WEBHOOK",
    "url": "https://slack.com/api/chat.postMessage",
    "synchronized": true,
    "method": "POST",
    "headers": {
      "Content-Type": "application/json; charset=utf-8",
      "Authorization": "Bearer {{ .secrets.\"__SLACK_APP_BOT_TOKEN_T00000000\" }}"
    },
    "body": {
      "channel": "C00000000",
      "blocks": [
        {
          "type": "section",
          "text": {
            "type": "mrkdwn",
            "text": "*New comment* on an entity\n*Author:* {{ .event.diff.after.properties.author }}\n*Thread:* {{ .event.diff.after.properties.threadStatus }}\n\n{{ .event.diff.after.properties.body }}"
          }
        }
      ]
    }
  },
  "publish": true
}
```

Replace:

- `__SLACK_APP_BOT_TOKEN_T00000000` — your Slack workspace bot token secret name (Credentials → Secrets).
- `C00000000` — target Slack channel ID.

Optional JQ **condition** to notify only when someone is mentioned:

```json
"condition": {
  "type": "JQ",
  "expressions": [
    "(.diff.after.properties.mentions // []) | length > 0"
  ],
  "combinator": "and"
}
```

Incoming webhooks (no Slack app) are also supported — use your webhook URL instead of `chat.postMessage`; see [Port Slack examples](https://docs.port.io/build-your-software-catalog/sync-data-to-catalog/project-management/jira/examples/).

## Widget parameters

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `entityCommentBlueprint` | blueprint | No | `entityComment` | Blueprint that stores comments. Override only if your org uses a different identifier; align `blueprints/entityComment.blueprint.json` and catalog relations with that blueprint. |

Subject entity and blueprint still come from `PLUGIN_DATA.entity` on entity pages. Relation keys are defined in the catalog (see **Blueprint definition**), not as plugin params.

## Local development

```bash
cd entity-comment-thread
npm install
npm run dev
```

Open `http://localhost:9000` (webpack `devServer.port: 9000` — required for Port **Local development** iframe mode). Outside Port’s iframe, `DEV_MOCK` supplies token, user email, a sample `service` entity, and threaded comments.

| File | Purpose |
|------|---------|
| `src/hooks/usePostMessageData.ts` | Host bridge + `DEV_MOCK` gate |
| `src/dev/mockData.ts` | Sample entity, users, and comment thread |

Enable Port **Local development** on the widget to test real `postMessage` and API calls in the portal.

## Setup

### Catalog

1. Create or update the comment blueprint from `blueprints/entityComment.blueprint.json` (properties, `parentComment`, and one subject relation per blueprint you comment on).
2. Confirm the widget’s optional **Entity Comment blueprint** parameter matches that identifier (default `entityComment`).

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
  --identifier entity-comment-thread \
  --title "Entity Comment Thread" \
  --params "$(cat upload-params.json)" \
  --description "Threaded entity-page comments with markdown, mentions, replies, and thread status" \
  --upsert
```

Install, `port-plugins config`, tokens, and region flags: [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli). See also [Port Plugins](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins).

### Add in Port

1. Open an **entity page** (e.g. a Service).
2. **Add widget** → **Custom widget** → **Entity Comment Thread**.
3. Create or update the `entityComment` blueprint from `blueprints/entityComment.blueprint.json` (including subject relations for that page’s blueprint).

### Entity-page behaviour

- **Dashboard:** Not supported — the widget needs `PLUGIN_DATA.entity` (identifier + blueprint) from the host.
- **Subject relation:** At runtime the widget loads `GET /v1/blueprints/entityComment` and picks the relation whose `target` matches the host entity blueprint (excluding `parentComment`). If none match, it shows setup instructions instead of the thread list.
- **Comments:** Loaded with `POST .../entityComment/entities/search` and `relatedTo` the current entity; new comments set the resolved relation key on create.

## Project structure

```
entity-comment-thread/
├── blueprints/
│   └── entityComment.blueprint.json
├── docs/
│   └── preview.svg
├── src/
│   ├── api/           # comments, users, blueprints
│   ├── components/    # thread UI, editor, markdown
│   ├── dev/           # local mock data
│   ├── hooks/
│   ├── utils/         # config (params), portal URLs, comment tree
│   ├── types.ts       # PluginConfig + domain types
│   └── App.tsx
├── upload-params.json
└── package.json
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Relation setup message | No `entityComment` → subject relation | Add relation targeting host blueprint |
| Empty thread list | No comments yet | Post a comment; verify search permissions |
| Mentions list empty | No active users | Check `_user` entities with `status: Active` |
| Slack not firing | Automation disabled / wrong secret | Verify automation published and token channel ID |
| 422 on search | Malformed query | Widget uses nested `query` object (already correct) |
| Local dev blank in Port | Wrong dev server port | Use port **9000** (`npm run dev`); Port Local development expects `http://localhost:9000` |
| Theme mismatch in Port | `applyThemeCss()` not applied | Widget calls SDK theme on host path; surfaces use Port tokens in `App.css` `:root` |
| Wrong comment blueprint | Param override without matching catalog | Set **Entity Comment blueprint** to your blueprint identifier and align `blueprints/*.json` relations |
