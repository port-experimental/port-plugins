import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchBlueprintEntities } from "../api/entities";
import type { PluginConfig } from "../types";
import {
  groupEntitiesByDateKey,
  toCalendarEntities,
} from "../utils/entityDates";

export function useCalendarEntities(
  config: PluginConfig | null,
  portToken: string | null,
  portApiBaseUrl: string | null
) {
  const query = useQuery({
    queryKey: [
      "calendar-entities",
      config?.blueprint.identifier,
      portToken,
    ],
    queryFn: () =>
      searchBlueprintEntities(
        config!.blueprint.identifier,
        portToken!,
        portApiBaseUrl!
      ),
    enabled: !!config && !!portToken && !!portApiBaseUrl,
    staleTime: 5 * 60 * 1000,
  });

  const calendarEntities = useMemo(() => {
    if (!config || !query.data) return [];
    return toCalendarEntities(query.data, config);
  }, [config, query.data]);

  const byDateKey = useMemo(
    () => groupEntitiesByDateKey(calendarEntities),
    [calendarEntities]
  );

  return { ...query, calendarEntities, byDateKey };
}
