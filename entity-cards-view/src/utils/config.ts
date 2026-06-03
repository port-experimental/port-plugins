import type { BlueprintParam, Params, PluginConfig } from "../types";

function readBlueprintParam(raw: unknown): BlueprintParam | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.identifier !== "string" || !obj.identifier.trim()) {
    return null;
  }
  return {
    ...obj,
    identifier: obj.identifier.trim(),
    title:
      typeof obj.title === "string" ? obj.title : String(obj.identifier).trim(),
  } as BlueprintParam;
}

export function configFromParams(params: Params): PluginConfig | null {
  const blueprint = readBlueprintParam(params.blueprint?.value);
  if (!blueprint) return null;
  return { blueprint };
}
