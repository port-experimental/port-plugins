import type { Entity } from "../types";

export type HostSubject = {
  blueprint: string;
  identifier: string;
};

/**
 * Entity-page widgets: resolve subject blueprint + identifier from PLUGIN_DATA.
 * Port host payloads vary — do not assume only entity.blueprint.
 */
export function resolveHostSubject(entity?: Entity): HostSubject | null {
  if (!entity?.identifier?.trim()) return null;

  const raw = entity as Entity & Record<string, unknown>;
  const blueprint =
    (typeof raw.blueprint === "string" && raw.blueprint.trim()) ||
    (typeof raw.blueprintIdentifier === "string" &&
      raw.blueprintIdentifier.trim()) ||
    (typeof entity.properties?.$blueprint === "string" &&
      String(entity.properties.$blueprint).trim()) ||
    "";

  if (!blueprint) return null;

  return {
    blueprint,
    identifier: entity.identifier.trim(),
  };
}
