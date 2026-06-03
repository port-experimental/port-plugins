import { t } from "../i18n/instance";
import type { MessageKey } from "../i18n/types";
import { enumStatusTone } from "../i18n/sentiment";
import type { BlueprintPropertyMeta, PortEntity, StatusTone } from "../types";

export { enumStatusTone } from "../i18n/sentiment";

export function getEntityPropertyValue(
  entity: PortEntity,
  propertyId: string
): unknown {
  if (propertyId === "$title") return entity.title;
  if (propertyId === "$identifier") return entity.identifier;
  if (propertyId === "$icon") return entity.icon;

  const nested = entity.properties?.[propertyId];
  if (nested !== undefined) return nested;

  const mirrored = entity.mirrorProperties?.[propertyId];
  if (mirrored !== undefined) return mirrored;

  const top = entity as Record<string, unknown>;
  if (propertyId in top) return top[propertyId];

  return undefined;
}

export function coerceBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  if (typeof value === "string") {
    const v = value.trim().toLowerCase();
    if (["true", "yes", "on", "1", "enabled", "active"].includes(v)) {
      return true;
    }
    if (["false", "no", "off", "0", "disabled", "inactive"].includes(v)) {
      return false;
    }
  }
  return null;
}

export function getArrayItemCount(value: unknown): number {
  if (Array.isArray(value)) return value.length;
  if (value === null || value === undefined) return 0;
  if (typeof value === "string" && value.includes(",")) {
    return value.split(",").filter((s) => s.trim()).length;
  }
  return 1;
}

export function formatArrayCount(count: number): string {
  return String(count);
}

export const MAX_ARRAY_ITEMS_ON_CARD = 8;

/** Normalized labels for array property values (search + display). */
export function normalizeArrayItems(value: unknown): string[] {
  if (value === null || value === undefined) return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => formatEnumLabel(item))
      .filter((label) => label !== "—");
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];
    if (trimmed.includes(",")) {
      return trimmed
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
    }
    return [trimmed];
  }

  const one = formatEnumLabel(value);
  return one === "—" ? [] : [one];
}

const BOOLEAN_I18N: Record<string, { true: MessageKey; false: MessageKey }> = {
  enabled: { true: "boolean.enabled", false: "boolean.disabled" },
  active: { true: "boolean.active", false: "boolean.inactive" },
  healthy: { true: "boolean.healthy", false: "boolean.unhealthy" },
  slo_defined: { true: "boolean.defined", false: "boolean.notDefined" },
  slo: { true: "boolean.defined", false: "boolean.notDefined" },
  published: { true: "boolean.published", false: "boolean.unpublished" },
  verified: { true: "boolean.verified", false: "boolean.unverified" },
};

function booleanKey(identifier: string): string {
  const base = identifier.replace(/^(is_|has_)/, "");
  return base.toLowerCase();
}

export function formatBooleanLabel(
  prop: BlueprintPropertyMeta,
  value: boolean
): string {
  const key = booleanKey(prop.identifier);
  const labels = BOOLEAN_I18N[key];
  if (labels) return t(value ? labels.true : labels.false);
  return t(value ? "boolean.yes" : "boolean.no");
}

export function formatEnumLabel(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "string") return value.trim() || "—";
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.title === "string") return obj.title;
    if (typeof obj.label === "string") return obj.label;
    if (typeof obj.identifier === "string") return obj.identifier;
  }
  return String(value);
}

/** Properties whose string values should render as sentiment-colored pills. */
export function isSentimentEnumProperty(prop: BlueprintPropertyMeta): boolean {
  if (prop.kind === "enum") return true;

  const id = prop.identifier.toLowerCase();
  const title = prop.title.toLowerCase();

  if (
    /^(status|state|stage|phase|priority|severity|type|risk|health|resolution)$/.test(
      id
    )
  ) {
    return true;
  }

  if (/^(status|state|priority|severity|type)$/.test(title)) {
    return true;
  }

  return (
    id.endsWith("_status") ||
    id.endsWith("_state") ||
    id.endsWith("_priority") ||
    id.endsWith("Status")
  );
}

export function shouldRenderSentimentEnum(
  prop: BlueprintPropertyMeta,
  value: unknown
): boolean {
  if (!isSentimentEnumProperty(prop)) return false;
  return formatEnumLabel(value) !== "—";
}

export function booleanStatusTone(value: boolean): StatusTone {
  return value ? "success" : "danger";
}

function formatPrimitive(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.trim() || "—";
  return String(value);
}

export function formatDefaultPropertyValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    if (typeof obj.title === "string") return obj.title;
    if (typeof obj.identifier === "string") return obj.identifier;
    if (typeof obj.name === "string") return obj.name;
    try {
      return JSON.stringify(value);
    } catch {
      return "—";
    }
  }
  return formatPrimitive(value);
}

export function splitPropertiesByKind(
  properties: BlueprintPropertyMeta[],
  getBooleanDisplayMode?: (propertyId: string) => "pill" | "labeled"
): {
  body: BlueprintPropertyMeta[];
  status: BlueprintPropertyMeta[];
} {
  const status: BlueprintPropertyMeta[] = [];
  const body: BlueprintPropertyMeta[] = [];

  for (const prop of properties) {
    if (prop.kind === "boolean") {
      const mode = getBooleanDisplayMode?.(prop.identifier) ?? "labeled";
      if (mode === "labeled") {
        body.push(prop);
      } else {
        status.push(prop);
      }
    } else {
      body.push(prop);
    }
  }

  return { body, status };
}
