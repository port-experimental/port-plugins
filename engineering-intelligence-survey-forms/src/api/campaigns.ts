import { DEV_MOCK } from "../hooks/usePostMessageData";
import type { Entity } from "../types";
import { delay, portFetch, type PortCtx } from "./portFetch";

/** Blueprint that records a survey's distribution audience. */
const CAMPAIGN_BLUEPRINT = "surveyCampaign";

/**
 * Minimal view of a share campaign - just what the runner needs to decide
 * visibility: the audience and (when scoped) which teams it was shared with.
 */
export type Campaign = {
  audience: "teams" | "all";
  teams: string[];
  deadline: string | null;
};

/** Normalize a many-relation the API returns as id, id[] or null. */
function relIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return typeof value === "string" ? [value] : [];
}

/**
 * Every campaign keyed by its survey identifier, so the picker can decide which
 * active surveys the current user is allowed to see. One request for the page.
 */
export async function listCampaignsBySurvey(
  ctx: PortCtx
): Promise<Record<string, Campaign>> {
  if (DEV_MOCK) {
    await delay();
    return {};
  }

  const data = await portFetch<{ entities: Entity[] }>(
    ctx,
    `/v1/blueprints/${CAMPAIGN_BLUEPRINT}/entities`,
    { method: "GET" }
  );
  const bySurvey: Record<string, Campaign> = {};
  for (const e of data.entities ?? []) {
    const rel = (e.relations ?? {}) as Record<string, unknown>;
    const surveyId = relIds(rel.survey)[0] ?? e.identifier.replace(/-campaign$/, "");
    const props = (e.properties as Record<string, unknown> | undefined) ?? {};
    const audience = props.audience === "all" ? "all" : "teams";
    const rawDeadline = typeof props.deadline === "string" ? props.deadline : null;
    const deadline = rawDeadline ? rawDeadline.slice(0, 10) : null;
    if (surveyId) bySurvey[surveyId] = { audience, teams: relIds(rel.teams), deadline };
  }
  return bySurvey;
}
