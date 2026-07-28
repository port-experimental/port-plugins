import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_SURVEYS, MOCK_RESPONSES_BY_SURVEY } from "../dev/mockData";
import type { AnalyticsResponse, Entity, SurveyMeta } from "../types";
import { delay, portFetch, type PortCtx } from "./portFetch";
import { resolveDefinition } from "../surveys/registry";

export const RESPONSE_TO_SURVEY_RELATION = "survey";

/** All surveys for a given blueprint (all statuses - needed for historical comparison). */
export async function fetchAllSurveys(
  ctx: PortCtx,
  surveyBlueprint: string
): Promise<SurveyMeta[]> {
  if (DEV_MOCK) {
    await delay();
    return MOCK_SURVEYS;
  }
  const data = await portFetch<{ entities: Entity[] }>(
    ctx,
    `/v1/blueprints/${encodeURIComponent(surveyBlueprint)}/entities/search`,
    {
      method: "POST",
      body: JSON.stringify({ query: { combinator: "and", rules: [] } }),
    }
  );
  return (data.entities ?? []).map(toSurveyMeta);
}

const CAMPAIGN_BLUEPRINT = "surveyCampaign";

/** Teams invited via the survey's campaign (empty when not shared or "all teams"). */
export async function fetchCampaignTeams(
  ctx: PortCtx,
  surveyId: string
): Promise<string[]> {
  if (DEV_MOCK) return [];
  try {
    const data = await portFetch<{ entity: Entity }>(
      ctx,
      `/v1/blueprints/${encodeURIComponent(CAMPAIGN_BLUEPRINT)}/entities/${encodeURIComponent(
        `${surveyId}-campaign`
      )}`,
      { method: "GET" }
    );
    const e = data.entity;
    if (!e) return [];
    const audience = e.properties?.audience;
    if (audience === "all") return [];
    const rel = (e.relations ?? {}) as Record<string, unknown>;
    const teams = rel.teams;
    if (Array.isArray(teams)) return teams.filter((t): t is string => typeof t === "string");
    return [];
  } catch {
    return [];
  }
}

/** All responses for a specific survey entity. */
export async function fetchResponsesForSurvey(
  ctx: PortCtx,
  args: {
    responseBlueprint: string;
    surveyBlueprint: string;
    surveyId: string;
  }
): Promise<AnalyticsResponse[]> {
  if (DEV_MOCK) {
    await delay();
    return (MOCK_RESPONSES_BY_SURVEY[args.surveyId] ?? []).map((r) => ({
      ...r,
      surveyId: args.surveyId,
    }));
  }
  const data = await portFetch<{ entities: Entity[] }>(
    ctx,
    `/v1/blueprints/${encodeURIComponent(args.responseBlueprint)}/entities/search`,
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
  return (data.entities ?? []).map((e) =>
    toAnalyticsResponse(e, args.surveyId)
  );
}

function toSurveyMeta(e: Entity): SurveyMeta {
  const p = e.properties ?? {};
  const definition = resolveDefinition({
    inline: p.definition,
    framework: typeof p.framework === "string" ? p.framework : null,
  });
  return {
    identifier: e.identifier,
    title: e.title || definition.title,
    framework: typeof p.framework === "string" ? p.framework : undefined,
    status: typeof p.status === "string" ? p.status : undefined,
    createdAt: e.createdAt,
    publishedAt: typeof p.publishedAt === "string" ? p.publishedAt : undefined,
    targetRespondents: normalizeTargets(p.targetRespondents),
    definition,
  };
}

/** Coerce the loosely-typed targetRespondents object into Record<string, number>. */
function normalizeTargets(raw: unknown): Record<string, number> | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "number" && Number.isFinite(v)) out[k] = v;
  }
  return Object.keys(out).length ? out : undefined;
}

/** Ownership "team" arrives as an array; take the first identifier. */
function firstTeam(team: Entity["team"]): string | undefined {
  if (Array.isArray(team)) return typeof team[0] === "string" ? team[0] : undefined;
  return typeof team === "string" && team ? team : undefined;
}

function toAnalyticsResponse(e: Entity, surveyId: string): AnalyticsResponse {
  const p = e.properties ?? {};
  return {
    identifier: e.identifier,
    respondent: typeof p.respondent === "string" ? p.respondent : undefined,
    submittedAt: typeof p.submittedAt === "string" ? p.submittedAt : undefined,
    team: firstTeam(e.team),
    surveyId,
    dimensionScores:
      p.dimensionScores && typeof p.dimensionScores === "object"
        ? (p.dimensionScores as Record<string, number>)
        : undefined,
    overallScore:
      typeof p.overallScore === "number" ? p.overallScore : undefined,
    answers:
      p.answers && typeof p.answers === "object"
        ? (p.answers as AnalyticsResponse["answers"])
        : undefined,
  };
}
