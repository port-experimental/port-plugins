import type { PortEntity } from "../types";
import {
  formatEnumLabel,
  getEntityPropertyValue,
  normalizeArrayItems,
} from "./propertyFormat";
import { stringMatchesSearch } from "./normalizeText";

function valueMatchesSearchTerm(value: unknown, term: string): boolean {
  if (value === null || value === undefined) return false;

  if (Array.isArray(value)) {
    const items = normalizeArrayItems(value);
    if (items.some((item) => stringMatchesSearch(item, term))) return true;
    return value.some((item) => valueMatchesSearchTerm(item, term));
  }

  if (typeof value === "object") {
    return valueMatchesSearchTerm(formatEnumLabel(value), term);
  }

  return stringMatchesSearch(String(value), term);
}

/** Match title, identifier, and values shown on cards (visible properties only). */
export function entityMatchesSearch(
  entity: PortEntity,
  term: string,
  visiblePropertyIds: string[]
): boolean {
  const q = term.trim();
  if (!q) return true;

  if (stringMatchesSearch(entity.title ?? "", q)) return true;
  if (stringMatchesSearch(entity.identifier, q)) return true;

  for (const propertyId of visiblePropertyIds) {
    const value = getEntityPropertyValue(entity, propertyId);
    if (valueMatchesSearchTerm(value, q)) return true;
  }

  return false;
}
