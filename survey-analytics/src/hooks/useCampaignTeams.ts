import { useQuery } from "@tanstack/react-query";
import { fetchCampaignTeams } from "../api/entities";
import type { PortCtx } from "../api/portFetch";

export function useCampaignTeams(ctx: PortCtx | null, surveyId: string | null) {
  return useQuery({
    queryKey: ["campaignTeams", surveyId],
    queryFn: () => fetchCampaignTeams(ctx!, surveyId!),
    enabled: !!ctx && !!surveyId,
    staleTime: 60_000,
  });
}
