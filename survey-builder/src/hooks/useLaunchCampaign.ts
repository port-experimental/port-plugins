import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  launchCampaign,
  type CampaignRun,
  type LaunchCampaignInput,
} from "../api/campaigns";
import { campaignQueryKey } from "./useCampaign";
import { campaignsQueryKey } from "./useCampaigns";
import type { PortCtx } from "../api/portFetch";

/** Trigger the `share-survey` workflow to launch a share campaign. */
export function useLaunchCampaign(ctx: PortCtx | null) {
  const qc = useQueryClient();
  return useMutation<CampaignRun, Error, LaunchCampaignInput>({
    mutationFn: (input) => {
      if (!ctx) throw new Error("Plugin is not ready to share yet.");
      return launchCampaign(ctx, input);
    },
    // Poll a few times after triggering - the workflow takes a moment to create
    // the campaign entity, so a single immediate invalidate misses it.
    onSuccess: (_run, { surveyId }) => {
      for (const ms of [1500, 4000, 8000]) {
        setTimeout(() => {
          qc.invalidateQueries({ queryKey: campaignQueryKey(surveyId) });
          qc.invalidateQueries({ queryKey: campaignsQueryKey });
        }, ms);
      }
    },
  });
}
