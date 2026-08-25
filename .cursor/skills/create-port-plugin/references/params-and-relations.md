# Parameters and relations

Define `upload-params.json` **after** [reuse-workflow.md](reuse-workflow.md) Steps 4–5 (catalog + README Prerequisites). Runtime resolution: [implementation.md](implementation.md).

## Table of contents

- [Parameters and relations](#parameters-and-relations)
- [Catalog over plugin params](#catalog-over-plugin-params)
- [Required fields per param](#required-fields-per-param)
- [Optional `description` (tooltips)](#optional-description-tooltips)
- [Param labels](#param-labels)
- [Blueprint params](#blueprint-params)
- [Subject blueprint](#subject-blueprint)
- [Datetime property overrides](#datetime-property-overrides)
- [Relation string params — forbidden by default](#relation-string-params-forbidden-by-default)
  - [Design-time: inspect schemas before new relations](#design-time-inspect-schemas-before-new-relations)
  - [Runtime resolution order](#runtime-resolution-order)
  - [Decision guide](#decision-guide)
- [Composable param design (reuse)](#composable-param-design-reuse)
- [Sync with TypeScript](#sync-with-typescript)

## Catalog over plugin params

| Fetch at runtime (do **not** parametrize) | May go in `upload-params.json` |
|-------------------------------------------|--------------------------------|
| Blueprint list — `GET /v1/blueprints` | — |
| Properties/relations — `GET /v1/blueprints/{id}` | — |
| Relation identifiers | — **not** relation-key strings |
| Current entity — `PLUGIN_DATA.entity` | — |
| Related entities — `entity.relations`, `relatedTo` search | — |
| Entity rows — `POST .../entities/search` | — |
| Property key with conventional default | Optional **`string`** override |
| Blueprint scope host cannot infer | **`type: "blueprint"`** (max **5**) |

**Goal:** smallest param set that scopes behaviour the catalog and host cannot supply. **No** portal URL param when `document.referrer` + `https://app.port.io` fallback suffice.

Allowed **`type`** values: `string`, `number`, `boolean`, `object`, `array`, `blueprint` — [port-plugins-cli](https://www.npmjs.com/package/@port-labs/port-plugins-cli).

## Required fields per param

Every param needs **`type`**, **`isRequired`**, **`label`**:

```json
{
  "exampleParam": {
    "type": "string",
    "isRequired": true,
    "label": "Example parameter"
  }
}
```

## Optional `description` (tooltips)

Port shows an optional **`description`** on each param as **tooltip / helper text** in the widget configuration UI. Add it when a short **`label`** cannot convey what the field does or what value to enter.

| Use `description` | Skip `description` |
|-------------------|--------------------|
| Default behaviour when blank (e.g. falls back to `createdAt`) | Self-explanatory labels (`Blueprint`, `Week starts on Monday`) |
| Property key semantics (`datetime` property name vs display label) | Detail that belongs only in README prerequisites |
| Non-obvious override purpose | Duplicating the README params table verbatim |

Keep **`label`** short; put tooltip-sized guidance in **`description`** — not in **`label`**. README **Plugin parameters** remains authoritative for defaults, examples, and operator setup.

## Param labels

| In `label` (short) | In optional `description` (tooltip) | In README **Plugin parameters** |
|--------------------|-----------------------------------|----------------------------------|
| `Comment blueprint` | — | Required properties, relations, defaults |
| `Due date property` | Default key when blank | Default key, when to override |
| `Datetime property` | Which `datetime` property to read; default | Schema requirements, examples |

Do not put defaults or setup instructions in `label`. Use **`description`** for brief in-UI hints; use README for full operator detail.

## Blueprint params

When admin picks a blueprint, use **`"type": "blueprint"`**. Port delivers an **object** — read `.identifier` for API paths; **preserve full object** for `mergePageFilters`.

### Param shape (what Port delivers at runtime)

Each param entry is a wrapper object with a `value` field and a `type` field:

```
params.<name>          →  { value: BlueprintObject, type: unknown }
params.<name>.value    →  the full blueprint object, e.g. { identifier: "service", title: "Service", ... }
params.<name>.type     →  typed as unknown (Record<string, unknown>) — do not rely on it
```

Access patterns:

```typescript
// Full blueprint object (for mergePageFilters):
const blueprint = params.discussionBlueprint.value;

// Blueprint identifier only (for API paths like GET /v1/blueprints/{id}):
const blueprintId = params.discussionBlueprint.value.identifier;
```

> **Note:** `params.<name>.type` is `unknown` at runtime — treat it as `Record<string, unknown>`.  
> For API calls you almost always only need `.value.identifier`, not the full object.

### Typed helpers

```typescript
import type { mergePageFilters } from "@port-labs/plugins-sdk";

export type BlueprintParam = NonNullable<
  Parameters<typeof mergePageFilters>[2]
> & { title?: string };

function readBlueprintParam(raw: unknown): BlueprintParam | null {
  if (typeof raw === "string" && raw.trim()) {
    const id = raw.trim();
    return { identifier: id, title: id };
  }
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.identifier !== "string" || !obj.identifier.trim()) return null;
  return { ...obj, identifier: obj.identifier.trim() } as BlueprintParam;
}

function readParamValue(params: Params, key: string): unknown {
  const entry = params[key];
  if (entry == null) return undefined;
  if (typeof entry === "object" && entry !== null && "value" in entry) {
    return (entry as { value?: unknown }).value;
  }
  return entry;
}

// Usage: readBlueprintParam(readParamValue(params, "discussionBlueprint"));
```

Copy full helpers from **`assets/template-config.ts`** — do not hand-roll per plugin.

**Limits:** ≤ **5** blueprint params per plugin.

**Avoid** free-text blueprint IDs when native picker fits:

```json
// ❌ Bad
{ "blueprintId": { "type": "string", "isRequired": true, "label": "Blueprint" } }

// ✅ Good
{ "discussionBlueprint": { "type": "blueprint", "isRequired": true, "label": "Comment blueprint" } }
```

Name by **semantic role** (`discussionBlueprint`, not `blueprint1`).

## Subject blueprint

Single blueprint type on entity pages:

1. Document in README **Prerequisites**.
2. Read **`pluginData.entity.blueprint`** on entity pages — no subject param.
3. Add **`type: "blueprint"`** only for dashboard use without host entity.

## Datetime property overrides

Optional **`string`** param per date role when widget reads a `datetime` property:

```json
{
  "dueDateProperty": {
    "type": "string",
    "isRequired": false,
    "label": "Due date property",
    "description": "Blueprint datetime property key. Defaults to dueDate when empty."
  }
}
```

```typescript
const dueDateKey = config.dueDateProperty?.trim() || "dueDate";
```

Default in code + document in README when param is blank.

## Relation string params — forbidden by default

**Do not** expose relation keys as `string` params (`parentRelation`, `taskRelation`, …).

**Instead:**

1. Pick/add relation in catalog; document in README **Relations**.
2. Runtime: `entity.relationsObjects`, `relatedTo` search, blueprint GET — **code constant** aligned with README.
3. Optional override param **only** when deployments differ and context + search cannot disambiguate.

### Design-time: inspect schemas before new relations

When plugin on blueprint **A** needs data from **B**, inspect **both** schemas (MCP or `GET /v1/blueprints/{id}`):

| Check | Why |
|-------|-----|
| Existing A → B relation | Reuse identifier |
| Reverse/indirect path | May avoid new link |
| Property on A or B | Relation may be unnecessary |
| Target properties | Confirm B has fields widget reads |

### Runtime resolution order

1. **Catalog (design-time)** — relation IDs in README; constants in code.
2. **`PLUGIN_DATA.entity`** — `relations` / `relationsObjects`.
3. **`relatedTo` search** — “all rows related to this entity”.
4. **Blueprint GET** — pick key from schema when unambiguous.
5. **Optional `string` override** — last resort.

### Decision guide

| Situation | Preferred | Relation string param |
|-----------|-----------|------------------------|
| Entity page with host entity | `entity.relations` / `relationsObjects` | Only if payload omits link |
| All rows related to entity | `relatedTo` search | Only if API cannot express join |
| Predictable relation key | Hard-code constant | N/A |
| Key varies per deployment | Derive from GET + entity | Optional override with default |

## Composable param design (reuse)

**Good pattern:**

```json
{
  "discussionBlueprint": { "type": "blueprint", "isRequired": true, "label": "Comment blueprint" },
  "bodyProperty": { "type": "string", "isRequired": false, "label": "Message property" }
}
```

Reuse param names across sibling plugins when concepts match. Document lineage in README or `types.ts`.

## Sync with TypeScript

Keep **`upload-params.json`** and **`src/types.ts` `PluginConfig`** in lockstep. Every README **Plugin parameters** row mirrors a param key.
