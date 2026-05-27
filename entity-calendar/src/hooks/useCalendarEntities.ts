import { useQuery } from "@tanstack/react-query";
import { searchBlueprintEntities } from "../api/entities";
import type { CalendarEntity, Page, PluginConfig } from "../types";
import { getEntityDateKey } from "../utils/entityDates";

export function useCalendarEntities(
  config: PluginConfig | null,
  portToken: string | null,
  portApiBaseUrl: string | null,
  page?: Page
) {
  return useQuery({
    queryKey: [
      "calendar-entities",
      config?.blueprint.identifier,
      config?.createdDateProperty,
      portToken,
      page?.pageFilters,
    ],
    queryFn: async () => {
      if (!config || !portToken || !portApiBaseUrl) {
        throw new Error("Missing Port context or blueprint configuration");
      }

      const entities = await searchBlueprintEntities(
        portApiBaseUrl,
        portToken,
        config.blueprint,
        page
      );

      const dated: CalendarEntity[] = [];
      for (const entity of entities) {
        const dateKey = getEntityDateKey(
          entity,
          config.createdDateProperty
        );
        if (!dateKey) continue;
        dated.push({
          identifier: entity.identifier,
          title: entity.title?.trim() || entity.identifier,
          dateKey,
        });
      }

      return dated;
    },
    enabled: !!config && !!portToken && !!portApiBaseUrl,
    staleTime: 5 * 60 * 1000,
  });
}

export function groupEntitiesByDate(
  entities: CalendarEntity[]
): Map<string, CalendarEntity[]> {
  const map = new Map<string, CalendarEntity[]>();
  for (const entity of entities) {
    const list = map.get(entity.dateKey) ?? [];
    list.push(entity);
    map.set(entity.dateKey, list);
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.title.localeCompare(b.title));
  }
  return map;
}
