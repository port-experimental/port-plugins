# Entity Comment Thread

Collaborative comment thread on any entity page — rich text, code snippets, @mentions, threaded replies, and open/resolved status per thread. Comments are stored as Port entities in a dedicated `comment` blueprint so they live in your catalog alongside your services, repos, and other resources.

## Preview

> Add `assets/preview.png` once the plugin is deployed and you have a screenshot.

## Features

- **Rich text comments** — inline `code`, **bold**, *italic*, and fenced code blocks with language labels
- **@mention users** — type `@` to trigger an autocomplete dropdown backed by Port's `_user` blueprint; mentions are stored on the comment entity
- **Threaded replies** — each top-level comment can have nested replies via the `parentComment` self-relation; expand/collapse per thread
- **Open / Resolved status** — mark any top-level thread as resolved; filter the list by All / Open / Resolved
- **Delete your own comments** — authors can remove their own comments
- **Per-entity scoping** — only loads comments for the current entity; the widget enforces the configured Subject blueprint so it cannot be placed on the wrong entity type
- **Theme-aware** — adapts to Port light/dark theme via `applyThemeCss()`
- **Loading / empty / error states** — skeleton loaders while fetching; empty state with call-to-action; error banner with retry

## Prerequisites

### Comment blueprint

**Blueprint identifier:** `comment`

Create this blueprint in Port before uploading the plugin (it was created for you if you used the Port MCP server during setup).

#### Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `body` | `string` · `format: markdown` | Yes | Comment text — supports markdown syntax |
| `author` | `string` · `format: user` | No | Port user who wrote the comment — stores the user's email via Port's native user picker |
| `status` | `string` enum (`open` / `resolved`) | No | Thread status — set only on top-level comments |
| `subjectBlueprint` | `string` | Yes | Blueprint identifier of the entity being commented on |
| `subjectIdentifier` | `string` | Yes | Entity identifier of the entity being commented on |
| `mentions` | `array` of `string` · `format: user` | No | List of mentioned users |

#### Relations

| Relation | Target | Many | Description |
|----------|--------|------|-------------|
| `parentComment` | `comment` (self) | No | Parent comment — empty for top-level threads, set for replies |

### Subject blueprint

No configuration needed. The widget reads `PLUGIN_DATA.entity.blueprint` at runtime to scope comments to the current entity type. Place the widget on any entity page and it will automatically show only the comments for that entity.

## Plugin parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commentBlueprint` | blueprint | Yes | The `comment` blueprint created in Prerequisites |

> The subject blueprint is **not a parameter** — it is inferred at runtime from `PLUGIN_DATA.entity.blueprint` (the entity page the widget is placed on). The widget works on any entity type without reconfiguration.

## Local development

```bash
cd entity-comment-thread
npm install
npm run dev   # http://localhost:9000
```

The local dev server runs with mock data: two threads (one open with a reply, one resolved) on a `payment-service` entity of blueprint `service`. The mock user is `alice@example.com`.

> **Note:** Portal links to entities use `document.referrer` for the Port origin and will not open real entity pages in local development. Validate links in Port's **Local development** iframe after deploying.

## Build

```bash
npm run build   # outputs dist/index.html
```

Commit `dist/index.html` after every build on a new version.

## Upload

```bash
port-plugins upload \
  --file dist/index.html \
  --identifier entity-comment-thread-port-plugin \
  --title "Entity Comment Thread" \
  --params "$(cat upload-params.json)" \
  --description "Collaborative comment thread on entity pages with rich text, @mentions, replies, and open/resolved threads" \
  --upsert
```

## Adding the widget to an entity page

1. Open Port and navigate to the entity type you want to enable comments on.
2. Edit the entity page layout → **Add widget** → Custom plugins.
3. Select **Entity Comment Thread**.
4. Set parameters:
   - **Comment blueprint** → `comment`
5. Save — every entity of that blueprint now shows a comment thread.

## SDK version

| Source | Version |
|--------|---------|
| Latest (`npm view @port-labs/plugins-sdk version`) | `0.3.0` |
| Declared (`package.json`) | `^0.3.0` |
| Resolved (`package-lock.json`) | `0.3.0` |
