import { useQuery } from "@tanstack/react-query";
import { fetchBlueprint } from "../api/blueprints";
import { defaultCommentBlueprintId, subjectFromEntity } from "../utils/config";
import { getEntityBlueprintId } from "../utils/entityBlueprint";
import type { Entity, SubjectContext } from "../types";
import type { BlueprintSchema } from "../types";

export function useCommentBlueprint(
  entity: Entity | undefined,
  portToken: string | null,
  portApiBaseUrl: string | null
): {
  blueprint: BlueprintSchema | undefined;
  subject: SubjectContext | null;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  missingRelation: boolean;
  subjectBlueprintId: string | null;
} {
  const blueprintId = defaultCommentBlueprintId();

  const blueprintQuery = useQuery({
    queryKey: ["commentBlueprint", blueprintId, portApiBaseUrl],
    enabled: Boolean(portToken && portApiBaseUrl),
    queryFn: () => fetchBlueprint(portApiBaseUrl!, portToken!, blueprintId),
  });

  const blueprint = blueprintQuery.data;
  const subjectBlueprintId = entity ? getEntityBlueprintId(entity) : null;
  const subject =
    entity && blueprint && subjectBlueprintId
      ? subjectFromEntity(entity, blueprint)
      : null;

  return {
    blueprint,
    subject,
    isLoading: blueprintQuery.isLoading,
    isError: blueprintQuery.isError,
    error: blueprintQuery.error,
    missingRelation: Boolean(
      entity &&
        blueprint &&
        subjectBlueprintId &&
        !subject
    ),
    subjectBlueprintId,
  };
}
