import type { BlueprintSchema, Entity, SubjectContext } from "../types";
import { COMMENT_BLUEPRINT, PARENT_COMMENT_RELATION } from "../types";
import { getEntityBlueprintId } from "./entityBlueprint";

export function resolveSubjectRelationKey(
  commentBlueprint: BlueprintSchema,
  subjectBlueprint: string
): string | null {
  const relations = commentBlueprint.relations ?? {};
  const matches = Object.entries(relations).filter(([key, rel]) => {
    if (key === PARENT_COMMENT_RELATION) return false;
    if (!rel || typeof rel !== "object") return false;
    const target =
      typeof rel.target === "string"
        ? rel.target
        : (rel as { targetBlueprint?: string }).targetBlueprint;
    return target === subjectBlueprint;
  });
  if (matches.length === 1) return matches[0][0];
  if (matches.length > 1) {
    const preferred = matches.find(([key]) =>
      key.toLowerCase().includes(subjectBlueprint.toLowerCase())
    );
    return preferred?.[0] ?? matches[0][0];
  }
  return null;
}

export function subjectFromEntity(
  entity: Entity,
  commentBlueprint: BlueprintSchema
): SubjectContext | null {
  const blueprint = getEntityBlueprintId(entity);
  if (!blueprint || !entity.identifier) return null;
  const subjectRelationKey = resolveSubjectRelationKey(
    commentBlueprint,
    blueprint
  );
  if (!subjectRelationKey) return null;
  return {
    blueprint,
    identifier: entity.identifier,
    title: entity.title,
    subjectRelationKey,
  };
}

export function defaultCommentBlueprintId(): string {
  return COMMENT_BLUEPRINT;
}
