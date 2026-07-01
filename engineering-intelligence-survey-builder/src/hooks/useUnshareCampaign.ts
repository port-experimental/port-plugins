import { useMutation, useQueryClient } from "@tanstack/react-query";
import { unshareCampaign } from "../api/campaigns";
import { campaignQueryKey } from "./useCampaign";
import { campaignsQueryKey } from "./useCampaigns";
import type { PortCtx } from "../api/portFetch";

/** Stop sharing a survey by deleting its campaign entity. */
export function useUnshareCampaign(ctx: PortCtx | null) {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (surveyId) => {
      if (!ctx) throw new Error("Plugin is not ready yet.");
      return unshareCampaign(ctx, surveyId);
    },
    // Refresh the drawer's "Shared with" panel and the list's per-card chip.
    onSuccess: (_void, surveyId) => {
      qc.invalidateQueries({ queryKey: campaignQueryKey(surveyId) });
      qc.invalidateQueries({ queryKey: campaignsQueryKey });
    },
  });
}
