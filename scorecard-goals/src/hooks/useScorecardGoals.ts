import { useQuery } from "@tanstack/react-query";
import { searchBlueprintEntities } from "../api/entities";
import { fetchBlueprintScorecards } from "../api/scorecards";
import type { PluginConfig, ScorecardComplianceRow } from "../types";
import { computeScorecardCompliance } from "../utils/entityScorecardStats";

export function useScorecardGoals(
  config: PluginConfig | null,
  portToken: string | null,
  portApiBaseUrl: string | null
) {
  const blueprintId = config?.blueprint.identifier ?? null;
  const enabled = !!config && !!portToken && !!portApiBaseUrl;

  const scorecardsQuery = useQuery({
    queryKey: ["scorecards", blueprintId, portApiBaseUrl],
    queryFn: () =>
      fetchBlueprintScorecards(
        portApiBaseUrl!,
        portToken!,
        blueprintId!
      ),
    enabled,
  });

  const entitiesQuery = useQuery({
    queryKey: ["entities", blueprintId, portApiBaseUrl],
    queryFn: () =>
      searchBlueprintEntities(
        portApiBaseUrl!,
        portToken!,
        blueprintId!
      ),
    enabled,
  });

  const rows: ScorecardComplianceRow[] =
    scorecardsQuery.data && entitiesQuery.data
      ? computeScorecardCompliance(scorecardsQuery.data, entitiesQuery.data)
      : [];

  const isLoading = scorecardsQuery.isLoading || entitiesQuery.isLoading;
  const isError = scorecardsQuery.isError || entitiesQuery.isError;
  const error = scorecardsQuery.error ?? entitiesQuery.error;

  return {
    rows,
    entityCount: entitiesQuery.data?.length ?? 0,
    isLoading,
    isError,
    error,
  };
}
