import type { BlueprintParam, Params, PluginConfig } from "../types";

export function blueprintFromParam(value: unknown): BlueprintParam | null {
  if (!value) return null;
  if (typeof value === "string" && value.trim()) {
    return { identifier: value.trim(), title: value.trim() };
  }
  if (typeof value === "object" && value !== null && "identifier" in value) {
    const v = value as { identifier: string; title?: string };
    if (!v.identifier?.trim()) return null;
    return {
      identifier: v.identifier.trim(),
      title: (v.title ?? v.identifier).trim(),
    };
  }
  return null;
}

export function configFromParams(params: Params): PluginConfig | null {
  const blueprint = blueprintFromParam(params.blueprint?.value);
  if (!blueprint) return null;

  const createdDateProperty = String(
    params.createdDateProperty?.value ?? ""
  ).trim();

  return { blueprint, createdDateProperty };
}
