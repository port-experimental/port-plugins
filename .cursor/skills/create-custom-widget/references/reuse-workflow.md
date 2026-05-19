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

#### Relation strategy (do this inside Step 4, before any params)

For every blueprint the widget reads or writes, map how data crosses blueprint boundaries.

**Before proposing a new relation**, call `list_blueprints` with `identifiers` for the **source** blueprint (where the widget runs or writes) and the **target** blueprint (where related data lives). Read each blueprint’s **properties** and **relations**:

- An **existing relation** may already point at the target blueprint with the right semantics — reuse it.
- A **property** on the source or target may already hold the value — prefer that over a new link.
- The **target** blueprint must expose the properties the widget needs (display fields, datetimes, status, …); if not, plan **properties on B** (or a different blueprint) in README **Prerequisites**, not only a new relation.

| Question | Action |
|----------|--------|
| Does an **existing relation** already link the subject entity to the data you need? | Use that relation identifier in code and README; resolve at runtime from **`PLUGIN_DATA.entity`** and/or **`relatedTo`** search. |
| After inspecting **both** schemas, is a stable link still missing (parent, assignee, service, sprint, …)? | **Add a catalog relation** (document in README **Relations** table; `upsert_blueprint` when approved). |
| Does the widget only need “everything related to this entity”? | Prefer **`relatedTo`** on **`entities/search`** — no relation-key param. |
| Does the widget target **one subject blueprint** (e.g. Task calendar, Service health on Service pages)? | Treat that blueprint as the **design default**; use **`PLUGIN_DATA.entity.blueprint`** on entity pages. **Do not** add a `type: "blueprint"` param unless the same build must run on dashboards without host entity context. |

**Do not** plan `string` plugin params for relation keys (`parentRelation`, `linkRelation`, `taskRelation`, …). Relation identifiers belong in the **catalog** and in **widget code constants** aligned with the README — not in `upload-params.json`.

### Step 5: Document Port prerequisites (README)

Capture the outcome of Step 4 in the plugin README **Prerequisites** section **before** widget parameters. List every **new or required Port instance** operators must set up — not only catalog objects:

- Blueprint(s) involved and the blueprint strategy (A/B/C from the matrix).
- **Properties** table for new or required fields.
- **Relations** table: identifier, source blueprint, target blueprint, required, how the widget uses the link (read, search, create).
- **Integrations** — Ocean or other ingest the widget assumes (if any).
- **Automations** — identifier, trigger, scope, behaviour the widget relies on (if any).
- **Self-service actions (SSA)** — identifier, blueprint, inputs/outputs the widget invokes or deep-links to (if any).
- **Other** — scorecards, pages, RBAC, or org settings when the widget depends on them.

When cross-blueprint behaviour depends on a relation that does not exist yet, say so explicitly (“add relation `parent` from `comment` → `{subject}`”) — do not substitute a relation string param.

Full README section order: [readme-and-audit.md](readme-and-audit.md) (**Per-plugin `README.md` standard**).

### Step 6: Define minimal plugin params (`upload-params.json`)

Apply the blueprint strategy from Step 4 **only after** relation strategy and README catalog tables are clear:

**If using an existing blueprint + existing properties:**
- **Entity-page widget for one blueprint:** rely on **`PLUGIN_DATA.entity.blueprint`** — **omit** a subject `type: "blueprint"` param when unnecessary.
- **Dashboard or multi-blueprint widget:** scope with **`type: "blueprint"`** where the admin must pick which blueprint — never free-text blueprint IDs.
- No catalog changes required; document which blueprint is expected and why in the widget README

**If using an existing blueprint + new property:**
- Present the required property additions as a table in the README **Prerequisites** section, e.g.:

  | Blueprint | Property name | Type | Required | Description |
  |-----------|--------------|------|----------|-------------|
  | `my-blueprint` | `resolvedAt` | `datetime` | No | When the item was resolved |

- Expose the property key as an optional **`string`** plugin param (widget-specific name, e.g. `dueDateProperty`) with a **short label** (e.g. `Resolved at property`); **default in code** to the property the widget was designed for (e.g. `resolvedAt`) when the param is blank; document default and override in README **Widget parameters**

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

**General rules (params):**
- **Catalog over params** — if something is already in the blueprint schema or discoverable via the Port API (blueprint list, properties, relations, entities), fetch it at runtime with the host token; **do not** duplicate it in `upload-params.json`.
- Reuse the same blueprint identifiers across widgets (e.g., if `commentBlueprint` exists, use it)
- Follow the same property naming conventions (e.g., `messageProperty`, `authorProperty`)
- Copy the parameter structure from `upload-params.json` for shared concepts when adapting a widget
- **Prefer extending an existing blueprint** (new properties or relations) when the concept is still the same entity type — it is usually simpler operationally than introducing another blueprint
- **Add a new blueprint when the use case needs it** — distinct lifecycle, ownership, ingestion source, or relations that do not belong on a parent entity. Do not shrink the model to fit an empty catalog; propose the blueprint and document it in the README tables

**DON’T:**
- Add params for **blueprint lists**, **relation keys**, **entity IDs**, or **property inventories** you can load via `GET /v1/blueprints`, `GET /v1/blueprints/{identifier}`, `PLUGIN_DATA.entity`, or `entities/search`
- Add **`string` params for relation keys** — fix the catalog or hard-code the designed relation identifier from the README
- Add **`type: "blueprint"`** for the subject blueprint when the widget only runs on that blueprint’s entity page and `PLUGIN_DATA.entity` is enough
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
2. Read upload-params.json → Likely scopes with commentBlueprint; relation to parent may still exist as optional overrides in older plugins
3. Decision: Widget already exists
4. Response: "The task-comment-chat widget already implements this. Configure commentBlueprint (and any other blueprint pickers). Prefer resolving the parent link from PLUGIN_DATA.entity and/or relatedTo search — only use relation string params when the widget cannot infer the link from context or the search API."
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
3. **Catalog over params** — design relations and properties in Port first; see Steps 4–6. **Fetch at runtime** (`GET /v1/blueprints`, `GET /v1/blueprints/{identifier}`, `PLUGIN_DATA.entity`, `entities/search`) — do **not** add params for blueprint lists, relation keys, entity IDs, or property inventories the API already exposes. **Prefer `type: "blueprint"`** only when the admin must **pick scope** the widget cannot infer. **Never** use **`string`** for relation keys. Use property **`string`** overrides only when schema defaults are insufficient (see [Define parameters](scaffolding-and-implementation.md#5-define-parameters-upload-paramsjson)).
4. **Composite widgets:** list related existing widgets, reuse compatible param shapes, and document lineage in the PR.
5. **Runtime data always via Port API** — entity lists, details, blueprint schemas, and writes use `fetch` against `portApiBaseUrl` with the host token; never substitute MCP, plugin params, or hard-coded catalog snapshots for live reads.
6. **UX and UI are first-class** — loading, empty, and error states; theme via `applyThemeCss()`; responsive full-iframe layout; accessible controls (see [UX and UI](scaffolding-and-implementation.md#ux-and-ui)).
7. **Safe rendering** — no `innerHTML`, `outerHTML`, or `dangerouslySetInnerHTML` for dynamic content; React elements and text only unless a documented sanitizer exception applies.
8. **Persist meaningful state through the Port API when it should follow the user or org** — for example after reload, on another device or browser, or when visibility should respect Port permissions. Use `localStorage` / `sessionStorage` only for intentionally local-only or ephemeral UI; see **Data Persistence — Prefer Port Entities over localStorage** below.
9. **Responsive iframe UI** — layout uses **all available iframe width and height** (full column or compact tile); avoid fixed large min-widths that force horizontal scroll in small tiles.
10. **No duplicate Port chrome** — do not print the plugin’s Port **title**, **description**, or **icon** inside the widget body; Port’s iframe wrapper already surfaces them.
11. **Icons** — no hardcoded emoji in widget UI; use **`<i>`** or an icon library when icons are needed (see [scaffolding-and-implementation.md](scaffolding-and-implementation.md) (**Icons (no hardcoded emoji)**)).
12. **Param schema** — every `upload-params.json` param object includes **`type`**, **`isRequired`**, and **`label`** (all three required; no partial objects).
13. **Portal links via `document.referrer`** — build in-app URLs from the embedding Port page’s origin; default **`https://app.port.io`** when running outside Port (local dev). Entity pages: **`{origin}/{blueprint}Entity?identifier={entityId}`**. Never use `portApiBaseUrl` for user-facing links.

### Illustrated examples

Later examples use **placeholder-style** folder names (for example `task-comment-chat`, `current-iteration`). They show **how to reason about reuse**; substitute the widgets and params listed in **your** project’s `README.md` and filesystem.

### Where widgets live and how they are named

- **Location:** A common layout is **one directory per plugin at the repository root** (sibling of `README.md`, CI config, and other plugins). If your team uses a different layout (for example `packages/*`), follow that convention consistently.
- **Directory name:** Use **lowercase words separated by hyphens** (kebab-case). Translate a human title into that form (for example, "Specific Entity Page" → `specific-entity-page`). Avoid spaces, camelCase, PascalCase, and mixed caps in the folder name.

## Quick Decision Tree

**Align an existing plugin?** If the task is to **audit or bring a current plugin up to standard** (README, params, SDK, build, docs), follow [readme-and-audit.md](readme-and-audit.md) and skip the tree below. **Otherwise:**

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
│ 5. Blueprint strategy + relation strategy     │
│    A/B/C + which relations to use or add      │
│    (document in README Prerequisites)           │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ 6. Minimal upload-params.json                 │
│    (after catalog; no relation string params) │
└─────────────────────────────────────────────┘
        ↓
┌─────────────────────────────────────────────┐
│ 7. Implement & scaffold                       │
│    (scaffolding-and-implementation.md)        │
└─────────────────────────────────────────────┘
```

## References

**Port (authoritative):**

- [Plugins — Port Docs](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins)
- [Get all blueprints](https://docs.getport.io/api-reference/get-all-blueprints) / [Get a blueprint](https://docs.getport.io/api-reference/get-a-blueprint) — runtime catalog shape for widgets
- [`@port-labs/plugins-sdk` on npm](https://www.npmjs.com/package/@port-labs/plugins-sdk)
- [`@port-labs/port-plugins-cli` on npm](https://www.npmjs.com/package/@port-labs/port-plugins-cli)

**Related references:**

- [plugin-architecture.md](plugin-architecture.md) — postMessage, **`PLUGIN_DATA.theme`**, token flow, API, build output
- [widget-conventions.md](widget-conventions.md) — repo layout, naming, optional upload automation
- [scaffolding-and-implementation.md](scaffolding-and-implementation.md) — templates, implementation, params

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

**Catalog & relations (only after the widget strategy is decided)**
- [ ] Search the Port catalog via MCP to find blueprints relevant to the use case
- [ ] Inspect candidate blueprint **properties and relations** via MCP
- [ ] Select the blueprint strategy:
  - [ ] A) Use existing blueprint + existing properties (no catalog change)
  - [ ] B) Use existing blueprint + new property (list changes in a Prerequisites table in README)
  - [ ] C) Create new blueprint (list full schema in a Prerequisites table in README)
- [ ] **Relation strategy:** for each cross-blueprint need, inspect **source + target** blueprint schemas; name the catalog relation (existing or to be added) — not a plugin param
- [ ] Document **Prerequisites** in README (relations, integrations, automations, SSA, scorecards, …) **before** the widget-parameters section.
- [ ] If the widget targets one subject blueprint on entity pages, plan to use **`PLUGIN_DATA.entity`** — skip subject blueprint param unless dashboards need it

**Params (only after catalog + relation strategy)**
- [ ] Draft minimal `upload-params.json` — **no** relation-key `string` params by default
- [ ] Use **short `label`** values in `upload-params.json`; put defaults and operator detail in README **Widget parameters**
- [ ] If reusing blueprint params from an existing widget, document which widget they come from
- [ ] Prefer **Port API** + host context for catalog shape — **no** params for API-fetchable blueprints/relations/entities; **`type: "blueprint"`** only where admins must pick scope the widget cannot infer
- [ ] Plan **UX/UI** (loading, empty, error, theme) and **no `innerHTML`** / `dangerouslySetInnerHTML` for dynamic content
- [ ] Optional property-key `string` overrides only when schema-driven defaults are insufficient

**Only proceed to implementation once widget strategy, blueprint strategy, and relation strategy are decided.**

### Practical Reuse Workflow Examples

#### Example A: Request is "Add comment functionality to bug reports"

**Step-by-step analysis:**
```bash
# 1. Survey existing widgets
grep -r "comment" README.md
# → Find: task-comment-chat widget

# 2. Check its blueprint usage
cat task-comment-chat/upload-params.json
# → Likely: commentBlueprint + optional legacy string params for relations/content

# 3. Check its flexibility
cat task-comment-chat/src/types.ts
# → Prefer: parent link from entity.relations / relatedTo search; string relation params only if the implementation still requires overrides

# Decision: Reuse existing widget!
```

**Response to user:**
> "The `task-comment-chat` widget already implements comment functionality in a generic way.
> You can reuse it for bug reports by configuring:
> - `commentBlueprint`: pick your comment blueprint in the widget settings (native blueprint control)
> - **Linking comments to the current bug:** rely on **entity context** (`PLUGIN_DATA.entity`) and **`POST .../entities/search`** with a **`relatedTo`** rule to the current entity first. Treat any **`taskRelation`-style string param** as a **last-resort override** only when context + search cannot express the join.
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
> - `serviceBlueprint`: For service entities (native `blueprint` param)
> - `healthProperty`: For health status (prefer inferring from **`GET /v1/blueprints/{identifier}`** when one clear property fits; otherwise a narrow param)
> - **Related metrics/incidents:** resolve via **`entity.relations` / `relationsObjects`** on the service entity page, or **`entities/search`** (`relatedTo` / relation rules), not a dedicated “metrics relation” string param unless multiple relations are indistinguishable without an override
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
// Prefer walking entity.relationsObjects (or schema from GET blueprint) to find the user link;
// pass an explicit relation key only when context + catalog cannot disambiguate.
function getUserEmail(entity: Entity, userRelationKey?: string): string | null {
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

