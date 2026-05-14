---
name: create-custom-widget
description: Scaffold, extend, or bring up to standard Port custom plugins (widgets) — self-contained React/TypeScript apps in iframes. Survey the project before duplicating work; prefer @port-labs/plugins-sdk, native blueprint params, per-plugin README structure (§8), and @port-labs/port-plugins-cli per Port docs. Use when creating, adapting, or auditing a Port custom widget or plugin.
---

# Create a Port Custom Widget

## Official documentation (source of truth)

Platform rules (CSP, upload limits, param metadata), SDK APIs, and CLI behavior are defined by Port. **Treat the docs and npm readmes as authoritative** and keep dependency versions current.

- **Plugins overview:** [Plugins — Port Docs](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins)
- **SDK:** [`@port-labs/plugins-sdk` on npm](https://www.npmjs.com/package/@port-labs/plugins-sdk) — host bridge, `usePortPluginData`, theming, `mergePageFilters`
- **CLI:** [`@port-labs/port-plugins-cli` on npm](https://www.npmjs.com/package/@port-labs/port-plugins-cli) — upload, list, update, delete, plugin metadata

Minimal starter: [port-plugin-sample](https://github.com/port-labs/port-plugin-sample).

## Core Principles: Reusability and Extensibility

**This skill prioritizes:**
1. ✅ **Reusing existing widgets and blueprints** over creating duplicates
2. ✅ **Identifying patterns** across the codebase before starting work
3. ✅ **Designing for extension** with flexible, composable parameters
4. ✅ **Documenting blueprint relationships** across widgets
5. ✅ **Evolving the catalog when justified** — new properties, relations, or blueprints are part of shipping a correct feature; document them and do not defer them solely to avoid Port admin work

**Always start by analyzing existing implementations. Only create new widgets when necessary.**

## Overview

Port widgets are single-file React/TypeScript apps compiled by webpack into a self-contained `dist/index.html` (all JS/CSS inlined). They run inside an `<iframe>` in Port dashboards or entity pages and communicate with the host via `postMessage`.

Each widget can define **params** (metadata in `upload-params.json`) that admins fill when they add a custom widget. Params often include **blueprints**, **relation keys** (string params), and **property identifiers** (string params). **Multiple widgets can target the same catalog concepts** when you keep naming consistent inside your org.

At **runtime**, the widget loads and mutates data only through the **Port HTTP API** (`portApiBaseUrl` + bearer token from the host); MCP and other IDE tooling are for design-time catalog discovery, not for data inside the iframe.

## Bringing an existing plugin up to standard

Use this path when the goal is **not** greenfield scaffolding but to **audit and align** an existing plugin directory with the conventions in this skill (README, params, SDK/host bridge, build output, upload docs, API usage).

### When to use

- Per-plugin **`README.md`** is missing, thin, or out of order versus **§8 Per-plugin `README.md` standard (required)** later in this skill (preview image, parameters table before setup, canonical upload command, troubleshooting, and so on).
- **`upload-params.json`** drifted from **`src/types.ts`**, overuses `string` where **`type: "blueprint"`** fits, or ignores the five-blueprint-param cap (see [CLI metadata](https://www.npmjs.com/package/@port-labs/port-plugins-cli)).
- **`@port-labs/plugins-sdk`** is outdated or the host bridge omits **`applyThemeCss()`**, **`usePortPluginData`**, or dashboard **`mergePageFilters`** when page filters should apply.
- **Build / runtime** issues covered in **Critical Configuration Requirements** and [plugin-architecture.md](references/plugin-architecture.md) (Webpack `inject: "body"`, root height, entity search `{ query: { ... } }`, error surfacing).
- **Upload** instructions missing the canonical **`port-plugins upload`** line or contradicting current CLI/auth.

### Workflow

1. **Read** — `README.md`, `upload-params.json`, `package.json` (`engines`, dependencies), `src/types.ts`, host hook (`usePostMessageData` / `usePortPluginData`), main UI entry, any API modules, `webpack.config.js`, root CSS.
2. **Gap analysis** — Compare against §8 README order, params guidance in **§5 Define parameters (`upload-params.json`)**, **Theming**, **Build & deploy**, and [widget-conventions.md](references/widget-conventions.md) / [plugin-architecture.md](references/plugin-architecture.md).
3. **Prioritize** — Correctness first (Port API request shapes, token usage, theme), then operator docs (README, param table), then polish (badges, screenshots, structure tree).
4. **Patch** — Keep diffs focused: bump SDK with hook changes; keep `PluginConfig` and `upload-params.json` in lockstep; rewrite README sections rather than deleting useful catalog/integration detail.
5. **Verify** — `npm ci` / `npm install`, `npm run build`, smoke in **Local development** mode and/or in Port; update the **repo-level** widgets table row (step 7 under scaffolding) if the public description or behaviour changed materially.

### PR checklist (copy into description)

- [ ] **`README.md`** matches §8 section order and quality bar (preview asset, params before setup, local dev, canonical upload command + CLI link, troubleshooting).
- [ ] **`upload-params.json`** ↔ **`types.ts`** aligned; **`blueprint`** types used where admins pick blueprints; ≤5 blueprint params.
- [ ] **SDK** current enough for your needs (see [plugins-sdk on npm](https://www.npmjs.com/package/@port-labs/plugins-sdk)); theme applied when host sends `theme.css`.
- [ ] **Webpack / CSS** meet **Critical Configuration Requirements** in this skill.
- [ ] **Entity search** bodies use `{ query: { combinator, rules } }` where applicable; errors surfaced with response body text.
- [ ] **`npm run build`** succeeds; **`dist/index.html`** is the upload artifact.
- [ ] **Persistence:** Meaningful saved state uses the Port API where feasible; browser storage only when it is intentionally local-only (see **Data Persistence** in this skill).

## CRITICAL: Check for Reusable Implementations FIRST

**Before creating any new widget**, follow these steps in order. Widget reuse is decided first; blueprint and params design only happens once the widget strategy is clear.

**Catalog changes are normal.** Reuse the catalog when it fits, but do not avoid new properties or new blueprints out of caution alone. If the use case needs a relation, a typed field, or a dedicated entity type, recommend that change and document it clearly (README tables, migration notes for integrations). A correct model beats a contorted workaround.

### Step 1: Analyze the Request for Port Abstractions

Identify which **catalog concepts** (blueprints, properties, relations, user-scoped data) the widget needs. Naming is **organization-specific** — do not assume every Port customer uses the same blueprint IDs or relation keys.

Examples of **domains** (map each to *their* blueprints, not fixed names):

- **Threaded discussion / comments** → Often a dedicated blueprint plus relations to a parent entity and to users
- **Work tracking** → Often one or more blueprints for items, timeboxes, ownership
- **Personalization / bookmarks** → Often properties or relations on the user entity
- **Status / lifecycle** → Properties and relations as modeled in *their* data model

### Step 2: Survey Existing Widgets

Read the project’s `README.md` (or equivalent index) to see existing widgets. For each potentially related widget:

1. **Read `upload-params.json`** to understand which blueprints it references
2. **Read `src/types.ts`** to see the data model (PluginConfig interface)
3. **Read key parts of `src/App.tsx`** to understand the implementation approach

### Step 3: Decide the Widget Strategy

Based on the survey, choose one of the following paths **before** touching blueprints or params:

| Scenario | Decision |
|----------|----------|
| **Exact match** | Widget already exists — tell the user to use it and stop here |
| **Superset** | Existing widget does more than requested — recommend it with specific params and stop |
| **Similar (60%+ overlap)** | Copy the existing widget directory and adapt it — reuse its blueprint params as starting point |
| **Partial overlap** | Create a new widget but **reuse the blueprint params** from the overlapping widget |
| **No overlap** | Create a new widget from the scaffold templates |

> **Only continue to Step 4 if the decision is to adapt or create a widget (not reuse as-is).**

### Step 4: Search Existing Port Blueprints via MCP

With the widget strategy decided, query the live Port catalog to determine what catalog changes (if any) the widget will require. Use the available Port MCP tools to list blueprints and inspect the ones that match the use case (properties, relations, identifiers).

#### Blueprint strategy decision matrix

| Outcome | When to choose |
|---------|---------------|
| **Use existing blueprint + existing properties** | A blueprint already models the concept; all needed properties are present; no schema change required |
| **Use existing blueprint + add new property** | The right blueprint exists but lacks fields or relations the widget needs — extend it and document the additions |
| **Create new blueprint** | The concept has a distinct lifecycle, ownership, or relations set that doesn’t map onto any existing blueprint |

Choosing outcomes **B** or **C** is normal whenever the widget needs data or structure the catalog does not yet express. Prefer hacks or ambiguous “generic” fields only when there is a deliberate, documented reason.

**Guiding signals:**

| Signal | Prefer new blueprint | Prefer new property on existing |
|--------|---------------------|---------------------------------|
| Concept has its own identity / lifecycle | ✅ | |
| Concept is a facet of an existing entity | | ✅ |
| Requires unique relations not applicable to the parent | ✅ | |
| Just needs 1–3 extra fields on a known entity | | ✅ |
| Would be ingested / synced from a separate external source | ✅ | |

Always **explain your decision** to the user: which blueprints you found, why the chosen outcome fits the use case, and what schema changes (if any) are needed. When schema changes are required, state them plainly — operators expect catalog work alongside non-trivial widgets.

### Step 5: Define Blueprint and Params for the Widget

Apply the blueprint strategy from Step 4:

**If using an existing blueprint + existing properties:**
- Reference the blueprint identifier directly in `upload-params.json` (type `"blueprint"`)
- No catalog changes required; document which blueprint is expected and why in the widget README

**If using an existing blueprint + new property:**
- Present the required property additions as a table in the README **Prerequisites** section, e.g.:

  | Blueprint | Property name | Type | Required | Description |
  |-----------|--------------|------|----------|-------------|
  | `my-blueprint` | `resolvedAt` | `datetime` | No | When the item was resolved |

- Expose the property key as a configurable `string` param so admins can align it if their instance uses a different name

**If creating a new blueprint:**
- Present the full blueprint schema as tables in the README **Prerequisites** section, e.g.:

  **Blueprint**

  | Field | Value |
  |-------|-------|
  | Identifier | `discussion` |
  | Title | Discussion |

  **Properties**

  | Name | Identifier | Type | Required | Description |
  |------|-----------|------|----------|-------------|
  | Body | `body` | `string` | Yes | Message text |
  | Created at | `createdAt` | `datetime` | Yes | Timestamp |

  **Relations**

  | Name | Identifier | Target blueprint | Required |
  |------|-----------|-----------------|----------|
  | Author | `author` | `_user` | Yes |
  | Parent | `parent` | *(configured at runtime)* | Yes |

- Expose the new blueprint as a `"type": "blueprint"` param in `upload-params.json`

**General rules:**
- Reuse the same blueprint identifiers across widgets (e.g., if `commentBlueprint` exists, use it)
- Follow the same property naming conventions (e.g., `messageProperty`, `authorProperty`)
- Copy the parameter structure from `upload-params.json` for shared concepts when adapting a widget
- **Prefer extending an existing blueprint** (new properties or relations) when the concept is still the same entity type — it is usually simpler operationally than introducing another blueprint
- **Add a new blueprint when the use case needs it** — distinct lifecycle, ownership, ingestion source, or relations that do not belong on a parent entity. Do not shrink the model to fit an empty catalog; propose the blueprint and document it in the README tables

**DON’T:**
- Create duplicate blueprints for the same concept (e.g., two different comment blueprints)
- Reinvent property names (use existing conventions)
- Build from scratch when adapting an existing widget is faster
- Shy away from catalog changes: stuffing unrelated data into one property, overloading a wrong blueprint, or leaving operators without a clear schema plan when a property or blueprint is the right fix
- Create a new blueprint when a few new properties on an existing blueprint would model the same thing cleanly

### Examples of reuse decisions

The steps below use **sample folder and param names** for clarity. In a real project, use the directories and `upload-params.json` definitions that actually exist in **your** codebase.

#### Example 1: Request for "comment widget on tasks"
```
1. Check README → `task-comment-chat` exists
2. Read upload-params.json → Uses commentBlueprint, taskRelation, commentorRelation
3. Decision: Widget already exists
4. Response: "The task-comment-chat widget already implements this. It's configurable 
   via commentBlueprint, taskRelation, and other parameters. Here's how to configure it..."
```

#### Example 2: Request for "full project management dashboard with tasks, comments, and milestones"
```
1. Check README → `task-comment-chat` (comments), `current-iteration` (tasks/teams)
2. Analysis:
   - Comments: ✅ Implemented in task-comment-chat (uses commentBlueprint)
   - Tasks: ✅ Implemented in current-iteration (uses taskBlueprint)
   - Milestones: ❌ Not implemented
3. Decision: Build new dashboard widget that:
   - REUSES commentBlueprint and taskBlueprint from existing widgets
   - ADDS new milestone blueprint
   - Integrates all three in one view
4. Response: "I'll create a project dashboard that reuses existing blueprints:
   - commentBlueprint (from task-comment-chat)
   - taskBlueprint (from current-iteration)
   - NEW: milestoneBlueprint
   This ensures consistency with your existing widgets."
```

#### Example 3: Request for "bug tracking widget"
```
1. Check README → `current-iteration` uses taskBlueprint
2. Analysis: Bug tracking is similar to task tracking
3. Decision: Bugs could use the existing taskBlueprint with different filters/views,
   OR create a separate bugBlueprint if the data model differs significantly
4. Response: "You have two options:
   Option A: Reuse taskBlueprint with a 'type' property to distinguish bugs
   Option B: Create separate bugBlueprint if bugs have unique fields
   I recommend Option A for simplicity unless bugs need different properties."
```

### Checking Port Blueprints Programmatically

Use the available Port MCP tools to query the live catalog while **designing** the widget (see **Step 4** above). When working inside an existing plugin repo, **also survey that project’s `upload-params.json` files** — they reveal which blueprint IDs are already wired across widgets.

**Runtime vs. design:** Anything the widget loads, lists, filters, or mutates while the user interacts with it must go through the **Port HTTP API** using `portApiBaseUrl` and `portToken` from the host (see **Implement the widget** below). MCP exists for the agent in the IDE, not inside the iframe — **never** assume MCP or catalog snapshots replace live API calls for entity data.

## Discovering patterns in your codebase

As you analyze widgets **in the project you are changing**, you will often see **recurring param names** and combinations (discussion + parent entity, work items + team, user-scoped lists, and so on). Use that to **avoid duplicate plugins** and to keep params **consistent within the same codebase and catalog**.

Sample names in this skill are **illustrative**; blueprint identifiers and relations always come from **your** Port catalog. For platform rules (param types, limits, CSP, upload flow), use [Port Plugins docs](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins) and the [CLI metadata reference](https://www.npmjs.com/package/@port-labs/port-plugins-cli).

### Principles

1. **Survey existing `upload-params.json` files** in the project before inventing a second param for the same concept.
2. **Name params by semantic role** (what the value *means* in your UI), not by incidental sample data.
3. **Prefer Port’s native `type: "blueprint"`** when the admin should pick a blueprint — see [Define parameters](#5-define-parameters-upload-paramsjson). Use `string` (and similar) for relation identifiers, property keys, labels, and other non-blueprint configuration.
4. **Composite widgets:** list related existing widgets, reuse compatible param shapes, and document lineage in the PR.
5. **Runtime data always via Port API** — entity lists, details, and writes use `fetch` (or your HTTP client) against `portApiBaseUrl` with the host token; never substitute MCP or hard-coded catalog snapshots for live reads.
6. **Persist meaningful state through the Port API when it should follow the user or org** — for example after reload, on another device or browser, or when visibility should respect Port permissions. Use `localStorage` / `sessionStorage` only for intentionally local-only or ephemeral UI; see **Data Persistence — Prefer Port Entities over localStorage** below.

### Illustrated examples

Later examples use **placeholder-style** folder names (for example `task-comment-chat`, `current-iteration`). They show **how to reason about reuse**; substitute the widgets and params listed in **your** project’s `README.md` and filesystem.

### Where widgets live and how they are named

- **Location:** A common layout is **one directory per plugin at the repository root** (sibling of `README.md`, CI config, and other plugins). If your team uses a different layout (for example `packages/*`), follow that convention consistently.
- **Directory name:** Use **lowercase words separated by hyphens** (kebab-case). Translate a human title into that form (for example, "Specific Entity Page" → `specific-entity-page`). Avoid spaces, camelCase, PascalCase, and mixed caps in the folder name.

## Quick Decision Tree

**Align an existing plugin?** If the task is to **audit or bring a current plugin up to** this skill’s standard (README §8, params, SDK, build, docs), follow **Bringing an existing plugin up to standard** (section above) and skip the tree below. **Otherwise:**

```
User requests a widget
        ↓
┌─────────────────────────────────────────────┐
│ 1. Read README.md - what widgets exist?       │
└─────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────┐
│ 2. Exact match exists?                        │
│    YES → Tell user to use existing widget     │
│    NO → Continue                              │
└───────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ 3. Similar widget (60%+ overlap)?             │
│    YES → Copy & adapt (see “Adapting”)         │
│    NO  → Scaffold new widget from templates    │
└─────────────────────────────────────────────┘
        ↓ (adapting or creating)
┌─────────────────────────────────────────────┐
│ 4. Search Port catalog via MCP                │
│    → Find blueprints that match the use case  │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ 5. Blueprint strategy                         │
│    A) Existing blueprint + existing properties │
│    B) Existing blueprint + new property        │
│    C) Create new blueprint                     │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ 6. Implement & scaffold                       │
│    (see "Scaffolding" / "Bringing existing…") │
└─────────────────────────────────────────────┘
```

## References

**Port (authoritative):**

- [Plugins — Port Docs](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins)
- [`@port-labs/plugins-sdk` on npm](https://www.npmjs.com/package/@port-labs/plugins-sdk)
- [`@port-labs/port-plugins-cli` on npm](https://www.npmjs.com/package/@port-labs/port-plugins-cli)

**Bundled with this skill:**

- [Plugin architecture](references/plugin-architecture.md) — postMessage protocol, **`PLUGIN_DATA.theme`**, token flow, theming, API calls, build output
- [Widget conventions](references/widget-conventions.md) — suggested repo layout, naming, required files, **optional** build-and-upload automation

## Widget Reuse Checklist

Before proceeding with scaffolding, complete this checklist in order:

**Widget strategy (decide this first)**
- [ ] Read `README.md` to identify all existing widgets
- [ ] For potentially related widgets, read their `upload-params.json` and `src/types.ts`
- [ ] Choose the widget strategy:
  - [ ] Exact/superset match → recommend existing widget and stop
  - [ ] Similar widget (60%+ overlap) → copy and adapt
  - [ ] Partial overlap → create new widget, reuse blueprint params from the overlapping widget
  - [ ] No overlap → create new widget from scratch

**Blueprint & params (only after the widget strategy is decided)**
- [ ] Search the Port catalog via MCP to find blueprints relevant to the use case
- [ ] Inspect candidate blueprint properties and relations via MCP
- [ ] Select the blueprint strategy:
  - [ ] A) Use existing blueprint + existing properties (no catalog change)
  - [ ] B) Use existing blueprint + new property (list changes in a Prerequisites table in README)
  - [ ] C) Create new blueprint (list full schema in a Prerequisites table in README, expose as `type: "blueprint"` param)
- [ ] If reusing blueprint params from an existing widget, document which widget they come from

**Only proceed to implementation once both the widget strategy and blueprint strategy are decided.**

### Practical Reuse Workflow Examples

#### Example A: Request is "Add comment functionality to bug reports"

**Step-by-step analysis:**
```bash
# 1. Survey existing widgets
grep -r "comment" README.md
# → Find: task-comment-chat widget

# 2. Check its blueprint usage
cat task-comment-chat/upload-params.json
# → Uses: commentBlueprint, taskRelation, commentorRelation, messageProperty, etc.

# 3. Check its flexibility
cat task-comment-chat/src/types.ts
# → taskRelation is configurable (can point to any entity type, not just tasks)

# Decision: Reuse existing widget!
```

**Response to user:**
> "The `task-comment-chat` widget already implements comment functionality in a generic way. 
> You can reuse it for bug reports by configuring:
> - `commentBlueprint`: Your comment blueprint ID
> - `taskRelation`: Set to the relation name from comments to bugs (e.g., 'bug' or 'bugReport')
> 
> No new development needed!"

#### Example B: Request is "Create a sprint planning dashboard with tasks and team velocity"

**Step-by-step analysis:**
```bash
# 1. Survey existing widgets
cat README.md
# → Find: current-iteration (has tasks, teams, iterations)
# → Find: task-comment-chat (has comments)

# 2. Check what current-iteration covers
cat current-iteration/upload-params.json
# → Has: taskBlueprint, iterationBlueprint, teamBlueprint ✅
# → Shows: iteration progress, team stats, kanban board ✅

# 3. Check what's missing
# → Velocity calculations? (need to check the code)
cat current-iteration/src/App.tsx | grep -i "velocity"
# → Not found ❌

# Decision: Adapt current-iteration widget
```

**Response to user:**
> "The `current-iteration` widget already handles tasks, teams, and iterations. 
> I'll copy it and add velocity calculations. This will reuse:
> - `taskBlueprint` (from current-iteration)
> - `iterationBlueprint` (from current-iteration)
> - `teamBlueprint` (from current-iteration)
> 
> New functionality: velocity metrics and trend charts."

#### Example C: Request is "Create a service health monitoring widget"

**Step-by-step analysis:**
```bash
# 1. Survey existing widgets
cat README.md
# → Existing widgets: page-favorites, task-comment-chat, current-iteration
# → None related to services or health monitoring

# 2. Check for service-related blueprints
grep -r "service" */upload-params.json
# → No matches

# Decision: Create new widget from scratch
```

**Response to user:**
> "No existing widgets handle service monitoring. I'll scaffold a new widget from templates
> that will introduce:
> - `serviceBlueprint`: For service entities
> - `healthProperty`: For health status
> - `metricsRelation`: For related metrics/incidents
> 
> This will be a completely new widget."

## Code Reuse Beyond Blueprints

Even when creating a new widget, look for **reusable code patterns** in existing widgets:

### Common Reusable Patterns

1. **API Query Patterns** (from any widget using TanStack Query)
   - Blueprint entity search queries
   - Entity relationship traversal
   - User data fetching
   - Error handling patterns

2. **UI Component Patterns**
   - List rendering with loading states (from widgets that already do lists + queries)
   - Drag-and-drop interfaces (from widgets that implement DnD)
   - Property editors and forms (from widgets that edit entity JSON or similar)
   - Theme-aware styling (any widget using `applyThemeCss` / host tokens)

3. **Data Transformation Patterns**
   - Entity property extraction
   - Relation resolution
   - Date formatting
   - User aggregation

### How to Identify Reusable Code

When examining existing widgets, look for:

```typescript
// Generic utility functions (REUSABLE)
function getUserEmail(entity: Entity, relation: string): string | null {
  // Can be copied to any widget that needs user email extraction
}

// Generic API calls (REUSABLE PATTERN)
async function fetchBlueprintEntities(
  blueprint: string,
  filters: QueryFilters,
  token: string,
  baseUrl: string
) {
  // Pattern applicable to any blueprint search
}

// Widget-specific logic (NOT REUSABLE)
function calculateSprintVelocity(tasks: Task[], iteration: Iteration) {
  // Too specific to sprint planning
}
```

**Best practice:** Extract generic utilities when creating similar widgets. If you find yourself copying the same function from 2+ widgets, consider documenting it as a common pattern in widget comments.

### Suggesting Future Improvements

If you notice while implementing a widget that:
- You're copying the same utility function for the 3rd time
- Multiple widgets could benefit from a shared component
- A pattern is emerging across widgets

**Document this in your PR description or widget README:**

```markdown
## Potential Future Improvements

This widget copies the `fetchBlueprintEntities` utility from `task-comment-chat` 
and `current-iteration`. Consider extracting shared utilities into a common module 
if more widgets need this pattern.

Possible structure:
- `shared/api-utils.ts` - Common Port API calls
- `shared/entity-utils.ts` - Entity property/relation helpers
- `shared/types.ts` - Shared TypeScript types
```

This helps future developers (and AI agents) identify refactoring opportunities.

## Adapting an Existing Widget vs. Creating New

### When to Adapt vs. Create

If an existing widget is **close to the requirements**, consider adapting it instead of scaffolding from templates:

**Adapt (copy and modify) when:**
- The existing widget implements 60%+ of the requested functionality
- The UI pattern is similar (e.g., both are list views, both are forms)
- The blueprint structure is the same or can be extended
- You're adding features to an existing concept (e.g., adding filtering to comments)

**Create from scratch when:**
- No existing widget shares the domain or UI pattern
- The request is fundamentally different (e.g., creating charts vs. existing list widgets)
- Adapting would require rewriting most of the code anyway

### How to Adapt an Existing Widget

1. **Copy the entire widget directory:**
   ```bash
   cp -r existing-widget-name new-widget-name
   ```

2. **Update identifiers in copied files:**
   - `package.json`: Change `name` field
   - `upload-params.json`: Add/remove/modify parameters as needed
   - `src/types.ts`: Extend `PluginConfig` interface
   - `src/App.tsx`: Modify logic while keeping the structure

3. **Preserve reusable blueprints:**
   - Keep blueprint parameter names consistent (e.g., `commentBlueprint`)
   - Add new blueprint parameters only if introducing new concepts
   - Document which blueprints are shared with the source widget

4. **Update README:**
   - Add new widget row
   - Mention relationship to the source widget (e.g., "Extended from task-comment-chat")

**Example: Creating "bug-comment-chat" from "task-comment-chat":**
```bash
cp -r task-comment-chat bug-comment-chat
cd bug-comment-chat
# Modify package.json name: "port-bug-comment-chat-plugin"
# Keep commentBlueprint parameter (reuse existing blueprint)
# Add bugBlueprint parameter (new concept)
# Modify App.tsx to handle bugs instead of tasks
```

## Scaffolding a New Widget from Templates

Use this approach when creating a completely new widget with no close existing match.

### 1. Create the directory

From the **root of the repository** where plugins are maintained, create a folder for the new widget:

```bash
# Run from that root — not inside an unrelated subfolder unless your layout requires it
mkdir <widget-name>   # lowercase + hyphens only, e.g. service-health-panel
```

### 2. Copy template files verbatim

Copy these from `.cursor/skills/create-custom-widget/assets/` — do not modify them:

| Source | Destination |
|--------|------------|
| `template-webpack.config.js` | `<widget>/webpack.config.js` |
| `template-tsconfig.json` | `<widget>/tsconfig.json` |
| `template-index.html` | `<widget>/src/index.html` |
| `template-index.tsx` | `<widget>/src/index.tsx` |
| `template-usePostMessageData.ts` | `<widget>/src/hooks/usePostMessageData.ts` |

> **SDK:** The bundled template wraps **`usePortPluginData`** from **`@port-labs/plugins-sdk/react`** (see [plugins-sdk on npm](https://www.npmjs.com/package/@port-labs/plugins-sdk)). That hook exposes **`portToken`**, **`portApiBaseUrl`**, **`params`**, **`entity`**, **`page`**, **`user`**, **`theme`**, and **`applyThemeCss`**. The wrapper adds a **local dev mock** when the bundle runs outside Port’s iframe; keep **`applyThemeCss()`** on the real host path so light/dark stays in sync. Prefer **`@port-labs/plugins-sdk` ≥ 0.1.1** (link/navigation behavior and docs alignment per [Port Plugins](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins)).

### 3. Adapt these files

| Source | Destination | Changes needed |
|--------|------------|----------------|
| `template-package.json` | `<widget>/package.json` | Update `name` to `port-<widget-name>-plugin`, update `description` |
| `template-App.css` | `<widget>/src/App.css` | Customize styles |
| `template-App.tsx` | `<widget>/src/App.tsx` | Implement widget logic |
| `template-types.ts` | `<widget>/src/types.ts` | Add fields to `PluginConfig` matching your params |
| `template-upload-params.json` | `<widget>/upload-params.json` | Define widget parameters |

### Code organisation — split large widgets into files

**Do not put everything in `App.tsx`.** As a widget grows beyond ~150 lines, split it into focused modules. This keeps diffs reviewable and logic testable.

Suggested layout for a non-trivial widget:

```
src/
  App.tsx                  # Root: compose components, wire data
  types.ts                 # PluginConfig + domain types
  hooks/
    usePostMessageData.ts  # Host bridge (template)
    useComments.ts         # One hook per data concern
    useCurrentUser.ts
  components/
    CommentList.tsx        # Each visual section is its own file
    CommentForm.tsx
    EmptyState.tsx
  api/
    comments.ts            # Port API calls, isolated from UI
    entities.ts
  utils/
    formatters.ts          # Pure helpers — dates, strings, etc.
  App.css
```

**Rules of thumb:**

1. **One component per file.** If a component exceeds ~80 lines or has its own state/effects, extract it.
2. **API calls live in `api/`**, not in components or hooks. Components call hooks; hooks call `api/` functions.
3. **One data concern per hook.** A hook that fetches comments should not also fetch users — split into `useComments` + `useCurrentUser`.
4. **`types.ts` is the single source of truth** for `PluginConfig`, domain interfaces, and the `BlueprintParam` type. Import from there — do not re-declare shapes inline.
5. **Utilities are pure functions** with no side effects — safe to unit-test without React.
6. **`App.tsx` stays thin**: it reads `usePostMessageData`, passes data to child components, and handles the loading/error shell.

**When adapting an existing widget**, apply this split even if the original was monolithic — it pays off during code review and future changes.

### 4. Implement the widget

In `App.tsx`:

- Prefer **`usePortPluginData()`** from **`@port-labs/plugins-sdk/react`** for new code (same host data as the skill’s `usePostMessageData()` template wrapper, without the mock layer), **or** keep **`usePostMessageData()`** from the template for consistency with other widgets in the same project.

**Runtime data — use the Port API only.** For every live read or write (search entities, get entity by identifier, create/update entities, relations, scores, or any other Port-backed data), call the **Port REST API** with `Authorization: Bearer ${portToken}` and base URL `portApiBaseUrl` from the SDK. Centralize calls in `api/` modules; keep TanStack React Query in hooks with `enabled: !!portToken && !!portApiBaseUrl`. Do not use MCP from widget code, and do not bake in static catalog dumps from planning time as if they were live data.

- When search results must respect **dashboard page filters**, merge with **`mergePageFilters`** from **`@port-labs/plugins-sdk`** (see npm docs).
- Remove the entity guard block if the widget is for dashboards (not entity pages).

#### Searching blueprint entities (correct endpoint)

Use `POST /v1/blueprints/{blueprint}/entities/search` — **not** the generic search endpoint. The body must nest filter rules inside a `query` key:

```ts
const res = await fetch(
  `${baseUrl}/v1/blueprints/${encodeURIComponent(blueprint)}/entities/search`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: { combinator: "and", rules: [] },
    }),
  }
);
```

> **Avoid:** placing `combinator`/`rules` at the top level (causes 422), passing `page`/`page_size` query params, or using the generic `/v1/entities/search` route.

#### Error handling

Always surface the full response body on errors — Port returns structured `{ ok, error, message }` JSON that pinpoints the exact issue:

```ts
if (!response.ok) {
  const body = await response.text();
  throw new Error(`Port API ${response.status}:\n${body}`);
}
```

### 5. Define parameters (`upload-params.json`)

Each key is a param name; each value describes how it appears in the Port UI. Allowed **`type`** values (see [port-plugins-cli — Plugin metadata reference](https://www.npmjs.com/package/@port-labs/port-plugins-cli)): **`string`**, **`number`**, **`boolean`**, **`object`**, **`array`**, **`blueprint`**.

```json
{
  "exampleRelation": {
    "type": "string",
    "isRequired": true,
    "label": "Relation identifier on the parent entity"
  }
}
```

#### Prefer native **`blueprint`** params when selecting a blueprint

When the admin should **pick a blueprint** (not type a free-form ID), use **`"type": "blueprint"`**. Port renders the native blueprint control.

> **Runtime shape:** A `blueprint` param is **not** a plain string. Port delivers it as a **blueprint object**:
> ```typescript
> { identifier: string; title: string; /* …other blueprint fields */ }
> ```
> Always read `.identifier` (and optionally `.title`) instead of treating the value as a raw string.

**Type it correctly in `PluginConfig`:**
```typescript
export type BlueprintParam = { identifier: string; title: string };

export type PluginConfig = {
  discussionBlueprint: BlueprintParam; // NOT string
  parentRelation?: string;             // plain string — relation key
  bodyProperty?: string;               // plain string — property key
};
```

**Usage in API calls — always extract `.identifier`:**
```typescript
const res = await fetch(
  `${baseUrl}/v1/blueprints/${encodeURIComponent(config.discussionBlueprint.identifier)}/entities/search`,
  { ... }
);
```

**Limits (CLI / platform):** at most **five** params may use `"type": "blueprint"` per plugin — see the [CLI metadata table](https://www.npmjs.com/package/@port-labs/port-plugins-cli).

```json
{
  "discussionBlueprint": {
    "type": "blueprint",
    "isRequired": true,
    "label": "Blueprint that stores discussion threads"
  }
}
```

Use **`string`** (and other scalar types) for **relation identifiers**, **property keys**, enums, labels, URLs, and anything that is **not** “choose a blueprint from the catalog.”

### Blueprint Parameter Design for Reusability

Design `upload-params.json` to be **composable inside your organization**:

**Good: blueprint picker + configurable keys**
```json
{
  "discussionBlueprint": {
    "type": "blueprint",
    "isRequired": true,
    "label": "Discussion / comment blueprint"
  },
  "parentRelation": {
    "type": "string",
    "isRequired": false,
    "label": "Relation from discussion entity to parent (default: parent)"
  },
  "bodyProperty": {
    "type": "string",
    "isRequired": false,
    "label": "Property key for message text (default: body)"
  }
}
```
✅ Native blueprint selection in Port  
✅ Relation / property identifiers stay explicit and reusable across plugins

**Avoid:** encoding “which blueprint” only as an unstructured string when a **`blueprint`** param is clearer for admins — unless you have a deliberate reason (e.g. dynamic lists beyond the blueprint picker).

**Bad: vague catch-all**
```json
{
  "blueprintId": {
    "type": "string",
    "isRequired": true,
    "label": "Blueprint"
  }
}
```
❌ Unclear semantic role  
❌ Misses the native **`blueprint`** UX when the intent is catalog selection

**Design principles:**
1. **Name parameters by semantic role** (e.g. `discussionBlueprint`, not `blueprint1`).
2. **Use `type: "blueprint"`** for blueprint selection (subject to the five-param cap); use **`string`** for relation/property identifiers and similar.
3. **Make property/relation names configurable** when they might vary between catalogs.
4. **Document compatibility** with sibling widgets in the same codebase in the label or PR when it helps operators.
5. **Separate concerns** — one param per concept, not one opaque blob.


### Prefer discovering relations from the entity or Port API

**Avoid asking admins to type relation keys as string params when the widget already has the entity in context or can query the Port API.** Hard-coded or manually entered relation keys are fragile — they break silently when catalog structure changes.

#### When you have the host `entity` object

The Port host sends the current entity via `PLUGIN_DATA.entity`. Its `relations` map already contains the resolved related entity identifiers. Traverse them directly instead of requiring an admin to fill in the relation name:

```typescript
// entity.relations is Record<relationKey, string | null>
// entity.relationsObjects is Record<relationKey, Entity | null>

// ✅ Read the related entity directly from the host entity
const parentId = pluginData.entity?.relations?.[config.parentRelation];
const parentEntity = pluginData.entity?.relationsObjects?.[config.parentRelation];

// ✅ Or enumerate all relations if the relation key is unknown
const relatedIds = Object.values(pluginData.entity?.relations ?? {}).filter(Boolean);
```

When the widget is placed on a **known blueprint page** (e.g. always on a Task entity), you can discover the relation key at runtime instead of exposing it as a configurable param:

```typescript
// If the widget always lives on a "task" entity, read the assignee relation
// from the entity without asking the admin to name it
const assigneeId = pluginData.entity?.relations?.assignee;
```

#### When you need to find related entities via Port API

Use `POST /v1/blueprints/{blueprint}/entities/search` with a relation filter instead of asking admins to input identifiers:

```typescript
// ✅ Find all comments whose "task" relation points to the current entity
const body = {
  query: {
    combinator: "and",
    rules: [
      {
        operator: "relatedTo",
        blueprint: currentEntity.blueprint,
        value: currentEntity.identifier,
      },
    ],
  },
};
const res = await fetch(
  `${baseUrl}/v1/blueprints/${encodeURIComponent(config.commentBlueprint.identifier)}/entities/search`,
  {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }
);
```

#### Decision guide for relation params

| Situation | Preferred approach |
|-----------|-------------------|
| Widget is on an entity page — entity is in `PLUGIN_DATA` | Read `entity.relations[key]` or `entity.relationsObjects[key]` directly |
| Relation key is predictable / always the same | Hard-code the key in widget logic; don't expose as a param |
| Relation key varies per deployment | Expose as a `string` param (it's a key, not a blueprint) |
| Need to find all related entities | Use `/entities/search` with a `relatedTo` rule |
| Relation target blueprint is unknown | Enumerate `entity.relations` values and fetch each entity |

### 6. Document blueprint reuse

If your widget reuses blueprints from other widgets, document this in your widget's README or in a comment at the top of `types.ts`:

```typescript
// types.ts
/**
 * Param lineage (update names to match sibling widgets in your project):
 * - discussionBlueprint: align with existing discussion-style widgets if any
 * - workItemBlueprint: align with existing planning widgets if any
 *
 * New concepts introduced by this widget:
 * - milestoneBlueprint — example only; use type: "blueprint" in upload-params.json
 */
export type BlueprintParam = { identifier: string; title: string };

export type PluginConfig = {
  discussionBlueprint: BlueprintParam;
  workItemBlueprint: BlueprintParam;
  milestoneBlueprint: BlueprintParam;
};
```

### 7. Update the README

Add a row to the widgets table:

```markdown
| [Widget Title](./widget-name) | One-sentence description |
```

If the widget reuses or extends existing blueprints, mention this in the description:

```markdown
| [Project Dashboard](./project-dashboard) | Example: combines work-tracking and discussion plugins already in the same project, plus any new blueprint-backed features |
```

### 8. Per-plugin `README.md` standard (required)

Each **plugin directory must** include a `README.md` that follows **this section order**. The repo-level widgets table (step 7) is only an index; the per-plugin README is the **authoritative** operator and maintainer guide. If a section does not apply, include it with a one-line **`N/A —`** explanation so readers know it was considered.

1. **`#` Title + summary** — Human title; one paragraph describing behaviour, a link to [Port](https://app.getport.io), and which catalog concepts apply (blueprints, relations, dashboard vs entity page).

2. **Preview image** — At least **one** screenshot or short GIF of the widget running inside Port (dashboard and/or entity page, whichever the widget supports). Commit the asset under e.g. `docs/` or `assets/` and reference it with a relative path, **or** use a stable hosted URL. Always add **alt text** for accessibility.

3. **Badges (optional)** — e.g. widget surface (dashboard / entity), React and TypeScript versions; link to [Plugins](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins) where helpful.

4. **Features** — Bullet list of user-visible capabilities.

5. **Prerequisites** — What must exist before the widget works (Port access, integrations, blueprints, relations). State the **Node.js** range from `package.json` `engines` (and align with the [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli) Node requirement if operators run the CLI from the same machine).

6. **Widget parameters** — Table mirroring **`upload-params.json`**: key, type, required, default, description (use the same types Port expects, including `blueprint`). Place this **before** deploy steps so operators and implementers see what the custom widget will expose **before** catalog work and **Add in Port** (which references the same keys and defaults).

7. **Local development** — `npm run dev`, dev server URL, dev mock behaviour and which files to edit; Port **Local development** toggle. Document the inner loop **before** production upload so contributors do not have to scroll past release steps.

8. **Setup** — Numbered substeps, **only** what this widget needs. Typical substeps (drop those that do not apply):
   - **Catalog** — Blueprint and property requirements (identifier, type, required fields, relations) in a table so admins can set them up before deploying the widget.
   - **Ingestion / integration** — Ocean or other mapping paths, resync, scoping, known pitfalls.
   - **Build** — `npm install`, `npm run build`, artifact path **`dist/index.html`**.
   - **Upload** — Document the **canonical upload command** for this plugin (copy-pasteable), for example:

     ```bash
     port-plugins upload \
       --file dist/index.html \
       --identifier <plugin-directory-name> \
       --title "<widget title in Port>" \
       --params "$(cat upload-params.json)" \
       --upsert
     ```

     Do **not** duplicate the full CLI tutorial here. For install, `port-plugins config`, tokens vs client credentials, and `--port-api-base-url` / region, link once to [@port-labs/port-plugins-cli on npm](https://www.npmjs.com/package/@port-labs/port-plugins-cli) (and [Port Plugins](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins) where relevant).

   - **Add in Port** — Short steps: custom widget → pick plugin → params defaults vs overrides (cross-reference **Widget parameters** above).
   - **Entity-page behaviour** — When behaviour differs from dashboards: blueprints, relations, any **Get entity** (or other) calls required because host `PLUGIN_DATA` is incomplete.

9. **Project structure** — Directory tree for this plugin (`src/`, `upload-params.json`, webpack, `tsconfig.json`, and so on).

10. **Troubleshooting** — Markdown table **Symptom | Cause | Fix** (search 422 / `query` nesting, theme / `applyThemeCss`, empty data, auth, wrong API host).

**Quality bar:** A reader can follow **what the widget accepts (widget parameters) → how to run it locally (local development) → how to ship it (setup)** without reversing context. Port admins still complete **catalog (if any) → build → upload → add widget** from the Setup substeps plus the linked CLI/docs—not by reading application source.

## Theming — Matching Port's Look & Feel

The Port host includes **`theme`** on **`PLUGIN_DATA`**: `{ mode: string, css: string }`.
The **`theme.css`** string is injected into the iframe by **`applyThemeCss()`** from
**`@port-labs/plugins-sdk`** (as `<style id="port-plugin-theme">`). It usually defines
design tokens such as `--background-primary` and `--text-high` on `:root`.

The template hook (`template-usePostMessageData.ts`) delegates to **`usePortPluginData()`** and calls **`applyThemeCss()`** when the SDK’s theme updates (not only on first mount), so light/dark switches in the portal stay
in sync. The template CSS (`template-App.css`) maps those tokens to your own variables.

1. **Keep `applyThemeCss()` in an effect that tracks the SDK** — e.g. `useEffect(..., [applyThemeCss])` from **`usePortPluginData`** per [plugins-sdk on npm](https://www.npmjs.com/package/@port-labs/plugins-sdk). Do not strip
   this when customizing the hook; without it, the widget ignores the host theme.
2. **Map tokens with fallbacks** — define local variables that reference Port's with a
   hardcoded fallback for local dev (no `PLUGIN_DATA` / no injection):

```css
:root {
  --bg:     var(--background-primary, #f0f2f5);
  --card:   var(--background-dim, #ffffff);
  --text:   var(--text-high, #111827);
  --muted:  var(--text-medium, #6b7280);
  --border: var(--border-medium, rgba(0, 0, 0, 0.09));
}
```

3. **Use your local variables** everywhere in CSS — the widget adapts when Port sends a new
   **`theme.css`**.
4. **Optional:** set **`document.documentElement.style.colorScheme`** from **`theme.mode`**
   (`"light"` / `"dark"`) so native form controls match the portal.

**Legacy widgets** that implement `postMessage` manually must either adopt the SDK or parse
**`event.data.theme`** and inject **`theme.css`** themselves — see the **Theming** section in
[plugin-architecture.md](references/plugin-architecture.md).

> **Key Port CSS variables (typically inside `theme.css`):** `--background-primary`,
> `--background-dim`, `--background-dim-transparent`, `--text-high`, `--text-medium`,
> `--border-medium`, `--border-contrast-medium`.

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Directory path | Root of plugins repo + kebab-case folder | `<plugins-repo>/service-health-panel` |
| Directory | kebab-case (lowercase, hyphen-separated) | `service-health-panel` |
| Port plugin identifier | same as directory | `service-health-panel` |
| `package.json` name | `port-{dir-name}-plugin` | `port-service-health-panel-plugin` |
| Widget title in Port | Title Case | `"Service Health Panel"` |
| Branch name | `feat/add-{widget-name}-widget` | `feat/add-service-health-panel-widget` |

## Local Development

```bash
cd <widget-name>
npm install
npm run dev   # webpack-dev-server at http://localhost:9000
```

### Dev Mock Mode

The template includes a **dev mock** that activates automatically when running locally (outside Port's iframe). This lets you preview the widget without connecting to Port.

**Configure mock data in `src/hooks/usePostMessageData.ts`:**

```typescript
// Set to null for dashboard widgets (no entity context)
const MOCK_ENTITY_ID: string | null = "my-entity";
const MOCK_ENTITY_BLUEPRINT = "service";
const MOCK_ENTITY_TITLE = "My Entity";
```

**For widgets that call Port APIs**, add mock responses in your API file:

```typescript
import { DEV_MOCK } from "../hooks/usePostMessageData";

export async function fetchData(...) {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 300)); // simulate latency
    return MOCK_DATA;
  }
  // real API call...
}
```

### Testing in Port

In Port: add/edit a custom widget → toggle **"Local development"** → loads `localhost:9000`.

## Build & deploy

```bash
npm run build   # outputs dist/index.html (single self-contained file)
```

Upload with the **Port plugins CLI** ([`@port-labs/port-plugins-cli` on npm](https://www.npmjs.com/package/@port-labs/port-plugins-cli); Node **22+** per package `engines`). Install globally or run via **`npx`**:

```bash
npx @port-labs/port-plugins-cli upload \
  --file dist/index.html \
  --identifier <widget-name> \
  --title "<Widget Title>" \
  --params "$(cat upload-params.json)" \
  --upsert
```

Use `port-plugins config` / env vars for auth as described on npm (`PORT_TOKEN`, `PORT_CLIENT_ID` + `PORT_CLIENT_SECRET`, or project `.port/config`).

**Upload automation:** Wrapping the above in GitHub Actions (or another runner) is **optional**. Your repository may include a workflow that builds and uploads changed plugins on merge to `main`; that is **team convenience**, not a Port platform requirement. See [widget-conventions.md](references/widget-conventions.md) for a typical layout.

## Critical Configuration Requirements

These settings are already in the templates but are **essential** for widgets to render correctly:

### 1. Webpack: Script injection in body

In `webpack.config.js`, HtmlWebpackPlugin **must** have `inject: "body"`:

```javascript
new HtmlWebpackPlugin({
  template: "./src/index.html",
  filename: "index.html",
  chunks: ["ui"],
  cache: false,
  inject: "body",  // REQUIRED — scripts must load after #plugin-root exists
}),
```

Without this, the inlined script runs before the DOM is ready, causing "Target container is not a DOM element" errors.

### 2. CSS: Full-height layout

In `App.css`, ensure the root elements have explicit heights:

```css
html,
body,
#plugin-root {
  height: 100%;
  min-height: 100%;
}

body {
  background: var(--bg);
  color: var(--text);
}
```

Without this, the widget may render with zero height (blank screen).

## Anti-Patterns to Avoid

### ❌ Don't: Create Duplicate Blueprints

**Bad:**
```json
// widget-1/upload-params.json
{ "commentBlueprintId": { "type": "string", "label": "Comments" } }

// widget-2/upload-params.json
{ "discussionBlueprintId": { "type": "string", "label": "Discussions" } }
```
Both represent the same concept (comments/discussions) but use different parameter names.

**Good:**
```json
// Both widgets use consistent parameter name and the correct blueprint type
{ "commentBlueprint": { "type": "blueprint", "isRequired": true, "label": "Comment blueprint" } }
```

### ❌ Don't: Reinvent Existing Functionality

**Bad:** User asks for "task comment widget" and you scaffold from scratch without checking existing widgets.

**Good:** Check README, find `task-comment-chat` already exists, recommend it.

### ❌ Don't: Create Monolithic Widgets

**Bad:** User asks for "project management" and you create one massive widget that does everything (tasks, comments, files, chat, reports, etc.)

**Good:** Check which pieces exist as separate widgets. Suggest:
- Use `task-comment-chat` for comments
- Use `current-iteration` for sprint tracking  
- Create new focused widgets for missing pieces (e.g., file attachments)
- Let users compose these in their Port dashboard

### ❌ Don't: Hardcode Blueprint-Specific Logic

**Bad:**
```typescript
// In task-comment-chat widget
if (blueprint === "task") {
  // Special handling for tasks only
}
```

**Good:**
```typescript
// Generic logic that works with any blueprint
const relatedEntity = entity.relations?.[config.taskRelation];
```

### ✅ Do: Design for Extension

**Blueprint parameters should support:**
- Different entity types (tasks, bugs, PRs, tickets)
- Different property names (body, message, text, description)
- Different relation names (task, parent, linkedTask)

**Example of extensible design:**
```typescript
export type BlueprintParam = { identifier: string; title: string };

export type PluginConfig = {
  commentBlueprint: BlueprintParam;   // What blueprint stores comments
  parentRelation: string;             // Relation key on the comment entity
  authorRelation: string;             // Relation key to the author entity
  contentProperty: string;            // Property key for the text content
};
```

This allows the same widget code to work with:
- Task comments (parentRelation: "task", contentProperty: "body")
- Bug comments (parentRelation: "bug", contentProperty: "description")
- PR reviews (parentRelation: "pullRequest", contentProperty: "reviewText")

### ❌ Don’t: Shrink the model to avoid catalog work

**Bad:** The widget needs typed, queryable fields or a proper relation, but you recommend cramming JSON into a string property, overloading an unrelated blueprint, or leaving operators to “figure it out” without a schema plan — all to dodge a Port catalog edit.

**Good:** Follow Step 4–5: when the use case needs new properties or a new blueprint, specify them in README prerequisite tables and align `upload-params.json` so the widget matches the catalog you are asking them to build.

## Data Persistence — Prefer Port Entities over localStorage

When a widget needs to **save state that must survive browser reloads, tab switches, or different users' sessions**, store it in Port rather than `localStorage` or `sessionStorage`.

Treat **Port-backed persistence as the default** for saved widget state. Treat **`localStorage` / `sessionStorage` as a narrow exception** — not the first choice merely because it is quicker to wire when the host already provides `portToken` and `portApiBaseUrl` for reads and writes.

### When to prefer Port

Prefer storing state in Port (entity properties or new entities via the HTTP API) when **any** of the following apply:

- Users would reasonably expect the **same data after a reload**, on a **different device**, or in a **different browser** (subject to the same Port account and permissions).
- The data is part of **product behaviour** rather than disposable **UI chrome** for one tab.
- **Other people** should see the same data according to Port access control.

When none of those apply and the data is **explicitly per-browser** by design (or ephemeral), browser storage can be appropriate.

| Storage | Survives reload | Cross-window | Cross-user | Auditable | Recommendation |
|---------|----------------|--------------|------------|-----------|----------------|
| `localStorage` | ✅ | ❌ (same origin only) | ❌ | ❌ | Avoid for anything meaningful |
| `sessionStorage` | ❌ | ❌ | ❌ | ❌ | Avoid |
| Port entity property | ✅ | ✅ | ✅ (with access control) | ✅ | **Preferred** |
| Port entity (new entity) | ✅ | ✅ | ✅ | ✅ | Use for structured records |

Same-origin `localStorage` can appear shared across tabs on one browser profile; it still does **not** replace Port when users need consistency across **devices**, **profiles**, or **cleared site data**.

### Use `localStorage` / `sessionStorage` only for:

- Ephemeral UI state (e.g. which panel is expanded in this browser tab)
- Dev-mode mocks
- Data that is **truly** per-device, **non-shareable by design**, and **documented** as acceptable to lose on clear-site-data or when using another browser

Do **not** choose browser storage only because it is simpler if **Port persistence is viable** with the same host token and API.

### Saving data to a Port entity property

Use `PATCH /v1/blueprints/{blueprint}/entities/{identifier}` to write properties:

```typescript
await fetch(
  `${baseUrl}/v1/blueprints/${blueprint}/entities/${entityIdentifier}`,
  {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      properties: { myProperty: newValue },
    }),
  }
);
```

### Creating a new entity to persist a record

```typescript
await fetch(
  `${baseUrl}/v1/blueprints/${blueprint}/entities`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identifier: generateIdentifier(),
      title: recordTitle,
      properties: { body: text, createdAt: new Date().toISOString() },
      relations: { parent: parentEntityIdentifier },
    }),
  }
);
```

### Designing blueprints for widget-owned data

If the widget needs to store records (e.g. comments, bookmarks, reactions):

1. **Check if an existing blueprint can hold the data** — when it can, add properties there first. When it cannot (wrong lifecycle, wrong relations, or would pollute a shared type), add a dedicated blueprint or relation and document it; that is preferable to bending the wrong entity.
2. If a dedicated blueprint is needed, document its full schema (identifier, properties, relations) in a table in the widget README under **Prerequisites → Catalog**.
3. Expose the blueprint as a `"type": "blueprint"` param so admins wire it at configuration time — **do not hard-code the blueprint identifier** in widget logic.
4. Never use `localStorage` as a fallback for data that other users or windows should see.

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Blank/dark screen locally | Script runs before DOM ready | Add `inject: "body"` to HtmlWebpackPlugin |
| Blank screen, no errors | Missing height on html/body | Add `height: 100%` to html, body, #plugin-root |
| "Waiting for Port" message | Running outside iframe without mock | Enable `DEV_MOCK` in usePostMessageData.ts |
| API calls fail locally | Mock not returning data | Add `if (DEV_MOCK) return MOCK_DATA` to API functions |
| Widget works locally but not in Port | DEV_MOCK blocking real data | Ensure DEV_MOCK is false when `window.parent !== window` |
| 422 on entity search | `combinator`/`rules` at top level | Nest inside `{ query: { combinator, rules } }` |
| 422 with "additional properties" | Extra query params like `page` | Remove `page`/`page_size` from URL; use only the POST body |
| Widget ignores Port theme | `applyThemeCss()` not called or manual `postMessage` hook omits `theme` | Use `@port-labs/plugins-sdk` and call `applyThemeCss()` when `theme.css` updates; or inject `event.data.theme.css` yourself |
| Theme stuck after portal switch | Effect only runs once | Depend on SDK `applyThemeCss` (it changes when `theme.css` changes) or re-inject on each `PLUGIN_DATA` |
| Colours look wrong in dev | Port CSS vars not injected | CSS must provide local fallbacks: `var(--text-high, #111827)` |
