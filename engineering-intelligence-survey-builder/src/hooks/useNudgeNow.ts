import { useMutation, useQueryClient } from "@tanstack/react-query";
import { nudgeNow, type CampaignRun } from "../api/campaigns";
import { campaignQueryKey } from "./useCampaign";
import { campaignsQueryKey } from "./useCampaigns";
import type { PortCtx } from "../api/portFetch";

type NudgeVars = {
  campaignId: string;
  message: string;
  surveyTitle: string;
  surveyDescription: string;
  questionCount: number;
  dashboardUrl: string;
};

/** Trigger the `survey-nudge-now` workflow to manually send a nudge for a campaign. */
export function useNudgeNow(ctx: PortCtx | null, surveyId: string) {
  const qc = useQueryClient();
  return useMutation<CampaignRun, Error, NudgeVars>({
    mutationFn: (vars) => {
      if (!ctx) throw new Error("Plugin is not ready yet.");
      return nudgeNow(ctx, vars.campaignId, surveyId, vars);
    },
    onSuccess: () => {
      // The workflow updates reminderCount/lastNudgedAt asynchronously - poll
      // a few times so the drawer reflects the new values once the run settles.
      for (const ms of [2000, 5000, 10000]) {
        setTimeout(() => {
          qc.invalidateQueries({ queryKey: campaignQueryKey(surveyId) });
          qc.invalidateQueries({ queryKey: campaignsQueryKey });
        }, ms);
      }
    },
  });
}
