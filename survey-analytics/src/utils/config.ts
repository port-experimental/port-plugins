import type { BlueprintParam, Params, PluginConfig } from "../types";

function resolveBlueprint(param: unknown): BlueprintParam | null {
  if (!param) return null;
  if (typeof param === "string" && param.trim())
    return { identifier: param.trim() };
  if (typeof param === "object" && param !== null) {
    const id = (param as Record<string, unknown>).identifier;
    if (typeof id === "string" && id.trim()) return param as BlueprintParam;
  }
  return null;
}

export function configFromParams(params: Params | null): PluginConfig | null {
  if (!params) return null;

  const surveyRaw = params.surveyBlueprint?.value;
  const responseRaw = params.responseBlueprint?.value;

  const surveyBlueprint = resolveBlueprint(surveyRaw);
  const responseBlueprint = resolveBlueprint(responseRaw);

  if (!surveyBlueprint || !responseBlueprint) return null;

  return { surveyBlueprint, responseBlueprint };
}
