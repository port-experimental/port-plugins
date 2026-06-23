import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_RESPONSES, MOCK_SURVEYS } from "../dev/mockData";
import type {
  Answers,
  Entity,
  ScoreResult,
  SurveyResponseRecord,
} from "../types";
import { delay, portFetch, type PortCtx } from "./portFetch";

/** Relation on the response blueprint that points back to its survey. */
export const RESPONSE_TO_SURVEY_RELATION = "survey";

/** Active surveys, for the dashboard picker. */
export async function searchActiveSurveys(
  ctx: PortCtx,
  surveyBlueprint: string
): Promise<Entity[]> {
  if (DEV_MOCK) {
    await delay();
    return MOCK_SURVEYS;
  }
  const data = await portFetch<{ entities: Entity[] }>(
    ctx,
    `/v1/blueprints/${encodeURIComponent(surveyBlueprint)}/entities/search`,
    {
      method: "POST",
      body: JSON.stringify({
        query: {
          combinator: "and",
          rules: [{ property: "status", operator: "=", value: "active" }],
        },
      }),
    }
  );
  return data.entities ?? [];
}

/** All responses related to a given survey, for the results view. */
export async function searchResponses(
  ctx: PortCtx,
  args: { responseBlueprint: string; surveyBlueprint: string; surveyId: string }
): Promise<SurveyResponseRecord[]> {
  if (DEV_MOCK) {
    await delay();
    return MOCK_RESPONSES;
  }
  const data = await portFetch<{ entities: Entity[] }>(
    ctx,
    `/v1/blueprints/${encodeURIComponent(
      args.responseBlueprint
    )}/entities/search`,
    {
      method: "POST",
      body: JSON.stringify({
        query: {
          combinator: "and",
          rules: [
            {
              operator: "relatedTo",
              blueprint: args.surveyBlueprint,
              value: args.surveyId,
            },
          ],
        },
      }),
    }
  );
  return (data.entities ?? []).map(toResponseRecord);
}

/** Persist one submission as a surveyResponse entity. */
export async function createResponse(
  ctx: PortCtx,
  args: {
    responseBlueprint: string;
    surveyId: string;
    respondent: string;
    team?: string | null;
    answers: Answers;
    scores: ScoreResult;
  }
): Promise<Entity> {
  const identifier = `resp-${slug(args.surveyId)}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;

  const body = {
    identifier,
    title: `${args.respondent} - ${new Date().toISOString().slice(0, 10)}`,
    // team is Port's native "Owning Teams" field - a top-level array of team
    // identifiers, not a property. Writing a bare string leaves it unset.
    ...(args.team ? { team: [args.team] } : {}),
    properties: {
      respondent: args.respondent,
      submittedAt: new Date().toISOString(),
      answers: args.answers,
      dimensionScores: args.scores.dimensionScores,
      ...(args.scores.overallScore != null
        ? { overallScore: args.scores.overallScore }
        : {}),
    },
    relations: { [RESPONSE_TO_SURVEY_RELATION]: args.surveyId },
  };

  if (DEV_MOCK) {
    await delay();
    return { ...body, blueprint: args.responseBlueprint } as Entity;
  }

  const data = await portFetch<{ entity: Entity }>(
    ctx,
    `/v1/blueprints/${encodeURIComponent(
      args.responseBlueprint
    )}/entities?upsert=true`,
    { method: "POST", body: JSON.stringify(body) }
  );
  return data.entity;
}

function toResponseRecord(e: Entity): SurveyResponseRecord {
  const p = e.properties ?? {};
  return {
    identifier: e.identifier,
    respondent: typeof p.respondent === "string" ? p.respondent : undefined,
    submittedAt: typeof p.submittedAt === "string" ? p.submittedAt : undefined,
    dimensionScores:
      p.dimensionScores && typeof p.dimensionScores === "object"
        ? (p.dimensionScores as Record<string, number>)
        : undefined,
    overallScore:
      typeof p.overallScore === "number" ? p.overallScore : undefined,
  };
}

function slug(s: string): string {
  return s.replace(/[^A-Za-z0-9_.-]+/g, "-").slice(0, 40);
}
