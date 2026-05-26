# TechDocs Plugin

A [Port](https://app.getport.io) plugin that provides a documentation browser for your repositories. It fetches `techDoc` entities from your Port catalog and renders their markdown content in a two-pane layout with sidebar navigation grouped by repository and folder.

![Version](https://img.shields.io/badge/version-0.2.0-blue)
![Widget Type](https://img.shields.io/badge/type-dashboard%20widget-blue)
![React](https://img.shields.io/badge/react-19-blue)
![TypeScript](https://img.shields.io/badge/typescript-5.7-blue)

## Features

- Sidebar navigation grouped by repository and folder path
- Full GitHub-Flavored Markdown rendering (tables, code blocks, etc.)
- **Internal markdown links** — relative links between ingested `.md` files (e.g. `[guide](docs/guide.md)`, `[root](../README.md)`) open in the sidebar viewer instead of leaving the widget
- **External links** — `https://`, `mailto:`, and similar URLs open via Port’s link bridge (`@port-labs/plugins-sdk` ≥ 0.1.1)
- Copy file URL (GitHub) from the **View source** control in the header
- Inherits Port's theme (light/dark mode) automatically
- Configurable blueprint identifiers via widget parameters

## Images in ingested READMEs

> **External image URLs do not load in the widget.** Repository README and other markdown ingested as `techDoc` entities often include images via absolute URLs, for example `![Architecture](https://example.com/diagram.png)` or GitHub `user-attachments` links. Port custom widgets run inside a sandboxed iframe with a **Content Security Policy** that blocks loading **external media** (images, video, embeds, and similar remote assets). Those references will appear as broken images in TechDocs even though the same markdown renders correctly on GitHub.
>
> **What to do instead:** Keep diagrams and screenshots as plain text or tables in the markdown, commit images into the repo and link via the **View source** control (readers open the file in GitHub where images work), or avoid relying on inline images inside Port. This limitation applies to **documentation content** shown in the widget, not to badge URLs in this plugin README (shields.io badges are outside the iframe).

## Internal and external markdown links

TechDocs resolves **relative** markdown links against the current document’s `filePath` and the **same** `repository` relation (from your tech doc blueprint / source blueprint wiring). When a matching `techDoc` entity exists, the link navigates in-widget (sidebar selection + viewer update). Otherwise the link is not treated as internal.

| Link type | Example | Behaviour |
|-----------|---------|-----------|
| Internal (same repo) | `[Backend](../apps/Backend/README.md)` | Opens the matching ingested doc in the viewer |
| Repo-root path | `[Guide](/docs/guide.md)` | Resolved from repository root (leading `/`) |
| Same-page hash | `[Endpoints](#endpoints)` | Scrolls within the current doc (when a heading id exists) |
| Cross-repo relative | `[Other](../README.md)` on repo B | Resolves within repo B only — not another repository’s docs |
| External | `[Port](https://docs.getport.io)` | Opens via Port’s iframe link bridge |

**Requirements for internal links to work in production:**

- The GitHub `file` mapping must ingest the target paths as `techDoc` entities (see [integration mapping](#2-configure-the-github-ocean-integration-mapping)); each entity needs a correct **`filePath`** property.
- The target document must already be loaded in the widget (sidebar list). On large catalogs, scroll the sidebar to **load more** before following a link to a doc that has not been fetched yet.

Port’s plugin SDK intercepts ordinary `<a href>` clicks in the iframe. Internal targets are rendered as controls that do not trigger that bridge, so navigation stays inside TechDocs.

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
- **`file`** — Scans for `**/*.md` files and maps each to a `techDoc` entity with markdown content, **`filePath`**, **`folderPath`**, and a GitHub URL (internal link resolution uses **`filePath`**)

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
4. Optionally set **Tech Doc blueprint** and **Tech Doc related blueprint** (defaults: `techDoc` and `githubRepository`)

### Entity page behaviour

When the widget runs on an **entity page** (Port sends `PLUGIN_DATA.entity` with blueprint and identifier), the sidebar lists only **tech docs related to that host entity**. On **dashboards** (no host entity), it loads all ingested tech docs as before.

Related docs are resolved with [`POST /v1/blueprints/{techDocBlueprint}/entities/search`](https://docs.getport.io/api-reference/search-entities) using **`relatedTo`** from the host entity on the tech doc blueprint.


## Widget Parameters

Configured via `upload-params.json`:

| Label (Port UI) | Parameter key | Type | Required | Default | Description |
|-----------------|---------------|------|----------|---------|-------------|
| Tech Doc blueprint | `techDocBlueprint` | blueprint | No | `techDoc` | Blueprint for documentation entities |
| Tech Doc related blueprint | `techdocsSourceBlueprint` | blueprint | No | `githubRepository` | Blueprint for related repository entities (sidebar grouping) |

## Local Development

```bash
npm install
npm run dev   # starts webpack-dev-server at http://localhost:9000
```

The widget includes a **dev mock mode** that activates automatically when running outside Port's iframe (`NODE_ENV=development` and not embedded in Port’s iframe). It renders sample documentation from [`src/utils/mocks.ts`](src/utils/mocks.ts) so you can develop the UI without a live Port connection. Mock responses are **paginated** (two entities per page) like the real API — scroll the sidebar to load more docs before testing links to pages that are not on the first page.

**Internal link examples in mocks** (open **Frontend Docs** after loading the Node repo pages):

- `../../README.md` — repo root from `apps/Frontend/`
- `https://react.dev` — external (opens via Port bridge when embedded; in standalone dev, behaves as a normal browser navigation)

Other mocks: **Node Docs** (links into `apps/…` and `test/`), **Backend**, **test/README2.md**, and **FlameBot** (documents same-repo-only resolution).

To test **entity-page filtering** locally, in [`src/hooks/usePostMessageData.ts`](src/hooks/usePostMessageData.ts) set `MOCK_ENTITY_ID` and `MOCK_ENTITY_BLUEPRINT` (for example `"mock-backend-service"` and `"service"` — only **Backend Docs** mock has a `service` relation).

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
│   │   ├── fetchRelatedTechDocSearch.ts  # Entity-page search rules + pagination
│   │   └── fetchBlueprintSchema.ts       # Blueprint relations / path discovery
│   ├── components/
│   │   ├── Sidebar.tsx              # Tree navigation sidebar
│   │   ├── DocViewer/
│   │   │   ├── DocView.tsx          # Markdown document viewer
│   │   │   ├── markdownComponents.tsx  # Internal vs external link rendering
│   │   │   ├── LoadingDocsView.tsx
│   │   │   └── ErrorDocView.tsx
│   │   └── ColumnResizeHandle.tsx
│   ├── hooks/
│   │   ├── usePostMessageData.ts    # Port iframe communication (via plugins-sdk)
│   │   ├── useDocs.ts               # Paginated tech doc loading
│   │   └── useMediaQuery.ts
│   └── utils/
│       ├── internalDocLinks.ts      # Relative path resolution + doc lookup
│       ├── mocks.ts                 # Dev mock entities (incl. link examples)
│       └── …                        # column widths, relation id helpers, etc.
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
| No docs on an **entity** page | Host and tech docs are not connected in the catalog (no shared relation target, traversable path, or `relatedTo` link) | Add or fix **relations** so host and `techDoc` share a bridge (e.g. same `githubRepository`) or link directly; trigger resync if needed |
| `Failed to load blueprint` in console | JWT can’t read blueprint schemas | Ensure the widget token can call **Get a blueprint** for the host and tech doc blueprints |
| Widget ignores Port theme | `applyThemeCss()` not called | Ensure `usePostMessageData` hook calls `sdk.applyThemeCss()` on mount |
| Broken images in doc body | README uses `https://…` image URLs | Port plugin CSP blocks external media; see [Images in ingested READMEs](#images-in-ingested-readmes) |
| Internal markdown link does nothing | Wrong relative path, different `repository`, or target doc not loaded yet | Fix path (e.g. `../../README.md` from `apps/Frontend/`, not `../README.md`); ensure both docs share the same repo relation; scroll sidebar to load more entities |
| Internal link opens Port / new tab | Link treated as external | Only same-repo relative paths matching an ingested `filePath` stay in-widget; `https://` links always use the SDK bridge |
| External link fails in Port | Outdated SDK | Use `@port-labs/plugins-sdk` ≥ 0.1.1 (see [Internal and external markdown links](#internal-and-external-markdown-links)) |
