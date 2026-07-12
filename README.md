# Port Plugins

This repository contains plugins contributed by [Port.io](https://www.port.io).

## Plugins

| Widget | Version | Description |
|--------|---------|-------------|
| [Entity Calendar](./entity-calendar) | 0.2.0 | Month calendar marking entity creation dates; click a day to view title and identifier |
| [Entity Cards View](./entity-cards-view) | 0.1.1 | Display Blueprint entities as customizable cards with configurable properties |
| [Scorecard Dashboard](./scorecard-dashboard) | 0.1.0 | Scorecard compliance dashboard grouped by team with grade thresholds and per-rule breakdown |
| [Scorecard Goals](./scorecard-goals) | 0.1.0 | Per-scorecard compliance bars for a selected blueprint, with drill-down into failing entities and rules |
| [TechDocs](./techdocs) | 0.3.0 | Documentation browser for ingested markdown; sidebar by repository and folder, in-widget relative links between docs, external URLs via Port link bridge |
| [Blueprint Table](./blueprint-table) | 0.1.0 | Multi-blueprint entity table with configurable columns; supports up to 5 blueprints with tab navigation |
| [Dependency Tree](./dependency-tree) | 0.1.0 | Interactive dependency graph with BFS traversal; shows upstream/downstream relations with configurable depth and relation filtering |
| [DORA Dashboard](./dora-dashboard) | 0.1.0 | DORA metrics dashboard (Deployment Frequency, Lead Time, Change Failure Rate, MTTR) with historical trends |
| [Survey Analytics](./engineering-intelligence-survey-analytics) | 0.1.1 | Survey Intelligence: read-only analytics for survey responses (scores, trends, team breakdown, multi-select, and a bundled DORA benchmark) |
| [Survey Forms](./engineering-intelligence-survey-forms) | 0.1.1 | Survey Intelligence: run engineering surveys inside Port; renders any authored survey and stores each submission as a scored response entity |
| [Survey Builder](./engineering-intelligence-survey-builder) | 0.1.1 | Survey Intelligence: author engineering surveys (SPACE, AI Adoption, DORA, DX Core 4, or custom) visually and save them as Port survey entities |
| [Skill View](./skill-view) | 0.1.0 | File-navigator viewer for a skill entity — SKILL.md plus references, scripts, and assets |

## AI-assisted development - Skills (Cursor & Claude)

This repo ships the same **create-port-plugin** skill for [Cursor](./.cursor/skills/create-port-plugin/) and [Claude Code](./.claude/skills/create-port-plugin/):

| Tool | Skill path |
|------|------------|
| **Cursor** | [`.cursor/skills/create-port-plugin/`](./.cursor/skills/create-port-plugin/) |
| **Claude Code** | [`.claude/skills/create-port-plugin/`](./.claude/skills/create-port-plugin/) |

In either editor, ask the agent to create or extend a plugin; it will follow the skill’s workflows (reuse an existing widget, scaffold from templates, align `upload-params.json`, and document prerequisites in the plugin’s README).

**After the skill generates or updates a plugin**, read that plugin’s **README** end to end. It is the single source of truth for everything you need to run the widget: Port catalog setup (blueprints, properties, and relations), widget parameters, local development, and uploading the plugin to your organization.

## Port MCP (recommended)

For design-time discovery of your Port catalog, install the [Port MCP server](https://docs.port.io/ai-interfaces/port-mcp-server/overview-and-installation/#install-port-mcp) in your IDE. This allows both you and the create-port-plugin skill to inspect **blueprints** (properties and relations), sample **entities**, and other Port data while planning a widget — without hard-coding catalog details in plugin parameters. MCP is for planning in the editor; widget runtime code should use the Port HTTP API and host context (`PLUGIN_DATA`), not MCP.

## Port Plugins CLI (required)

Build, upload, and manage plugins with the [Port Plugins CLI](https://docs.port.io/customize-pages-dashboards-and-plugins/plugins/#port-plugins-cli) (`@port-labs/port-plugins-cli`). Install it globally or per plugin, then use commands such as `port-plugins upload` and `port-plugins list` as documented in each plugin’s README. The CLI is required to register widgets in your Port organization.

## License

This repository is licensed under the [Apache License 2.0](./LICENSE).

## Contributions

This repository is not currently accepting external contributions. See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## Disclaimer

The plugins in this repository are provided by Port.io on an "as-is" and "as-available" basis, without warranties or conditions of any kind, whether express, implied, or statutory, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. Port.io does not provide support, maintenance, updates, or service-level commitments of any kind for these plugins. Use of any plugin in this repository is entirely at your own risk. For details, see the [LICENSE](./LICENSE) file.

## Trademark Notice

"Port" and the Port.io logo are trademarks of Port.io. The open-source license granted herein does not grant any rights to use Port.io's trademarks, trade names, logos, or service marks, whether for purposes of identifying forked or derivative works or otherwise.
