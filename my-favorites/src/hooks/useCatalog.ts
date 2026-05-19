import { useQuery } from "@tanstack/react-query";
import { fetchActions } from "../api/actions";
import { fetchBlueprints } from "../api/blueprints";
import { searchBlueprintEntities } from "../api/entities";
import { fetchPages } from "../api/pages";

export function usePages(portToken: string | null, portApiBaseUrl: string | null) {
  return useQuery({
    queryKey: ["catalog", "pages"],
    queryFn: () => fetchPages(portApiBaseUrl!, portToken!),
    enabled: !!portToken && !!portApiBaseUrl,
    staleTime: 5 * 60 * 1000,
  });
}

export function useActions(portToken: string | null, portApiBaseUrl: string | null) {
  return useQuery({
    queryKey: ["catalog", "actions"],
    queryFn: () => fetchActions(portApiBaseUrl!, portToken!),
    enabled: !!portToken && !!portApiBaseUrl,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlueprints(
  portToken: string | null,
  portApiBaseUrl: string | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["catalog", "blueprints"],
    queryFn: () => fetchBlueprints(portApiBaseUrl!, portToken!),
    enabled: enabled && !!portToken && !!portApiBaseUrl,
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlueprintEntities(
  portToken: string | null,
  portApiBaseUrl: string | null,
  blueprint: string | null
) {
  return useQuery({
    queryKey: ["catalog", "entities", blueprint],
    queryFn: () =>
      searchBlueprintEntities(portApiBaseUrl!, portToken!, blueprint!),
    enabled: !!portToken && !!portApiBaseUrl && !!blueprint,
    staleTime: 2 * 60 * 1000,
  });
}
