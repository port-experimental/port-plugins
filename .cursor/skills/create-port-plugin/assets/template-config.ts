import type { BlueprintParam, Params, PluginConfig } from "../types";

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
    title:
      typeof obj.title === "string" ? obj.title : obj.identifier.trim(),
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

/**
 * Replace keys and fields to match upload-params.json / PluginConfig.
 * Return null when required params are missing — App shows a setup message.
 */
export function configFromParams(params: Params): PluginConfig | null {
  const blueprint = readBlueprintParam(readParamValue(params, "blueprint"));
  if (!blueprint) return null;

  return {
    blueprint,
    // exampleOptional: readStringParam(readParamValue(params, "exampleOptional")),
  };
}
