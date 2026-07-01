import { useQuery } from "@tanstack/react-query";
import { searchActiveSurveys } from "../api/entities";
import type { PortCtx } from "../api/portFetch";

/** Active surveys for the dashboard picker (skipped on entity-page surface). */
export function useActiveSurveys(
  ctx: PortCtx | null,
  surveyBlueprint: string | undefined,
  enabled: boolean
) {
  return useQuery({
    queryKey: ["surveys", surveyBlueprint, ctx?.token],
    queryFn: () => searchActiveSurveys(ctx!, surveyBlueprint!),
    enabled: enabled && !!ctx && !!surveyBlueprint,
    staleTime: 5 * 60 * 1000,
  });
}
