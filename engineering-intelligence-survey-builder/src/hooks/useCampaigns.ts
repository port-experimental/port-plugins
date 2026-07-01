import { useQuery } from "@tanstack/react-query";
import { listCampaignsBySurvey, type Campaign } from "../api/campaigns";
import type { PortCtx } from "../api/portFetch";

/** Cache key for all campaigns (shared with the launch hook's invalidation). */
export const campaignsQueryKey = ["campaigns"];

/**
 * Every survey's current campaign, keyed by survey identifier, so the list can
 * show a per-card "shared with" chip from one request.
 */
export function useCampaigns(ctx: PortCtx | null) {
  return useQuery<Record<string, Campaign>>({
    queryKey: campaignsQueryKey,
    enabled: !!ctx,
    queryFn: () => listCampaignsBySurvey(ctx!),
    staleTime: 30 * 1000,
  });
}
