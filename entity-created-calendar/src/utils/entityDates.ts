import type { CalendarEntity, Entity, PluginConfig } from "../types";
import { parseCreatedDate, toDateKey } from "./dates";

export function getEntityCreatedDate(
  entity: Entity,
  createdDateProperty: string
): Date | null {
  if (createdDateProperty) {
    return parseCreatedDate(entity.properties?.[createdDateProperty]);
  }
  return (
    parseCreatedDate(entity.createdAt) ??
    parseCreatedDate(entity.properties?.createdDate) ??
    parseCreatedDate(entity.properties?.createdAt)
  );
}

export function toCalendarEntities(
  entities: Entity[],
  config: PluginConfig
): CalendarEntity[] {
  const result: CalendarEntity[] = [];
  for (const entity of entities) {
    const createdDate = getEntityCreatedDate(
      entity,
      config.createdDateProperty
    );
    if (!createdDate) continue;
    result.push({
      identifier: entity.identifier,
      title: entity.title?.trim() || entity.identifier,
      createdDate,
    });
  }
  return result;
}

export function groupEntitiesByDateKey(
  items: CalendarEntity[]
): Map<string, CalendarEntity[]> {
  const map = new Map<string, CalendarEntity[]>();
  for (const item of items) {
    const key = toDateKey(item.createdDate);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }
  return map;
}
