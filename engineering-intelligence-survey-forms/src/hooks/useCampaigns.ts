import { useQuery } from "@tanstack/react-query";
import { listCampaignsBySurvey, type Campaign } from "../api/campaigns";
import type { PortCtx } from "../api/portFetch";

/**
 * All share campaigns keyed by survey id, used to filter the picker to surveys
 * shared with the current user's team. Only needed on the dashboard surface.
 */
export function useCampaigns(ctx: PortCtx | null, enabled: boolean) {
  return useQuery<Record<string, Campaign>>({
    queryKey: ["campaigns", ctx?.token],
    queryFn: () => listCampaignsBySurvey(ctx!),
    enabled: enabled && !!ctx,
    staleTime: 5 * 60 * 1000,
  });
}
