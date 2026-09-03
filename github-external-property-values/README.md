# GitHub External Property Values

> This plugin exists to support the [Sync Port properties to GitHub external custom properties](https://docs.port.io/guides/all/sync-port-properties-to-github-external-custom-properties) guide's centrally managed setup (the `githubExternalCustomProperty` blueprint + `manage_sync_workflows`). It's not a standalone widget — don't install it unless you're following that guide.

Lists every entity (and current property value) that a GitHub External Property sync rule covers — custom plugin for [Port](https://app.port.io). Must be placed on a `githubExternalCustomProperty` ("GitHub External Property") entity page; reads the sync rule off `PLUGIN_DATA.entity` and queries the catalog for every matching entity.

## Preview image

<img width="777" height="417" alt="GitHub External Property Values plugin" src="https://github.com/port-experimental/port-plugins/blob/main/github-external-property-values/assets/preview.png" />

## Features

- Reads a `githubExternalCustomProperty` entity's sync rule (`blueprint_name`, `property_name`, `github_org`) and lists every entity of `blueprint_name` that belongs to `github_org` — i.e. every entity that will trigger this rule's sync workflow
- Resolves the org filter generically from the target blueprint's schema at runtime (no hardcoded blueprint names): a direct/mirror `github_org` property, or a relation to `githubOrganization`
- Shows the resolved org filter once above the table (dot-path to it, e.g. `github_repository.organization.$identifier` or `organization.$identifier`, and the org value) — it's the same for every row, since that's what all rows were filtered by
- Table columns: entity (linked, header = target blueprint's title), `property_name`'s current value (colorized as a pill when the property is an enum with `enumColors`), and a "Latest sync run" link per row — the most recent of that entity's own sync workflow run (via `entity_update_sync_workflow`, if set) and any bulk sync of the property itself (see below), whichever is newer
- Loading, empty, and error states; light/dark theme support via Port SDK

## Prerequisites

### Access

- Port account with permission to add custom plugins and read the blueprints this plugin uses
- Node.js **≥ 20** (see `package.json` `engines`)
- [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for upload

### Blueprints & properties

No new blueprints required — this plugin only reads existing catalog data.

| Requirement | Details |
|-------------|---------|
| Host blueprint | `githubExternalCustomProperty` ("GitHub External Property") — the widget must be placed on this blueprint's entity page |
| Host properties | `blueprint_name` (target Port blueprint), `property_name` (Port property key synced to GitHub), `github_org` (target GitHub organization) — all three required on the host entity |
| Target blueprint | Whatever `blueprint_name` points to (e.g. `service`, `githubRepository`) — must expose either a `github_org` property (direct or mirror) or a relation to `githubOrganization` |

### How org filtering is resolved

At runtime the plugin fetches the target blueprint's schema (`GET /v1/blueprints/{blueprint_name}`) and picks a filter strategy — no blueprint name is hardcoded:

| Target blueprint has... | Filter used |
|--------------------------|-------------|
| A `github_org` property (direct or mirror) | `property "github_org" = <host entity's github_org>` |
| A relation targeting `githubOrganization` | `relation <that relation> = <host entity's github_org>` (the `githubOrganization` entity identifier equals the org login) |
| Neither | Error state — the widget can't determine which entities belong to the org |

Both flows are exercised by real data in this catalog: `service` (property flow, e.g. `Port.lifecycle_attr` → `lifecycle`) and `githubRepository` (relation flow, e.g. `Port.custom_attr` → `custom_prop`).

### How "Latest sync run" is resolved

Each row's "Latest sync run" is the newer of two independently-resolved runs:

**1. The entity's own sync workflow run.** When the host `githubExternalCustomProperty` entity has an `entity_update_sync_workflow` relation, the plugin looks for the most recent run of that workflow triggered by that specific target entity:

- `GET /v1/workflows/runs?workflowIdentifiers=<id>` — scoped server-side to just this workflow (confirmed working filter; most other query params on this endpoint, e.g. `workflowIdentifier` singular or any entity-level filter, are silently ignored).
- That list doesn't say which entity triggered each run, so the plugin walks it newest-first, fetching run detail (`GET /v1/workflows/runs/:identifier`) in small batches, reading the trigger node's `output.diff.after.identifier` (or `.before.identifier`), until every visible row is resolved or the workflow's run history is exhausted.

**2. A bulk sync of the property itself.** Creating/updating a `githubExternalCustomProperty` entity (or manually re-running "Bulk Sync GitHub External Property") triggers the org-wide `manage_sync_workflows` workflow, whose `bulk_update` step pushes the property to *every* matching target entity in one run — not per target entity. The plugin resolves the latest such run triggered by the **host** property entity (same run history walk as above, against `manage_sync_workflows`), recognizing both:
  - an event-trigger run (create/update), where the entity id is in `output.diff.after/before.identifier`, same as above;
  - a manual self-service-trigger run, where — per Port's [data flow docs](https://docs.port.io/workflows/build-workflows/data-flow/) — self-service triggers store user inputs directly as outputs, so the entity id is `output.github_external_custom_property` instead.

  Since one bulk run covers every row, it's applied identically to all of them wherever it's newer than a row's own per-entity run — shown with a "(bulk sync)" suffix so it's clear the row itself wasn't individually triggered.

Rows with neither kind of run show "No recent run found". This is a best-effort search relying on the run history containing a match — see **Known limitations**.

## Widget parameters

None — this is a zero-config, entity-page-only widget. Everything is read from `PLUGIN_DATA.entity` and the Port REST API.

## Local development

```bash
cd github-external-property-values
npm install
npm run dev   # http://localhost:9000
```

The mock host entity in `src/hooks/usePostMessageData.ts` defaults to `Port.lifecycle_attr` (property flow). Swap `MOCK_ENTITY_ID`/properties/relations to `Port.custom_attr` to exercise the relation flow — matching fixtures for both (including workflow runs) are in `src/dev/mockData.ts`.

Entity and workflow-run links built from mock identifiers do **not** work at `http://localhost:9000` outside Port's iframe — there is no `document.referrer` (so links fall back to `https://app.port.io` without the org-id path prefix) and mock IDs are not real catalog entities/runs. Validate links via Port **Local development** (iframe) or after deploy.

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
  --identifier github-external-property-values-port-plugin \
  --title "GitHub External Property Values" \
  --params "$(cat upload-params.json)" \
  --description "Lists every entity (and current property value) that a GitHub External Property sync rule covers" \
  --upsert
```

See [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for CLI install and credential setup.

### Add in Port

1. Open a `GitHub External Property` entity page → **Add widget** → **Custom widget**
2. Select **GitHub External Property Values**
3. No parameters to configure
4. Save

## Project structure

```
github-external-property-values/
  src/
    components/
      ShellMessage.tsx
      ErrorBanner.tsx
      PropertyValuePill.tsx
      RunStatusLink.tsx
      SyncedEntitiesTable.tsx
    hooks/
      usePostMessageData.ts
      useSyncedEntities.ts
    api/
      blueprints.ts
      entities.ts
      workflowRuns.ts
    utils/
      resolveHostEntity.ts
      githubExternalPropertyFields.ts
      orgFilterStrategy.ts
      formatPropertyValue.ts
      portalUrl.ts
    dev/
      mockData.ts
    types.ts
    App.tsx
    App.css
    index.tsx
  upload-params.json
  webpack.config.js
  tsconfig.json
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Blank white iframe (no text, no composer) | React hooks called after `if (!portToken) return` | Call all hooks before early returns; use `enabled` in `useQuery` |
| Blank iframe, zero height | Missing `#plugin-root` flex / shell `min-height` | Already handled in `App.css` — check for CSS overrides |
| Setup prompt / waiting for Port context | Opened outside Port or missing token | Embed via Port **Local development** or deploy; check `usePostMessageData.ts` mocks for `npm run dev` |
| "Place this widget on a GitHub External Property entity page" | Widget placed on a dashboard or a different blueprint's entity page | Move the widget to a `githubExternalCustomProperty` entity page |
| Error: "no github_org property and no relation to githubOrganization" | `blueprint_name` points to a blueprint that doesn't expose an org signal | Add a `github_org` property/mirror or an `organization` relation to `githubOrganization` on that blueprint |
| Empty data | `github_org` value on the host entity doesn't match any target entity | Verify catalog data; inspect Port API response in browser devtools |
| Port API error | Auth, wrong host, or malformed search body | Error includes response body; confirm nested `{ query: { combinator, rules } }` on entity search |
| Entity/run links open wrong region or 404 | `document.referrer` unavailable in standalone dev, or this org doesn't use an `/org_.../` path prefix | Expected at `localhost:9000`; test inside Port iframe or after deploy. If links 404 in Port, your org's routing may differ — adjust `getPortalBase()`/`buildWorkflowRunUrl()` in `src/utils/portalUrl.ts` |
| "No recent run found" for an entity that clearly has runs | The workflow's run history has more entries than fit in one `/v1/workflows/runs` page, or the match is older than the fetched window | See **Known limitations** — this is a best-effort search, not exhaustive |

## Known limitations

- No pagination on the entity list: if a target blueprint has a very large number of entities matching the org, only the first page returned by `/v1/blueprints/{id}/entities/search` is shown.
- "Latest sync run" resolution is best-effort for both the per-entity and bulk lookups: `GET /v1/workflows/runs` has no entity-level filter and no pagination cursor beyond its `limit=1000` cap, so each search walks that one page of the respective workflow's own run history. A run that isn't in that page is missed rather than searched for further.
- The bulk-sync lookup assumes the org-wide workflow is identified as `manage_sync_workflows` (see `BULK_SYNC_WORKFLOW_IDENTIFIER` in `src/api/workflowRuns.ts`) — if your org's managed workflow uses a different identifier, update that constant.
- The workflow-run link (`{portalBase}/organization/workflow-run?runId=...`) uses a URL pattern confirmed against this org but not documented by Port; if your org's routing differs, update `buildWorkflowRunUrl()` in `src/utils/portalUrl.ts`.
