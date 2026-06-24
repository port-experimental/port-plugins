import { useQuery } from "@tanstack/react-query";
import { searchResponses } from "../api/entities";
import type { PortCtx } from "../api/portFetch";

type Args = {
  responseBlueprint: string;
  surveyBlueprint: string;
  surveyId: string;
};

/** Responses related to the active survey, for the aggregate results view. */
export function useSurveyResponses(
  ctx: PortCtx | null,
  args: Args | null,
  enabled: boolean
) {
  return useQuery({
    queryKey: [
      "responses",
      args?.responseBlueprint,
      args?.surveyId,
      ctx?.token,
    ],
    queryFn: () => searchResponses(ctx!, args!),
    enabled: enabled && !!ctx && !!args,
    staleTime: 60 * 1000,
  });
}
