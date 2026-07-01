import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteSurvey, saveSurvey } from "../api/entities";
import type { PortCtx } from "../api/portFetch";
import type { Entity, SurveyDraft } from "../types";

/** Upsert the working draft as a survey entity. */
export function useSaveSurvey(ctx: PortCtx | null, surveyBlueprint?: string) {
  const qc = useQueryClient();
  return useMutation<Entity, Error, SurveyDraft>({
    mutationFn: (draft) => {
      if (!ctx || !surveyBlueprint) throw new Error("Plugin is not ready to save yet.");
      return saveSurvey(ctx, surveyBlueprint, draft);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["surveys"] }),
  });
}

export type DeleteSurveyVars = { identifier: string; cascade?: boolean };

/** Delete a survey entity by identifier, optionally cascading to its responses. */
export function useDeleteSurvey(ctx: PortCtx | null, surveyBlueprint?: string) {
  const qc = useQueryClient();
  return useMutation<void, Error, DeleteSurveyVars>({
    mutationFn: ({ identifier, cascade }) => {
      if (!ctx || !surveyBlueprint) throw new Error("Plugin is not ready to delete yet.");
      return deleteSurvey(ctx, surveyBlueprint, identifier, cascade);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["surveys"] }),
  });
}
