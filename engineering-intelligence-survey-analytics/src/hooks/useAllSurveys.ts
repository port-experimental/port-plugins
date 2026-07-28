import { useQuery } from "@tanstack/react-query";
import { fetchAllSurveys } from "../api/entities";
import type { PortCtx } from "../api/portFetch";

export function useAllSurveys(ctx: PortCtx | null, surveyBlueprint: string | undefined) {
  return useQuery({
    queryKey: ["surveys", surveyBlueprint, ctx?.token],
    queryFn: () => fetchAllSurveys(ctx!, surveyBlueprint!),
    enabled: !!ctx && !!surveyBlueprint,
    staleTime: 2 * 60 * 1000,
  });
}
