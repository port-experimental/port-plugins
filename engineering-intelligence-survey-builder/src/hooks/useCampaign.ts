import { useQuery } from "@tanstack/react-query";
import { getCampaign, type Campaign } from "../api/campaigns";
import type { PortCtx } from "../api/portFetch";

/** Cache key for a survey's current share campaign (shared with the launch hook). */
export const campaignQueryKey = (surveyId: string) => ["campaign", surveyId];

/**
 * The survey's current share campaign for the "Shared with" panel. Resolves to
 * null when the survey was never shared - that's a normal state, not an error.
 */
export function useCampaign(ctx: PortCtx | null, surveyId: string | null) {
  return useQuery<Campaign | null>({
    queryKey: campaignQueryKey(surveyId ?? ""),
    enabled: !!ctx && !!surveyId,
    queryFn: () => getCampaign(ctx!, surveyId!),
    staleTime: 30 * 1000,
  });
}
