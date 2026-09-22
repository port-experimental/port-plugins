import { useQuery } from "@tanstack/react-query";
import { searchLeaderboardEntities } from "../api/searchEntities";
import type { LeaderboardEntry, Page, PluginConfig } from "../types";

function extractNumericValue(properties: Record<string, unknown> | undefined, key: string): number | null {
  const raw = properties?.[key];
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

export function useLeaderboardData(
  config: PluginConfig | null,
  portToken: string | null,
  portApiBaseUrl: string | null,
  page: Page | undefined
) {
  const query = useQuery({
    queryKey: [
      "leaderboard",
      config?.blueprint.identifier,
      config?.sortProperty,
      config?.sortDirection,
      config?.limit,
      config?.filter,
      page?.identifier,
      page?.pageFilters,
    ],
    enabled: !!portToken && !!portApiBaseUrl && !!config,
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      if (!config || !portToken || !portApiBaseUrl) return [];
      const entities = await searchLeaderboardEntities(
        portApiBaseUrl,
        portToken,
        config.blueprint,
        page,
        config.filter,
        config.sortProperty
      );

      const withValues = entities.map((entity) => ({
        entity,
        value: extractNumericValue(entity.properties, config.sortProperty),
      }));

      const direction = config.sortDirection === "asc" ? 1 : -1;
      withValues.sort((a, b) => {
        if (a.value === null && b.value === null) return 0;
        if (a.value === null) return 1;
        if (b.value === null) return -1;
        return (a.value - b.value) * direction;
      });

      return withValues.slice(0, config.limit).map((row, index) => ({
        entity: row.entity,
        value: row.value,
        rank: index + 1,
      }));
    },
  });

  return { query };
}
