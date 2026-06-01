import { useQuery } from "@tanstack/react-query";
import { fetchCardEntityPool } from "../api/entities";
import type { Page, PluginConfig } from "../types";

export function useCardEntityPool(
  config: PluginConfig | null,
  portToken: string | null,
  portApiBaseUrl: string | null,
  page: Page | undefined,
  visiblePropertyIds: string[]
) {
  const blueprintId = config?.blueprint.identifier ?? "";

  return useQuery({
    queryKey: [
      "entity-card-pool",
      blueprintId,
      visiblePropertyIds.join(","),
      portApiBaseUrl,
      page?.identifier,
      JSON.stringify(page?.pageFilters ?? null),
    ],
    queryFn: () =>
      fetchCardEntityPool(
        portApiBaseUrl!,
        portToken!,
        config!.blueprint,
        page,
        visiblePropertyIds
      ),
    enabled: !!config && !!portToken && !!portApiBaseUrl,
  });
}
