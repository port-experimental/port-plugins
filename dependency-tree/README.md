# Dependency Tree

An interactive dependency graph widget for [Port](https://app.port.io) entity pages. Performs a BFS traversal of an entity's relations up to a configurable depth and renders the result as a zoomable, pannable flow graph using ReactFlow and a Dagre layout engine.

## Preview image

<img width="1068" height="866" alt="Dependency Tree widget" src="https://github.com/port-experimental/port-plugins/blob/main/dependency-tree/assets/preview.png" />

## Features

- BFS traversal downstream (dependencies) and optionally upstream (dependents)
- Configurable max depth (default: 3)
- Up to 2 configurable badge properties displayed on each node
- Relation-type filter bar to show/hide specific relation labels
- Upstream toggle persisted across page navigations via localStorage
- Scorecard rule-result entities filtered by default (configurable)
- Clickable nodes open the entity page in Port
- Light/dark theme support via Port SDK

## Prerequisites

### Access

Must be opened from an entity page. The entity must have relations defined in its blueprint schema.

### Blueprints & properties

No new blueprints required. The widget traverses existing catalog relations using `POST /v1/entities/search` with the `relatedTo` operator.

**Note:** Scorecard rule-result entities (blueprint identifiers ending in `_rule_result`) appear as upstream relations on almost every entity. These are hidden by default; set `showRuleResults: true` to reveal them.

## Widget parameters

| Key | Type | Required | Default | Description |
|-----|------|----------|---------|-------------|
| `maxDepth` | number | no | 3 | Max BFS traversal depth in each direction |
| `badge1Property` | string | no | — | Property key to display as a badge on each node (e.g. `status`) |
| `badge2Property` | string | no | — | Second badge property key |
| `showUpstream` | boolean | no | true | Show upstream (dependents) in addition to downstream (dependencies) |
| `showRuleResults` | boolean | no | false | Include `*_rule_result` scorecard entities in the graph |

## Local development

```bash
cd dependency-tree
npm install
npm run dev   # http://localhost:9000
```

Configure mock entity context in `src/hooks/usePostMessageData.ts`. The widget requires an entity context; without it, a setup prompt is shown.

## Setup

### Build

The build step runs webpack and then a post-build patch script (`scripts/patch-bundle.js`). The patch replaces a dynamic eval pattern emitted by the dagre/graphlib bundle that Port's security scanner rejects. The resulting `dist/index.html` is safe to upload.

```bash
npm install
npm run build   # output: dist/index.html
```

### Upload

```bash
port-plugins upload \
  --file dist/index.html \
  --identifier dependency-tree-port-plugin \
  --title "Dependency Tree" \
  --params "$(cat upload-params.json)" \
  --upsert
```

See [@port-labs/port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) for CLI install and credential setup.

### Add in Port

1. Open an entity page and edit its layout
2. Add widget → Custom widget → select **Dependency Tree**
3. Optionally configure `maxDepth`, badge properties, and upstream toggle
4. Save

## Project structure

```
dependency-tree/
  scripts/
    patch-bundle.js           # Post-build: replaces dynamic eval patterns
  src/
    components/
      DependencyTree/
        DependencyTree.tsx    # Main flow canvas
        DependencyTree.css    # Scoped styles
        EntityNode.tsx        # ReactFlow custom node
        EmptyState.tsx        # No-relations state
        ErrorBanner.tsx       # Error + retry
        LoadingSkeleton.tsx   # Loading state
        RelationFilterBar.tsx # Relation-type toggles
        index.ts
    hooks/
      useDependencyTree.ts    # BFS traversal (downstream + upstream)
    utils/
      collectRelationEdges.ts # Edge extraction from entity relations
      dagreLayout.ts          # Dagre graph layout
      portEntityUrl.ts        # Entity page URL via document.referrer
      relationColors.ts       # Relation-type color mapping
    types.ts
    App.tsx
    index.tsx
  upload-params.json
  webpack.config.js
  tsconfig.json
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Setup prompt shown | Widget opened from a dashboard, not entity page | Place widget on an entity page layout |
| Graph shows only root node | Entity has no relations | Add relations to the blueprint in Port |
| Security rejection on upload | Dynamic eval pattern in bundle | Run `npm run build` (patch script runs automatically) |
| Graph cluttered with rule-result nodes | `showRuleResults` is true | Set `showRuleResults: false` (default) |
| Upstream BFS returns 0 results | Verify blueprints have relations | Widget uses the `relatedTo` operator; catalog relations required |
| Entity links open wrong region | `document.referrer` unavailable in dev | Expected in local dev; works correctly inside Port iframe |
