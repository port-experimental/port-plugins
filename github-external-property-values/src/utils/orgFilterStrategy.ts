import type { BlueprintSchema, OrgFilterStrategy } from "../types";

const ORG_PROPERTY_KEY = "github_org";
const ORG_RELATION_TARGET_BLUEPRINT = "githubOrganization";

/**
 * Decides how to filter the target blueprint's entities down to a given
 * GitHub org, purely from its schema — no hardcoded blueprint names.
 *
 * Two flows are known to exist in this catalog (see README "How org
 * filtering is resolved"):
 *  - a direct/mirror property literally named `github_org`
 *    (e.g. `service.github_org`, mirrored from `github_repository.organization.$identifier`)
 *  - a `relations.organization` link to `githubOrganization`, whose entity
 *    identifier equals the org login (e.g. `githubRepository.organization`)
 */
export function resolveOrgFilterStrategy(
  targetBlueprint: BlueprintSchema
): OrgFilterStrategy {
  const mirrorOrgProperty = targetBlueprint.mirrorProperties?.[ORG_PROPERTY_KEY];
  const hasOrgProperty =
    Boolean(targetBlueprint.schema?.properties?.[ORG_PROPERTY_KEY]) ||
    Boolean(mirrorOrgProperty) ||
    Boolean(targetBlueprint.calculationProperties?.[ORG_PROPERTY_KEY]);

  if (hasOrgProperty) {
    return {
      kind: "property",
      propertyKey: ORG_PROPERTY_KEY,
      path: mirrorOrgProperty?.path ?? ORG_PROPERTY_KEY,
    };
  }

  const relations = targetBlueprint.relations ?? {};
  const orgRelationEntry = Object.entries(relations).find(
    ([, relation]) => relation.target === ORG_RELATION_TARGET_BLUEPRINT
  );
  if (orgRelationEntry) {
    const relationKey = orgRelationEntry[0];
    return {
      kind: "relation",
      relationKey,
      targetBlueprint: ORG_RELATION_TARGET_BLUEPRINT,
      path: `${relationKey}.$identifier`,
    };
  }

  return { kind: "unsupported" };
}
