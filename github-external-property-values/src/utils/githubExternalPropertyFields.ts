import type { Entity, GithubExternalPropertyFields } from "../types";
import type { HostSubject } from "./resolveHostEntity";

const REQUIRED_BLUEPRINT = "githubExternalCustomProperty";

/**
 * A single relation value can arrive as a plain identifier string (per the
 * plugins-sdk `EntityRelations` type), an enriched `{ identifier, title }`
 * object, or an array of either (for `many: true` relations) — normalize to
 * a single identifier.
 */
function extractRelationIdentifier(raw: unknown): string | undefined {
  if (typeof raw === "string") return raw.trim() || undefined;
  if (Array.isArray(raw)) return extractRelationIdentifier(raw[0]);
  if (raw && typeof raw === "object" && "identifier" in raw) {
    return extractRelationIdentifier((raw as { identifier?: unknown }).identifier);
  }
  return undefined;
}

/**
 * Reads the sync-rule fields off the current `githubExternalCustomProperty`
 * host entity. Returns null when the widget isn't placed on that blueprint's
 * entity page, or the entity is missing a field the rule needs.
 *
 * Takes the already-resolved `host` (from `resolveHostSubject`) rather than
 * re-deriving the blueprint from `entity.blueprint` alone — Port doesn't
 * always populate that field; `resolveHostSubject` also falls back to
 * `blueprintIdentifier` / `properties.$blueprint`. Checking `entity.blueprint`
 * directly here would silently disagree with `host` and produce a
 * misleading "missing blueprint_name" message instead of "wrong blueprint".
 */
export function readGithubExternalPropertyFields(
  entity: Entity | undefined,
  host: HostSubject | null
): GithubExternalPropertyFields | null {
  if (!entity || !host || host.blueprint !== REQUIRED_BLUEPRINT) return null;

  const props = entity.properties ?? {};
  const blueprintName = props.blueprint_name;
  const propertyName = props.property_name;
  const githubOrg = props.github_org;
  const githubAttrName = props.github_attr_name;
  const syncWorkflow = entity.relations?.entity_update_sync_workflow;

  if (
    typeof blueprintName !== "string" ||
    !blueprintName.trim() ||
    typeof propertyName !== "string" ||
    !propertyName.trim() ||
    typeof githubOrg !== "string" ||
    !githubOrg.trim()
  ) {
    return null;
  }

  return {
    blueprintName: blueprintName.trim(),
    propertyName: propertyName.trim(),
    githubOrg: githubOrg.trim(),
    githubAttrName:
      typeof githubAttrName === "string" ? githubAttrName.trim() : undefined,
    syncWorkflowIdentifier: extractRelationIdentifier(syncWorkflow),
  };
}
