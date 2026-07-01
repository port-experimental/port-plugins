import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createResponse } from "../api/entities";
import type { PortCtx } from "../api/portFetch";
import { computeScores } from "../scoring";
import type { Answers, SurveyDefinition } from "../types";

export type SubmitVars = {
  surveyId: string;
  definition: SurveyDefinition;
  answers: Answers;
  respondent: string;
  team?: string | null;
};

/** Score the answers and create the surveyResponse entity. */
export function useSubmitResponse(
  ctx: PortCtx | null,
  responseBlueprint: string | undefined
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: SubmitVars) => {
      if (!ctx || !responseBlueprint) {
        throw new Error("Plugin is not ready to submit yet.");
      }
      const scores = computeScores(vars.definition, vars.answers);
      return createResponse(ctx, {
        responseBlueprint,
        surveyId: vars.surveyId,
        respondent: vars.respondent,
        team: vars.team,
        answers: vars.answers,
        scores,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["responses"] });
    },
  });
}
