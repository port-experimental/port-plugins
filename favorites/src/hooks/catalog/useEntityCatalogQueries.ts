import { useQueries } from "@tanstack/react-query";
import { fetchEntitiesForBlueprint } from "../../api/entities";
import type { PortBlueprint } from "../../types";
import { ENTITY_CATALOG_STALE_TIME_MS } from "./constants";

export function useEntityCatalogQueries(
  portApiBaseUrl: string,
  portToken: string,
  blueprints: PortBlueprint[],
  enabled: boolean
) {
  return useQueries({
    queries: blueprints.map((blueprint) => ({
      queryKey: ["entities", blueprint.identifier, portToken],
      queryFn: () =>
        fetchEntitiesForBlueprint(
          portApiBaseUrl,
          portToken,
          blueprint.identifier
        ),
      enabled,
      staleTime: ENTITY_CATALOG_STALE_TIME_MS,
    })),
  });
}
