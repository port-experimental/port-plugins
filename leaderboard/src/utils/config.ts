import type { EntitiesQuery } from "@port-labs/plugins-sdk";
import type { BlueprintParam, Params, PluginConfig, SortDirection } from "../types";

/** Accept blueprint picker value as object or plain identifier string. */
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

/** Port may send params as { type, value } or pass value directly on the entry. */
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

export function readNumberParam(raw: unknown, defaultValue: number): number {
  const str = readStringParam(raw as string | undefined);
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  const parsed = Number(str);
  return str && Number.isFinite(parsed) ? parsed : defaultValue;
}

export function readSortDirection(raw: unknown, defaultValue: SortDirection): SortDirection {
  const str = readStringParam(raw, "").toLowerCase();
  return str === "asc" || str === "desc" ? str : defaultValue;
}

/** Optional extra dataset filter, same shape as a Port entities-search query. */
export function readFilterParam(raw: unknown): EntitiesQuery | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (obj.combinator !== "and" && obj.combinator !== "or") return null;
  if (!Array.isArray(obj.rules)) return null;
  return obj as EntitiesQuery;
}

/**
 * Return null when required params (blueprint, sortProperty) are missing,
 * App shows a setup message.
 */
export function configFromParams(params: Params): PluginConfig | null {
  const blueprint = readBlueprintParam(readParamValue(params, "blueprint"));
  const sortProperty = readStringParam(readParamValue(params, "sortProperty"));
  if (!blueprint || !sortProperty) return null;

  return {
    blueprint,
    sortProperty,
    sortDirection: readSortDirection(readParamValue(params, "sortDirection"), "desc"),
    limit: readNumberParam(readParamValue(params, "limit"), 10),
    filter: readFilterParam(readParamValue(params, "filter")),
  };
}
