import type { PortBlueprint, PortEntity } from "../types";

function collectTextualValues(value: unknown, parts: string[]): void {
  if (value === null || value === undefined) return;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed) parts.push(trimmed);
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => collectTextualValues(item, parts));
    return;
  }

  if (typeof value === "object") {
    Object.values(value).forEach((item) => collectTextualValues(item, parts));
  }
}

export function entityMatchesSearch(
  blueprint: PortBlueprint,
  entity: PortEntity,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const parts: string[] = [];
  collectTextualValues(entity.title, parts);
  collectTextualValues(entity.identifier, parts);
  collectTextualValues(entity.blueprint, parts);
  collectTextualValues(blueprint.title, parts);
  collectTextualValues(blueprint.identifier, parts);
  collectTextualValues(entity.properties, parts);
  collectTextualValues(entity.relations, parts);

  return parts.some((part) => part.toLowerCase().includes(q));
}
