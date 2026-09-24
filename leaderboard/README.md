# Leaderboard

A ranked leaderboard of entities by a sortable property, a custom plugin for
[Port](https://app.port.io). Runs on dashboard pages and merges page filters
into the entity search, so the same widget can power multiple leaderboards
(top contributors, top owning teams, top skills, ...) just by changing its
parameters.

<img width="519" height="417" alt="Leaderboard widget showing top used skills ranked by invocation count, with gold/silver/bronze tiles for the top 3" src="https://github.com/port-experimental/port-plugins/blob/main/leaderboard/assets/preview.png" />

## Features

- Sorts any blueprint's entities by any numeric property (plain, aggregated,
  or calculated) in ascending or descending order
- Top 3 entries get a full gold / silver / bronze tile with a rank-numbered
  medal icon, the rest get a plain outlined avatar
- Entity title links out to its Port entity page; rows themselves aren't
  clickable
- Respects dashboard page filters (`mergePageFilters`)
- Configurable result limit
- Loading, empty, and error states; light/dark theme support via Port SDK

## Prerequisites

### Access

- Port account with permission to add custom plugins and read the
  blueprint this widget is configured against
- Node.js **≥ 20** (see `package.json` `engines`)
- [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for upload

### Blueprints & properties

No new blueprints required. Configure the widget against any existing
blueprint that has a numeric property to rank by (plain, aggregation, or
calculation property).

Example uses on a skills-registry adoption dashboard:

| Leaderboard | Blueprint | Sort property |
|---|---|---|
| Top contributors | `_user` | number of skills contributed (aggregation or calculation property) |
| Top owning teams | `_team` | number of skills owned (aggregation property) |
| Top skills | `skill` | usage rate (calculation property — not yet modeled) |

## Plugin parameters

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `blueprint` | blueprint | yes | (none) | Blueprint whose entities are ranked |
| `sortProperty` | string | yes | (none) | Identifier of the numeric property to rank by |
| `sortDirection` | string | no | `desc` | `asc` or `desc` |
| `limit` | number | no | `10` | Max number of rows shown |
| `filter` | object | no | (none) | Extra dataset filter merged into the entity search, same shape as a Port entities-search query (`{ combinator, rules }`) |

Prefer dashboard **page filters** to scope entities — they apply automatically
via `mergePageFilters`. Only set `filter` when this leaderboard needs a
narrower or different subset of entities than the rest of the dashboard (a
page filter applies to every widget on the page).

The widget pages through the blueprint's entities (100 per request) up to
1,000 total before ranking, so it stays correct for blueprints larger than a
single search page; entities beyond that cap aren't considered.

## Local development

```bash
cd leaderboard
npm install
npm run dev   # http://localhost:9000
```

Outside Port's iframe, `usePostMessageData.ts` serves a mock "Top
Contributors" config and `src/api/searchEntities.ts` returns a static
sample entity list (`MOCK_CONTRIBUTORS`) instead of calling the Port API.
Edit `MOCK_PARAMS` / `MOCK_CONTRIBUTORS` to preview a different
leaderboard shape locally. Entity title links are built from mock data and
won't resolve to a real Port entity page outside the iframe.

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
  --identifier leaderboard \
  --title "Leaderboard" \
  --params "$(cat upload-params.json)" \
  --description "Ranked leaderboard of entities by a sortable property, top 3 highlighted gold/silver/bronze" \
  --upsert
```

See [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for CLI install and credential setup.

### Add in Port

1. Open a dashboard page → **Add widget** → **Custom widget**
2. Select **Leaderboard**
3. Configure `blueprint`, `sortProperty`, and optionally `sortDirection` /
   `limit` (see **Plugin parameters** above); set the widget's own title in
   Port's "Add widget" dialog
4. Save. Repeat with different parameters for each leaderboard on the page.

## Project structure

```
leaderboard/
  src/
    api/
      searchEntities.ts    # Port REST entity search + page-filter merge
    hooks/
      usePostMessageData.ts
      useLeaderboardData.ts
    utils/
      config.ts            # param parsing / defaults
    types.ts
    App.tsx
    App.css
    index.tsx
  dist/
    index.html            # Committed upload artifact
  upload-params.json
  webpack.config.js
  tsconfig.json
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Blank white iframe (no text) | React hooks called after `if (!portToken) return` | Call all hooks before early returns; `useLeaderboardData` is gated with `enabled` — see this repo's `create-port-plugin` skill, `production-readiness.md` §1 |
| Blank iframe, zero height | Missing `#plugin-root` flex / shell `min-height` | Layout is already copied from `template-App.css`; don't remove the `.shell` rules |
| "Configure the blueprint and sortProperty..." | Missing required param | Set both `blueprint` and `sortProperty` when adding the widget |
| All rows show "—" | `sortProperty` isn't a numeric property on this blueprint, or entities lack it | Verify the property identifier and that entities have a value |
| Empty leaderboard | Dashboard page filters exclude all entities, or wrong blueprint | Check the page's filters and the `blueprint` param |
| Rankings look wrong on a large blueprint | Entity count exceeds the 1,000-entity pool cap | Narrow with dashboard page filters or the `filter` param so the ranked set fits the cap |
| Port API error | Auth, wrong host, or malformed search body | Error includes response body; confirm nested `{ query: { combinator, rules } }` on entity search; use **Retry** once the underlying issue is fixed |
