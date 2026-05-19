# Entity Comment Thread

A Port custom widget for **entity pages** that shows threaded comments stored as `entityComment` catalog entities. Users can post **markdown** (bold, lists, fenced code blocks), **@mention** Port users, **reply** to comments, and mark threads **open** or **resolved**.

## Preview image

N/A — add a screenshot under `docs/` after first deploy in Port and link it here.

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

### Catalog

| Concept | Identifier | Notes |
|---------|------------|--------|
| Comment blueprint | `entityComment` | Created by this plugin setup (body, author, threadStatus, mentions) |
| Self-relation | `parentComment` → `entityComment` | Replies |
| Subject relation | e.g. `service` → `service` | **One relation per subject blueprint** the widget should support |

The widget discovers which relation targets the host entity’s blueprint at runtime. If none exists, it shows setup instructions.

**Add a subject relation** (example for blueprint `githubPullRequest`):

| Relation key | Target blueprint | Required | Many |
|--------------|------------------|----------|------|
| `pullRequest` | `githubPullRequest` | false | false |

Use MCP or Port UI: extend `entityComment.relations` with `target` set to your subject blueprint.

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
            "text": "💬 *New comment* on an entity\n*Author:* {{ .event.diff.after.properties.author }}\n*Thread:* {{ .event.diff.after.properties.threadStatus }}\n\n{{ .event.diff.after.properties.body }}"
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

None. The widget uses `PLUGIN_DATA.entity` and the `entityComment` blueprint.

## Local development

```bash
cd entity-comment-thread
npm install
npm run dev
```

Open `http://localhost:9000` (webpack `devServer.port: 9000` — required for Port **Local development** iframe mode). Dev mock provides a sample `service` entity and threaded comments. Edit `src/hooks/usePostMessageData.ts` and `src/dev/mockData.ts` to adjust fixtures.

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
  --identifier entity-comment-thread \
  --title "Entity Comment Thread" \
  --params "$(cat upload-params.json)" \
  --upsert
```

### Add in Port

1. Open an **entity page** (e.g. a Service).
2. **Add widget** → **Custom widget** → **Entity Comment Thread**.
3. Ensure `entityComment` has a relation to that entity’s blueprint (see **Catalog** above).

## Project structure

```
entity-comment-thread/
├── src/
│   ├── api/           # comments, users, blueprints
│   ├── components/    # thread UI, editor, markdown
│   ├── dev/           # local mock data
│   ├── hooks/
│   ├── utils/
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
