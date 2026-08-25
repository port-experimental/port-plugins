import { useQuery } from "@tanstack/react-query";
import { fetchBlueprints } from "../../api/blueprints";
import { CATALOG_STALE_TIME_MS } from "./constants";

export function useBlueprintsCatalogQuery(
  portApiBaseUrl: string,
  portToken: string,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["blueprints", portToken],
    queryFn: () => fetchBlueprints(portApiBaseUrl, portToken),
    enabled,
    staleTime: CATALOG_STALE_TIME_MS,
  });
}
