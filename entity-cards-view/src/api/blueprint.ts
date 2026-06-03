import { getI18nLocale } from "../i18n/instance";
import { MOCK_BLUEPRINT_PROPERTIES } from "../dev/mockData";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import type { BlueprintPropertyMeta, PropertyKind } from "../types";
import { portFetch } from "./portFetch";

function pickBlueprintRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const bp = root.blueprint ?? root;
  if (!bp || typeof bp !== "object") return null;
  return bp as Record<string, unknown>;
}

function resolvePropertyKind(
  def: Record<string, unknown>
): Pick<BlueprintPropertyMeta, "kind" | "enumValues"> {
  const type = typeof def.type === "string" ? def.type : undefined;

  if (type === "boolean") {
    return { kind: "boolean" };
  }

  if (type === "array") {
    return { kind: "array" };
  }

  const enumValues = Array.isArray(def.enum)
    ? def.enum.filter((v): v is string => typeof v === "string")
    : undefined;

  if (enumValues && enumValues.length > 0) {
    return { kind: "enum", enumValues };
  }

  if (type === "string" && Array.isArray(def.oneOf)) {
    const fromOneOf = def.oneOf
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const c = (item as { const?: unknown }).const;
        return typeof c === "string" ? c : null;
      })
      .filter((v): v is string => !!v);
    if (fromOneOf.length > 0) {
      return { kind: "enum", enumValues: fromOneOf };
    }
  }

  return { kind: "default" };
}

function propertyTitle(
  def: Record<string, unknown> | undefined,
  identifier: string
): string {
  return typeof def?.title === "string" && def.title.trim()
    ? def.title.trim()
    : identifier;
}

function extractSchemaBlueprintProperties(
  schema: Record<string, unknown>
): BlueprintPropertyMeta[] {
  const properties = schema.properties;
  if (!properties || typeof properties !== "object") return [];

  const reserved = new Set(["$identifier", "$title", "$team", "$icon"]);

  return Object.entries(properties as Record<string, Record<string, unknown>>)
    .filter(([id]) => !reserved.has(id))
    .map(([identifier, def]) => {
      const { kind, enumValues } = resolvePropertyKind(def ?? {});
      return {
        identifier,
        title: propertyTitle(def, identifier),
        type: typeof def?.type === "string" ? def.type : undefined,
        kind,
        ...(enumValues ? { enumValues } : {}),
      };
    });
}

function extractMirrorBlueprintProperties(
  mirrorProperties: unknown
): BlueprintPropertyMeta[] {
  if (!mirrorProperties || typeof mirrorProperties !== "object") return [];

  return Object.entries(
    mirrorProperties as Record<string, Record<string, unknown>>
  ).map(([identifier, def]) => ({
    identifier,
    title: propertyTitle(def, identifier),
    kind: "default" as const,
  }));
}

export function extractBlueprintProperties(
  blueprintPayload: unknown
): BlueprintPropertyMeta[] {
  const bp = pickBlueprintRecord(blueprintPayload);
  if (!bp) return [];

  const schema = bp.schema;
  const schemaProps =
    schema && typeof schema === "object"
      ? extractSchemaBlueprintProperties(schema as Record<string, unknown>)
      : [];

  const byId = new Map<string, BlueprintPropertyMeta>();
  for (const prop of schemaProps) {
    byId.set(prop.identifier, prop);
  }
  for (const prop of extractMirrorBlueprintProperties(bp.mirrorProperties)) {
    if (!byId.has(prop.identifier)) {
      byId.set(prop.identifier, prop);
    }
  }

  return [...byId.values()].sort((a, b) =>
    a.title.localeCompare(b.title, getI18nLocale(), { sensitivity: "base" })
  );
}

export async function fetchBlueprintProperties(
  baseUrl: string,
  token: string,
  blueprintIdentifier: string
): Promise<BlueprintPropertyMeta[]> {
  if (DEV_MOCK) return MOCK_BLUEPRINT_PROPERTIES;

  const path = `/v1/blueprints/${encodeURIComponent(blueprintIdentifier)}`;
  const res = await portFetch(baseUrl, token, path, { method: "GET" });
  const data = await res.json();
  return extractBlueprintProperties(data);
}
