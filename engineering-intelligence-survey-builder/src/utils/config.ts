import type { BlueprintParam, Params, PluginConfig } from "../types";

/** Accept a blueprint picker value as an object or a plain identifier string. */
export function readBlueprintParam(raw: unknown): BlueprintParam | null {
  if (typeof raw === "string" && raw.trim()) {
    const id = raw.trim();
    return { identifier: id, title: id };
  }
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.identifier !== "string" || !obj.identifier.trim()) return null;
  return {
    ...obj,
    identifier: obj.identifier.trim(),
    title: typeof obj.title === "string" ? obj.title : obj.identifier.trim(),
  } as BlueprintParam;
}

/** Port may send params as { type, value } or a bare value on the entry. */
export function readParamValue(params: Params, key: string): unknown {
  const entry = params[key];
  if (entry == null) return undefined;
  if (typeof entry === "object" && entry !== null && "value" in entry) {
    return (entry as { value?: unknown }).value;
  }
  return entry;
}

/**
 * Build PluginConfig from params. Returns null only when the required
 * surveyBlueprint is missing, in which case the App renders a setup message.
 */
export function configFromParams(params: Params): PluginConfig | null {
  const surveyBlueprint = readBlueprintParam(
    readParamValue(params, "surveyBlueprint")
  );
  if (!surveyBlueprint) return null;
  const rawUrl = readParamValue(params, "respondentUrl");
  const respondentUrl =
    typeof rawUrl === "string" && rawUrl.trim() ? rawUrl.trim() : undefined;
  const rawAnalytics = readParamValue(params, "analyticsUrl");
  const analyticsUrl =
    typeof rawAnalytics === "string" && rawAnalytics.trim() ? rawAnalytics.trim() : undefined;
  return { surveyBlueprint, respondentUrl, analyticsUrl };
}
