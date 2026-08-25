import { useQuery } from "@tanstack/react-query";
import { fetchActions } from "../../api/actions";
import { CATALOG_STALE_TIME_MS } from "./constants";

export function useActionsCatalogQuery(
  portApiBaseUrl: string,
  portToken: string,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["actions", portToken],
    queryFn: () => fetchActions(portApiBaseUrl, portToken),
    enabled,
    staleTime: CATALOG_STALE_TIME_MS,
  });
}
