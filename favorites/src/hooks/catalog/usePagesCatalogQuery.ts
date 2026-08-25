import { useQuery } from "@tanstack/react-query";
import { fetchPages } from "../../api/pages";
import { CATALOG_STALE_TIME_MS } from "./constants";

export function usePagesCatalogQuery(
  portApiBaseUrl: string,
  portToken: string,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["pages", portToken],
    queryFn: () => fetchPages(portApiBaseUrl, portToken),
    enabled,
    staleTime: CATALOG_STALE_TIME_MS,
  });
}
