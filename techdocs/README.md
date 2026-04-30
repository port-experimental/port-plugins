# TechDocs Plugin

A [Port](https://app.getport.io) plugin that provides a documentation browser for your repositories. It fetches `techDoc` entities from your Port catalog and renders their markdown content in a two-pane layout with sidebar navigation grouped by repository and folder.

![Widget Type](https://img.shields.io/badge/type-dashboard%20widget-blue)
![React](https://img.shields.io/badge/react-19-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.7-blue)

## Features

- Sidebar navigation grouped by repository and folder path
- Full GitHub-Flavored Markdown rendering (tables, code blocks, etc.)
- Copy file URL (GitHub) from the path chip in the header
- Inherits Port's theme (light/dark mode) automatically
- Configurable blueprint identifiers via widget parameters

## Images in ingested READMEs

> **External image URLs do not load in the widget.** Repository README and other markdown ingested as `techDoc` entities often include images via absolute URLs, for example `![Architecture](https://example.com/diagram.png)` or GitHub `user-attachments` links. Port custom widgets run inside a sandboxed iframe with a **Content Security Policy** that blocks loading **external media** (images, video, embeds, and similar remote assets). Those references will appear as broken images in TechDocs even though the same markdown renders correctly on GitHub.
>
> **What to do instead:** Keep diagrams and screenshots as plain text or tables in the markdown, commit images into the repo and link via the **View on GitHub** path chip (readers open the file in GitHub where images work), or avoid relying on inline images inside Port. This limitation applies to **documentation content** shown in the widget, not to badge URLs in this plugin README (shields.io badges are outside the iframe).

## Prerequisites

- A [Port](https://app.getport.io) account
- A [GitHub Ocean integration](https://docs.port.io/build-your-software-catalog/sync-data-to-catalog/git/github/) configured to ingest README files
- Node.js >= 20

## Setup

### 1. Create the required blueprints

The widget depends on two blueprints. If you already have a `githubRepository` blueprint from a GitHub integration, you only need to create `techDoc`.

Import them via the Port API or UI using the JSON files in [`blueprints/`](./blueprints/):

| File | Blueprint | Description |
|------|-----------|-------------|
| [`githubRepository.json`](./blueprints/githubRepository.json) | `githubRepository` | Repositories synced from GitHub (likely already exists) |
| [`techDoc.json`](./blueprints/techDoc.json) | `techDoc` | Individual documentation files linked to repositories |

### 2. Configure the GitHub Ocean integration mapping

Add the `file` resource mapping to your GitHub Ocean integration so it ingests README files as `techDoc` entities. The full mapping configuration is in [`blueprints/integration-mapping.yaml`](./blueprints/integration-mapping.yaml) — copy-paste it directly into your integration's mapping configuration.

The mapping defines two resource types:

- **`repository`** — Maps GitHub repos to `githubRepository` entities (includes README content)
- **`file`** — Scans for `**/README.md` files and maps each to a `techDoc` entity with markdown content, file path, folder path, and a GitHub URL

#### Scoping to specific repositories

By default the mapping scans all repositories the GitHub App has access to. To limit to specific repos, populate the `repos` array in the `file` selector:

```yaml
repos:
  - name: my-repo
    branch: main
  - name: another-repo
```

> **Tip:** Omit the `branch` field to let the integration auto-detect the default branch. Specifying a wrong branch causes a 404 during ingestion.

After updating the mapping, trigger a resync from the Port integrations page.

### 3. Build and deploy the widget

```bash
# Install dependencies
npm install

# Build (outputs dist/index.html — single self-contained file)
npm run build
```

### 4. Upload to Port

#### Set environment variables

```bash
export PORT_CLIENT_ID="your-port-client-id"
export PORT_CLIENT_SECRET="your-port-client-secret"
```

You can find these in **Port → Settings → Credentials**.

#### Install the CLI and configure

```bash
npm install -g @port-labs/port-plugins-cli

port-plugins config
```

The `config` command will prompt for your Client ID and Secret interactively (or use the env vars above).

#### Upload the widget

```bash
port-plugins upload \
  --file dist/index.html \
  --identifier techdocs-port-plugin \
  --title "TechDocs Viewer" \
  --params "$(cat upload-params.json)" \
  --upsert
```

> **US region?** Add `--base-url https://api.us.port.io`

### 5. Add to a dashboard

1. Go to any Port dashboard
2. Click **+ Widget** → **Custom Widget**
3. Select **TechDocs Viewer**
4. Optionally override the `techDocBlueprint` or `techdocsSourceBlueprint` parameters (defaults are `techDoc` and `githubRepository`)

### Service entity pages

When the widget is embedded on an **entity page** whose blueprint is **`service`** or **`microservice`** (case-insensitive, or names you list in `serviceContextBlueprints`), the sidebar lists only tech docs that belong to that service:

1. **Direct link:** If a tech doc has the **`service`** relation (configurable via `serviceRelationKey`) set, it is shown only when it points at the **current entity’s identifier**.
2. **Inverse link (Related Entities):** If the **service** entity lists related tech docs under relation keys such as **`techDoc`** or **`techDocs`** (see `hostTechDocRelationKeys`), those docs are included even when the tech doc row does **not** store `service` back. This matches what you see under **Related Entities** in Port.
3. **Repository fallback:** If neither of the above applies, a doc is included when its **`repository`** relation matches any **repository** / **githubRepository** relation on the host service.

The widget loads the **full** service entity with [`GET /v1/blueprints/{blueprint}/entities/{identifier}`](https://docs.getport.io/api-reference/get-an-entity) because Port’s `PLUGIN_DATA` message often omits **relations**; without that, matching would fail and the sidebar would look empty.

On dashboards or non-service entity pages, all tech docs are shown as before.

## Widget Parameters

Configured via `upload-params.json`:

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `techDocBlueprint` | string | No | `techDoc` | Blueprint identifier for documentation entities (if not provided we'll use `techDoc` as default blueprint identifier) |
| `techdocsSourceBlueprint` | string | No | `githubRepository` | Blueprint identifier for repository entities (if not provided we'll use `githubRepository` as default blueprint identifier) |

## Local Development

```bash
npm install
npm run dev   # starts webpack-dev-server at http://localhost:9000
```

The widget includes a **dev mock mode** that activates automatically when running outside Port's iframe. It renders sample documentation so you can develop the UI without a live Port connection.

To test **service-scoped filtering** locally, in [`src/hooks/usePostMessageData.ts`](src/hooks/usePostMessageData.ts) set e.g. `MOCK_ENTITY_ID = "mock-backend-service"`, `MOCK_ENTITY_BLUEPRINT = "service"` (only **Backend Docs** mock has a `service` relation). For **repository fallback** only, use blueprint `service` and set `MOCK_ENTITY_REPOSITORY_RELATION = "Node"` with docs that have no `service` relation.

To test inside Port: edit a custom widget → toggle **"Local development"** → the iframe loads `http://localhost:9000`.

## Project Structure

```
techdocs/
├── blueprints/
│   ├── githubRepository.json    # Repository blueprint definition
│   ├── techDoc.json             # Tech Doc blueprint definition
│   └── integration-mapping.yaml # GitHub Ocean integration mapping
├── src/
│   ├── index.html               # HTML shell
│   ├── index.tsx                 # React entry point
│   ├── App.tsx                   # Main widget component
│   ├── App.css                   # Styles (uses Port theme variables)
│   ├── types.ts                  # TypeScript types
│   ├── api/
│   │   ├── fetchDocs.ts          # Port API client for techDoc entities
│   │   └── fetchEntity.ts        # GET host entity (relations for service filtering)
│   ├── components/
│   │   ├── Sidebar.tsx           # Tree navigation sidebar
│   │   ├── DocViewer.tsx         # Markdown document viewer
│   │   └── ColumnResizeHandle.tsx
│   ├── hooks/
│   │   ├── usePostMessageData.ts # Port iframe communication (via plugins-sdk)
│   │   └── useMediaQuery.ts
│   └── utils/                    # column widths, service filter, tech doc props
├── package.json
├── upload-params.json            # Widget parameter definitions
├── webpack.config.js             # Builds single self-contained HTML
└── tsconfig.json
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| "Waiting for Port context..." | Running outside iframe without mock | Normal in dev — mock data will render |
| No documents in sidebar | `techDoc` entities not ingested | Check GitHub Ocean integration mapping and trigger resync |
| 422 error on API call | Wrong search body structure | Ensure `combinator`/`rules` are nested inside `{ query: {...} }` |
| Missing repo docs | Wrong branch in integration mapping | Omit `branch` from `repos` to auto-detect, or verify branch name |
| No docs on a **Service** page | Service has no `repository` / `githubRepository` relation, or it doesn’t match tech docs’ repo | In Port, link the service to the same repository entity as your README `techDoc` rows; or set an explicit `service` relation on each tech doc |
| `Failed to load entity` in console | JWT can’t read that blueprint | Ensure the widget’s Port app / token can call **Get an entity** for the Service blueprint |
| Widget ignores Port theme | `applyThemeCss()` not called | Ensure `usePostMessageData` hook calls `sdk.applyThemeCss()` on mount |
| Broken images in doc body | README uses `https://…` image URLs | Port plugin CSP blocks external media; see [Images in ingested READMEs](#images-in-ingested-readmes) |
