import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchBlueprintEntities } from "../api/entities";
import { fetchBlueprintScorecards } from "../api/scorecards";
import type {
  EntityGapSummary,
  Page,
  PluginConfig,
  ScorecardComplianceRow,
} from "../types";
import {
  buildEntityGapsForScorecard,
  computeScorecardCompliance,
} from "../utils/entityScorecardStats";

export function useScorecardGoals(
  config: PluginConfig | null,
  portToken: string | null,
  portApiBaseUrl: string | null,
  page?: Page
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
    queryKey: [
      "entities",
      blueprintId,
      portApiBaseUrl,
      scorecardsQuery.data?.map((s) => s.identifier).join(","),
      page?.pageFilters,
    ],
    queryFn: () =>
      searchBlueprintEntities(
        portApiBaseUrl!,
        portToken!,
        blueprintId!,
        scorecardsQuery.data!,
        page
      ),
    enabled: enabled && scorecardsQuery.isSuccess,
    staleTime: 5 * 60 * 1000,
  });

  const scorecards = scorecardsQuery.data ?? [];
  const entities = entitiesQuery.data ?? [];

  const rows: ScorecardComplianceRow[] =
    scorecards.length > 0
      ? computeScorecardCompliance(scorecards, entities)
      : [];

  const gapsByScorecard = useMemo(() => {
    const map: Record<string, EntityGapSummary[]> = {};
    for (const scorecard of scorecards) {
      map[scorecard.identifier] = buildEntityGapsForScorecard(
        scorecard,
        entities
      );
    }
    return map;
  }, [scorecards, entities]);

  const isLoading = scorecardsQuery.isLoading || entitiesQuery.isLoading;
  const isError = scorecardsQuery.isError || entitiesQuery.isError;
  const error = scorecardsQuery.error ?? entitiesQuery.error;

  return {
    rows,
    gapsByScorecard,
    entityCount: entities.length,
    isLoading,
    isError,
    error,
  };
}
