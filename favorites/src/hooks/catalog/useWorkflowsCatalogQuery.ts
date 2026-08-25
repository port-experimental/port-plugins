import { useQuery } from "@tanstack/react-query";
import { fetchSelfServiceWorkflowTriggers } from "../../api/workflows";
import { CATALOG_STALE_TIME_MS } from "./constants";

export function useWorkflowsCatalogQuery(
  portApiBaseUrl: string,
  portToken: string,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["workflows", portToken],
    queryFn: () => fetchSelfServiceWorkflowTriggers(portApiBaseUrl, portToken),
    enabled,
    staleTime: CATALOG_STALE_TIME_MS,
  });
}
