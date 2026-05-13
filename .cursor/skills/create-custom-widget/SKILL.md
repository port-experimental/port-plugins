---
name: create-custom-widget
description: Scaffold and build Port custom widgets (plugins) — self-contained React/TypeScript apps embedded as iframes in Port dashboards and entity pages. ALWAYS check existing widgets for reusable blueprints and patterns before creating new ones. Use when creating a new Port widget, custom plugin, or when asked to add a new widget to the port-custom-widgets repository. Prioritizes reusability and extensibility.
---

# Create a Port Custom Widget

## Core Principles: Reusability and Extensibility

**This skill prioritizes:**
1. ✅ **Reusing existing widgets and blueprints** over creating duplicates
2. ✅ **Identifying patterns** across the codebase before starting work
3. ✅ **Designing for extension** with flexible, composable parameters
4. ✅ **Documenting blueprint relationships** across widgets

**Always start by analyzing existing implementations. Only create new widgets when necessary.**

## Overview

Port widgets are single-file React/TypeScript apps compiled by webpack into a self-contained `dist/index.html` (all JS/CSS inlined). They run inside an `<iframe>` in Port dashboards or entity pages and communicate with the host via `postMessage`.

Each widget can define configurable parameters (like `commentBlueprint`, `taskBlueprint`) that reference Port blueprints. **Multiple widgets can share the same blueprints**, creating a composable ecosystem of widgets that work together.

## CRITICAL: Check for Reusable Implementations FIRST

**Before creating any new widget**, you MUST analyze existing widgets and Port blueprints to identify reusable components and patterns. This prevents duplicate work and ensures consistency.

### Step 1: Analyze the Request for Port Abstractions

Identify which "Port abstractions" (blueprints, properties, relations) the requested widget needs:

- **Comments system** → Likely uses a comment blueprint with relations to tasks/users
- **Task management** → May involve task, iteration, team blueprints
- **Favorites/bookmarks** → May use properties on the `_user` entity
- **Status tracking** → May use status properties, relations between entities
- **Team collaboration** → May involve `_team` blueprint and user relations

### Step 2: Survey Existing Widgets

Read the repository's `README.md` to see all existing widgets. For each potentially related widget:

1. **Read `upload-params.json`** to understand which blueprints it references
2. **Read `src/types.ts`** to see the data model (PluginConfig interface)
3. **Read key parts of `src/App.tsx`** to understand the implementation approach

**Example workflow:**
- User requests: "Create a task comment widget"
- Check README → Find `task-comment-chat` widget exists
- Read `task-comment-chat/upload-params.json` → Uses `commentBlueprint`, `taskRelation`, etc.
- **Decision**: This widget already implements exactly what's needed. Suggest using it directly or adapting it.

### Step 3: Assess Reusability

Determine if existing widgets can be reused:

| Scenario | Action |
|----------|--------|
| **Exact match** | Tell the user the widget already exists; provide widget name and configuration guidance |
| **Superset** | Existing widget does more than requested; suggest using it with specific parameters |
| **Subset** | Existing widget implements part of the request (e.g., comments exist, but full task management is requested) → **reuse the blueprint** in your new widget |
| **Similar pattern** | Different domain but similar UI pattern → copy relevant code patterns and adapt |
| **No overlap** | Create entirely new widget following templates |

### Step 4: Reuse Blueprint Configurations

If you're creating a new widget that builds on existing functionality:

**DO:**
- Reuse the same blueprint identifiers (e.g., if `commentBlueprint` exists, use it)
- Follow the same property naming conventions (e.g., `messageProperty`, `authorProperty`)
- Copy the parameter structure from `upload-params.json` for shared concepts
- Reference the existing widget in documentation

**DON'T:**
- Create duplicate blueprints for the same concept (e.g., two different comment blueprints)
- Reinvent property names (use existing conventions)
- Build from scratch when adapting an existing widget is faster

### Examples of Reuse Decisions

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

If you need to check which blueprints exist in the user's Port instance, you can query the Port API:

```typescript
// In your widget code:
const response = await fetch(
  `${portApiBaseUrl}/v1/blueprints`,
  {
    headers: { Authorization: `Bearer ${portToken}` }
  }
);
const blueprints = await response.json();
```

However, for skill execution, **always check existing widgets first** as they document the intended blueprint usage.

## Common Blueprint Patterns in This Repository

As you analyze existing widgets, you'll discover recurring blueprint patterns. **Always check for these before creating new blueprints:**

### Known Blueprints (as of repository analysis)

| Blueprint Pattern | Used In Widget | Purpose | Key Properties/Relations |
|-------------------|----------------|---------|--------------------------|
| `commentBlueprint` | `task-comment-chat` | User comments on entities | `messageProperty`, `authorProperty`, `tagsProperty`, `taskRelation`, `commentorRelation` |
| `taskBlueprint` | `current-iteration` | Task/work item tracking | Relations to iteration, team |
| `iterationBlueprint` | `current-iteration` | Sprint/iteration cycles | Relations to tasks, team |
| `teamBlueprint` (default: `_team`) | `current-iteration` | Team organization | Relations to tasks, iterations |
| `_user` entity | `page-favorites` | User-specific data | `favourite_pages` property |

### Blueprint Abstraction Principles

When you identify that a user wants a widget involving one of these abstractions:

1. **Comments/Discussion** → Check if `task-comment-chat` pattern applies
   - Reuse: `commentBlueprint`, `taskRelation`, `commentorRelation`
   - Adapt: Change the parent entity type (task → bug, task → PR, etc.)

2. **Work Tracking** → Check if `current-iteration` pattern applies
   - Reuse: `taskBlueprint`, `iterationBlueprint`, `teamBlueprint`
   - Adapt: Add new status flows, custom properties

3. **User Personalization** → Check if `page-favorites` pattern applies
   - Reuse: `_user` entity with custom properties
   - Adapt: Add new user-specific properties

4. **Status/State Management** → Look for existing status properties
   - Reuse: Status property patterns from existing widgets
   - Adapt: Define new states for your domain

### Cross-Widget Blueprint Compatibility

Some blueprints are designed to work together:

- **Comments + Tasks**: `task-comment-chat` + `current-iteration` both work with tasks
  - A new widget can use both `commentBlueprint` AND `taskBlueprint` to show comments on tasks
  
- **Tasks + Teams + Iterations**: `current-iteration` combines all three
  - A new reporting widget could reuse all three blueprints for team analytics

**When creating a composite widget** (combines multiple existing concepts):
1. List all relevant existing widgets
2. Extract their blueprint parameters
3. Combine them in your new `upload-params.json`
4. Document the reuse in comments

### Where widgets live and how they are named

- **Location:** Create every widget as a **directory at the repository root** (sibling of `README.md`, `.github/`, and other widgets). Do **not** put new widgets under `widgets/`, `packages/`, or other nested folders unless the repo explicitly adopts a different layout.
- **Directory name:** Use **lowercase words separated by hyphens** (kebab-case). Translate a human title into that form (for example, "Specific Entity Page" → `specific-entity-page`, "Task Comment Chat" → `task-comment-chat`). Avoid spaces, camelCase, PascalCase, and mixed caps in the folder name.

## Quick Decision Tree

```
User requests a widget
        ↓
┌───────────────────────────────────────────────┐
│ 1. Read README.md - what widgets exist?       │
└───────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────┐
│ 2. Exact match exists?                        │
│    YES → Tell user to use existing widget     │
│    NO → Continue                              │
└───────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────┐
│ 3. Similar widget exists (60%+ overlap)?      │
│    YES → Copy and adapt (see "Adapting")      │
│    NO → Continue                              │
└───────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────┐
│ 4. Request involves known blueprints?         │
│    (Check upload-params.json files)           │
│    YES → Reuse blueprint params in new widget │
│    NO → Define new blueprint params           │
└───────────────────────────────────────────────┘
        ↓
┌───────────────────────────────────────────────┐
│ 5. Scaffold from templates                    │
│    (see "Scaffolding a New Widget")           │
└───────────────────────────────────────────────┘
```

## References

For detailed architecture and conventions, read these files first:
- [Plugin architecture](references/plugin-architecture.md) — postMessage protocol, **`PLUGIN_DATA.theme`**, token flow, theming, API calls, build requirements, deployment
- [Widget conventions](references/widget-conventions.md) — repo structure, naming conventions, required files, CI/CD pipeline

## Widget Reuse Checklist

Before proceeding with scaffolding, complete this checklist:

- [ ] Read `README.md` to identify all existing widgets
- [ ] For potentially related widgets, read their `upload-params.json` and `src/types.ts`
- [ ] Identify which blueprints are already in use (e.g., commentBlueprint, taskBlueprint)
- [ ] Determine if the request can be fulfilled by:
  - Using an existing widget as-is
  - Extending an existing widget
  - Creating a new widget that reuses existing blueprints
  - Creating an entirely new widget with new blueprints
- [ ] If reusing blueprints, document which existing widget defines them
- [ ] If creating new functionality, explain how it complements existing widgets

**Only proceed to scaffolding if you've determined that creating a new widget is necessary.**

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
   - List rendering with loading states (from `task-comment-chat`)
   - Drag-and-drop interfaces (from `current-iteration`)
   - Property editors (from `page-favorites`)
   - Theme-aware styling (from any widget)

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

From the **repo root** (`port-custom-widgets/`), create a single top-level folder:

```bash
# Run from repository root — not inside widgets/ or another subfolder
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

> The `usePostMessageData` template uses `@port-labs/plugins-sdk` which handles the postMessage protocol **and** theme injection via `applyThemeCss()`. The template already calls this on mount.

### 3. Adapt these files

| Source | Destination | Changes needed |
|--------|------------|----------------|
| `template-package.json` | `<widget>/package.json` | Update `name` to `port-<widget-name>-plugin`, update `description` |
| `template-App.css` | `<widget>/src/App.css` | Customize styles |
| `template-App.tsx` | `<widget>/src/App.tsx` | Implement widget logic |
| `template-types.ts` | `<widget>/src/types.ts` | Add fields to `PluginConfig` matching your params |
| `template-upload-params.json` | `<widget>/upload-params.json` | Define widget parameters |

### 4. Implement the widget

In `App.tsx`:
- Use `usePostMessageData()` to get `params`, `entity`, `portToken`, `portApiBaseUrl`
- Call Port APIs with `Authorization: Bearer ${portToken}` using `portApiBaseUrl`
- Use TanStack React Query for data fetching (`enabled: !!portToken && !!portApiBaseUrl`)
- Remove the entity guard block if the widget is for dashboards (not entity pages)

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

```json
{
  "paramKey": {
    "type": "string",
    "isRequired": true,
    "label": "Human-readable label shown in Port UI"
  }
}
```

Types: `string`, `number`, `boolean`, `object`, `array`, `blueprint`

### Blueprint Parameter Design for Reusability

Design your `upload-params.json` to be **composable and reusable**:

**Good: Flexible, composable parameters**
```json
{
  "commentBlueprint": {
    "type": "string",
    "isRequired": true,
    "label": "Comment blueprint ID"
  },
  "taskRelation": {
    "type": "string",
    "isRequired": false,
    "label": "Relation from comment to task (default: task)"
  },
  "messageProperty": {
    "type": "string",
    "isRequired": false,
    "label": "Text property key (default: body)"
  }
}
```
✅ Other widgets can reuse `commentBlueprint`  
✅ Flexible enough to work with different relation names  
✅ Property names are configurable

**Bad: Hardcoded, inflexible**
```json
{
  "blueprintId": {
    "type": "string",
    "isRequired": true,
    "label": "Blueprint"
  }
}
```
❌ Unclear what kind of blueprint  
❌ Can't compose with other blueprints  
❌ Forces hardcoded property names in code

**Design principles:**
1. **Name parameters by their semantic role** (e.g., `commentBlueprint`, not `blueprint1`)
2. **Make property/relation names configurable** when they might vary (e.g., `messageProperty`)
3. **Use defaults for common cases** but allow overrides (e.g., `"default: body"`)
4. **Document cross-widget compatibility** in the label (e.g., "Comment blueprint ID (compatible with task-comment-chat)")
5. **Separate concerns** (one parameter per blueprint type, not a single catch-all)

### 6. Document blueprint reuse

If your widget reuses blueprints from other widgets, document this in your widget's README or in a comment at the top of `types.ts`:

```typescript
// types.ts
/**
 * This widget reuses blueprints from:
 * - commentBlueprint: defined in task-comment-chat widget
 * - taskBlueprint: defined in current-iteration widget
 * 
 * New blueprints introduced:
 * - milestoneBlueprint: tracks project milestones
 */
export type PluginConfig = {
  commentBlueprint: string;  // from task-comment-chat
  taskBlueprint: string;      // from current-iteration
  milestoneBlueprint: string; // NEW
};
```

### 7. Update the README

Add a row to the widgets table:

```markdown
| [Widget Title](./widget-name) | One-sentence description |
```

If the widget reuses or extends existing blueprints, mention this in the description:

```markdown
| [Project Dashboard](./project-dashboard) | Complete project view combining tasks (from current-iteration), comments (from task-comment-chat), and milestones |
```

## Theming — Matching Port's Look & Feel

The Port host includes **`theme`** on **`PLUGIN_DATA`**: `{ mode: string, css: string }`.
The **`theme.css`** string is injected into the iframe by **`applyThemeCss()`** from
**`@port-labs/plugins-sdk`** (as `<style id="port-plugin-theme">`). It usually defines
design tokens such as `--background-primary` and `--text-high` on `:root`.

The template hook (`template-usePostMessageData.ts`) calls **`applyThemeCss()`** when the
SDK's theme updates (not only on first mount), so light/dark switches in the portal stay
in sync. The template CSS (`template-App.css`) maps those tokens to your own variables.

1. **Keep `applyThemeCss()` in the effect that depends on the SDK's theme** — Do not strip
   this when customizing `usePostMessageData`; without it, the widget ignores the host theme.
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
| Directory path | **Repo root** + kebab-case folder | `port-custom-widgets/service-health-panel` |
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

## Build & Deploy

```bash
npm run build   # outputs dist/index.html (single self-contained file)

# Upload to Port
port-plugins upload \
  --file dist/index.html \
  --identifier <widget-name> \
  --title "<Widget Title>" \
  --params "$(cat upload-params.json)" \
  --upsert
```

CI/CD auto-deploys on merge to `main` for any changed widget directories.

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
// Both widgets use consistent parameter name
{ "commentBlueprint": { "type": "string", "label": "Comment blueprint ID" } }
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
export type PluginConfig = {
  commentBlueprint: string;           // What blueprint stores comments
  parentRelation: string;             // Relation to parent entity (flexible name)
  authorRelation: string;             // Relation to user who authored (flexible name)
  contentProperty: string;            // Property containing text (flexible name)
};
```

This allows the same widget code to work with:
- Task comments (parentRelation: "task", contentProperty: "body")
- Bug comments (parentRelation: "bug", contentProperty: "description")
- PR reviews (parentRelation: "pullRequest", contentProperty: "reviewText")

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
