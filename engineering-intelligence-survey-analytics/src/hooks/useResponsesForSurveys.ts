import { useQueries } from "@tanstack/react-query";
import { fetchResponsesForSurvey } from "../api/entities";
import type { PortCtx } from "../api/portFetch";
import type { AnalyticsResponse } from "../types";

type Args = {
  responseBlueprint: string;
  surveyBlueprint: string;
};

export type ResponsesBySurvey = {
  byId: Record<string, AnalyticsResponse[]>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  refetchAll: () => void;
};

/**
 * Fetch responses for every survey in parallel and key them by survey id.
 * Loading all surveys' responses powers the over-time trend; per-survey views
 * just index into the map.
 */
export function useResponsesForSurveys(
  ctx: PortCtx | null,
  args: Args | null,
  surveyIds: string[]
): ResponsesBySurvey {
  const queries = useQueries({
    queries: surveyIds.map((surveyId) => ({
      queryKey: ["responses", args?.responseBlueprint, surveyId, ctx?.token],
      queryFn: () =>
        fetchResponsesForSurvey(ctx!, {
          responseBlueprint: args!.responseBlueprint,
          surveyBlueprint: args!.surveyBlueprint,
          surveyId,
        }),
      enabled: !!ctx && !!args && !!surveyId,
      staleTime: 60 * 1000,
    })),
  });

  const byId: Record<string, AnalyticsResponse[]> = {};
  surveyIds.forEach((id, i) => {
    byId[id] = queries[i]?.data ?? [];
  });

  return {
    byId,
    isPending: queries.some((q) => q.isPending || q.isLoading),
    isError: queries.some((q) => q.isError),
    error: (queries.find((q) => q.isError)?.error as Error) ?? null,
    refetchAll: () => queries.forEach((q) => q.refetch()),
  };
}
