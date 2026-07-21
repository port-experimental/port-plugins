import type { BlueprintParam, Params, PluginConfig } from "../types";

/** Port may send params as { type, value } or pass value directly on the entry. */
export function readParamValue(params: Params, key: string): unknown {
  const entry = params[key];
  if (entry == null) return undefined;
  if (typeof entry === "object" && entry !== null && "value" in entry) {
    return (entry as { value?: unknown }).value;
  }
  return entry;
}

function readBlueprintParam(raw: unknown): BlueprintParam | null {
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

function readNumber(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    const n = Number(raw);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function configFromParams(params: Params | null): PluginConfig | null {
  if (!params) return null;

  const copilotOrgUsageBlueprint = readBlueprintParam(
    readParamValue(params, "copilotOrgUsageBlueprint")
  );
  if (!copilotOrgUsageBlueprint) return null;

  const licensedSeats = readNumber(readParamValue(params, "licensedSeats"));
  const dayPropRaw = readParamValue(params, "dayProp");
  const dayProp =
    typeof dayPropRaw === "string" && dayPropRaw.trim()
      ? dayPropRaw.trim()
      : "record_date";

  const copilotInsightsBlueprint = readBlueprintParam(
    readParamValue(params, "copilotInsightsBlueprint")
  );

  const copilotInsightsActionRaw = readParamValue(params, "copilotInsightsAction");
  const copilotInsightsAction =
    typeof copilotInsightsActionRaw === "string" && copilotInsightsActionRaw.trim()
      ? copilotInsightsActionRaw.trim()
      : null;

  return { copilotOrgUsageBlueprint, licensedSeats, dayProp, copilotInsightsBlueprint, copilotInsightsAction };
}
