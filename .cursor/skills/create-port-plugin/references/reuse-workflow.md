# Reuse and catalog workflow

**Before creating any plugin**, follow these steps in order. Reuse is decided first; blueprint/params design follows.

**Catalog changes are normal.** Prefer correct catalog modeling over contorted workarounds. Document new blueprints, properties, and relations in README **Prerequisites**.

## Table of contents

- [Reuse and catalog workflow](#reuse-and-catalog-workflow)
- [Step 1: Analyze the request](#step-1-analyze-the-request)
- [Step 2: Survey existing plugins](#step-2-survey-existing-plugins)
- [Step 3: Decide plugin strategy](#step-3-decide-plugin-strategy)
- [Step 4: Catalog via MCP (design-time)](#step-4-catalog-via-mcp-design-time)
  - [Blueprint strategy](#blueprint-strategy)
  - [Relation strategy (inside Step 4)](#relation-strategy-inside-step-4)
- [Step 5: README Prerequisites](#step-5-readme-prerequisites)
- [Step 6: Minimal `upload-params.json`](#step-6-minimal-upload-paramsjson)
- [Quick decision tree](#quick-decision-tree)
- [Checklist (before implementation)](#checklist-before-implementation)
- [Adapting vs creating](#adapting-vs-creating)
- [Code reuse patterns](#code-reuse-patterns)
- [Runtime vs design-time](#runtime-vs-design-time)
- [References](#references)

## Step 1: Analyze the request

Map **catalog concepts** needed (blueprints, properties, relations). Naming is **org-specific** — do not assume fixed blueprint IDs.

Examples of domains (map to *their* catalog):

- Threaded discussion → comment blueprint + parent relation
- Work tracking → task/iteration blueprints
- Personalization → user properties or relations

## Step 2: Survey existing plugins

Read project `README.md` (Plugins table). For candidates:

1. **`upload-params.json`** — blueprint scope
2. **`src/types.ts`** — `PluginConfig`
3. **`src/App.tsx`** — approach

## Step 3: Decide plugin strategy

| Scenario | Action |
|----------|--------|
| **Exact match** | Recommend existing plugin — **stop** |
| **Superset** | Recommend with params — **stop** |
| **Similar (60%+)** | Copy directory and adapt |
| **Partial overlap** | New plugin; reuse param shapes from overlap |
| **No overlap** | Scaffold from [scaffolding.md](scaffolding.md) |

Continue to Step 4 only when adapting or creating.

## Step 4: Catalog via MCP (design-time)

Query live catalog **before** `upload-params.json`.

### Blueprint strategy

| Outcome | When |
|---------|------|
| **A — existing + existing properties** | Blueprint models concept; all fields present |
| **B — existing + new property/relation** | Right blueprint; extend schema |
| **C — new blueprint** | Distinct lifecycle, ownership, or relations |

| Signal | New blueprint | New property |
|--------|---------------|--------------|
| Own identity/lifecycle | ✅ | |
| Facet of existing entity | | ✅ |
| Unique relations | ✅ | |
| 1–3 extra fields | | ✅ |
| Separate external ingest | ✅ | |

Explain choice to user; document schema changes in README.

### Relation strategy (inside Step 4)

For each cross-blueprint need, **`list_blueprints`** with `identifiers` for **source** and **target**:

- Reuse existing relation when semantics match.
- Prefer properties over new links when data already lives on entity.
- Target blueprint must expose fields the plugin reads.

| Question | Action |
|----------|--------|
| Existing relation to needed data? | Use in code + README; resolve from entity/search |
| Stable link still missing? | Add catalog relation; document in README |
| “Everything related to this entity”? | **`relatedTo`** search — no relation param |
| One subject blueprint on entity pages? | **`PLUGIN_DATA.entity.blueprint`** — skip subject param unless dashboard needs it |

**Do not** plan relation-key `string` params. See [params-and-relations.md](params-and-relations.md).

## Step 5: README Prerequisites

Document **before** plugin parameters:

- Blueprint strategy (A/B/C)
- Properties / relations tables
- Integrations, automations, SSA, scorecards — as needed

Section order: [readme-and-audit.md](readme-and-audit.md).

## Step 6: Minimal `upload-params.json`

After Steps 4–5:

| Catalog outcome | Params |
|-----------------|--------|
| Existing blueprint, entity-page only | Omit subject `blueprint` param when entity suffices |
| Dashboard / multi-blueprint | `type: "blueprint"` where admin picks scope |
| New property on existing blueprint | Optional `string` override with code default |
| New blueprint | `"type": "blueprint"` param for admin wiring |

**DON'T:** params for blueprint lists, relation keys, entity IDs, or schemas the API returns; duplicate subject blueprint on entity pages; duplicate blueprints for same concept.

Full rules: [params-and-relations.md](params-and-relations.md).

## Quick decision tree

```
User request
  → Read README.md (existing plugins + versions)
  → Exact match? → recommend, stop
  → Similar 60%+? → copy & adapt
  → Else → scaffold (scaffolding.md)
  → MCP catalog + relation strategy → README Prerequisites
  → Minimal upload-params.json
  → Implement (implementation.md + ui-and-styling.md)
  → Document (readme-and-audit.md)
```

## Checklist (before implementation)

**Plugin strategy**
- [ ] Surveyed README + related `upload-params.json` / `types.ts`
- [ ] Chosen: reuse / adapt / new scaffold

**Catalog**
- [ ] MCP blueprint search + schema inspection
- [ ] Strategy A/B/C chosen and explained
- [ ] Relation strategy documented (not paramized relation keys)
- [ ] README **Prerequisites** drafted before params table

**Params**
- [ ] Minimal `upload-params.json`; short labels; optional `description` tooltips when labels are ambiguous
- [ ] No API-fetchable data in params
- [ ] UX + safe rendering planned — [ui-and-styling.md](ui-and-styling.md), [guidelines.md](guidelines.md)

## Adapting vs creating

**Adapt** when 60%+ overlap, similar UI, same blueprint structure.

```bash
cp -r existing-plugin new-plugin
# Update package.json name, upload-params.json, types.ts, App.tsx, README
```

**Create from scratch** when no domain/UI overlap or adapt would rewrite most code.

## Code reuse patterns

When copying from siblings, reuse:

- TanStack Query + Port search patterns
- `portalUrl.ts`, `readBlueprintParam`, theme CSS shell
- Generic utilities — not sprint-specific business logic

If the same utility appears in 2+ plugins, note in PR/README for future extraction.

## Runtime vs design-time

| Layer | Tool |
|-------|------|
| IDE / planning | Port MCP (`list_blueprints`, `upsert_blueprint`) |
| Iframe runtime | Port REST API + `PLUGIN_DATA` only |

Never substitute MCP or static catalog snapshots for live entity reads in plugin code.

## References

- [scaffolding.md](scaffolding.md) — templates
- [implementation.md](implementation.md) — API, portal links, mocks
- [plugin-architecture.md](plugin-architecture.md) — host bridge, build
- [Port Plugins docs](https://docs.getport.io/customize-pages-dashboards-and-plugins/plugins)
