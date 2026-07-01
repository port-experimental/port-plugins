import { resolveDefinition } from "../surveys/registry";
import type { Entity, SurveyDefinition } from "../types";

/** Everything the UI needs to render and submit a survey, derived from an entity. */
export type SurveyContext = {
  surveyId: string;
  surveyBlueprint: string;
  title: string;
  status?: string;
  definition: SurveyDefinition;
};

/**
 * Build a SurveyContext from a `survey` entity. The definition comes from the
 * entity's inline `definition` property when present (full abstraction),
 * otherwise from the built-in template matched on `framework`.
 */
export function surveyContextFromEntity(entity: Entity): SurveyContext {
  const p = entity.properties ?? {};
  const definition = resolveDefinition({
    inline: p.definition,
    framework: typeof p.framework === "string" ? p.framework : null,
  });
  return {
    surveyId: entity.identifier,
    surveyBlueprint: entity.blueprint || "survey",
    title: entity.title || definition.title,
    status: typeof p.status === "string" ? p.status : undefined,
    definition,
  };
}
