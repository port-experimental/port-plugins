import type { Params, PluginConfig } from "../types";

export function readParamValue(params: Params, key: string): unknown {
  const entry = params[key];
  if (entry == null) return undefined;
  if (typeof entry === "object" && entry !== null && "value" in entry) {
    return (entry as { value?: unknown }).value;
  }
  return entry;
}

export function readStringParam(raw: unknown, defaultValue = ""): string {
  if (raw == null) return defaultValue;
  if (typeof raw === "string") return raw.trim() || defaultValue;
  if (typeof raw === "object" && raw !== null && "value" in raw) {
    const v = (raw as { value?: unknown }).value;
    return typeof v === "string" && v.trim() ? v.trim() : defaultValue;
  }
  return defaultValue;
}

export function configFromParams(params: Params): PluginConfig | null {
  const targetDateTime = readStringParam(readParamValue(params, "targetDateTime"));
  if (!targetDateTime) return null;

  return {
    title: readStringParam(readParamValue(params, "title")),
    targetDateTime,
  };
}
