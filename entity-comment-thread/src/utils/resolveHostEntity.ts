import type { Entity } from "../types";

export type HostSubject = {
  blueprint: string;
  identifier: string;
  title?: string;
};

export function resolveHostSubject(entity?: Entity): HostSubject | null {
  if (!entity?.identifier?.trim()) return null;

  const raw = entity as Entity & Record<string, unknown>;
  const blueprint =
    (typeof raw.blueprint === "string" && raw.blueprint.trim()) ||
    (typeof raw.blueprintIdentifier === "string" &&
      (raw as Record<string, unknown>).blueprintIdentifier &&
      String((raw as Record<string, unknown>).blueprintIdentifier).trim()) ||
    (typeof entity.properties?.$blueprint === "string" &&
      String(entity.properties.$blueprint).trim()) ||
    "";

  if (!blueprint) return null;

  return {
    blueprint,
    identifier: entity.identifier.trim(),
    title: entity.title,
  };
}
