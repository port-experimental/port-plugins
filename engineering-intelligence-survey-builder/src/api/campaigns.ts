import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_CAMPAIGNS } from "../dev/mockData";
import { delay, portFetch, type PortCtx } from "./portFetch";
import type { Entity, ShareConfig } from "../types";

/** Workflow that manually nudges non-respondents for an active campaign. */
export const NUDGE_WORKFLOW = "survey-nudge-now";

/** Workflow that sends a Slack DM to a single Port user (_user blueprint). */
const SEND_NUDGE_DM_WORKFLOW = "send-survey-nudge";

/** Blueprint that records a survey's distribution + reminder schedule. */
const CAMPAIGN_BLUEPRINT = "surveyCampaign";

/** A campaign's id is derived from its survey - one live campaign per survey. */
export const campaignIdFor = (surveyId: string) => `${surveyId}-campaign`;

/**
 * The current share campaign for a survey, read back for the "Shared with"
 * panel. `teams` are identifiers (the entity GET returns relations as ids); the
 * drawer resolves them to titles via `useTeams`.
 */
export type Campaign = {
  audience: "teams" | "all";
  status?: string;
  /** ISO date-time, or null for open-ended. */
  deadline: string | null;
  /** When the campaign was first created (i.e. when the survey was shared). */
  createdAt?: string;
  reminderCadence: string;
  channel: string;
  reminderCount: number;
  lastNudgedAt: string | null;
  teams: string[];
};

/** Normalize a many-relation that the API returns as id, id[] or null. */
function relIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return typeof value === "string" ? [value] : [];
}

function toCampaign(e: Entity): Campaign {
  const p = e.properties ?? {};
  const rel = (e.relations ?? {}) as Record<string, unknown>;
  return {
    audience: p.audience === "all" ? "all" : "teams",
    status: typeof p.status === "string" ? p.status : undefined,
    deadline: typeof p.deadline === "string" ? p.deadline : null,
    reminderCadence: typeof p.reminderCadence === "string" ? p.reminderCadence : "off",
    channel: typeof p.channel === "string" ? p.channel : "email",
    reminderCount: typeof p.reminderCount === "number" ? p.reminderCount : 0,
    lastNudgedAt: typeof p.lastNudgedAt === "string" ? p.lastNudgedAt : null,
    teams: relIds(rel.teams),
    createdAt: typeof e.createdAt === "string" ? e.createdAt : undefined,
  };
}

/**
 * Read the survey's current campaign, or null if it was never shared. A 404
 * (no campaign yet) is the normal "Not shared yet" case, not an error.
 */
export async function getCampaign(
  ctx: PortCtx,
  surveyId: string
): Promise<Campaign | null> {
  if (DEV_MOCK) {
    await delay();
    return MOCK_CAMPAIGNS[surveyId] ?? null;
  }

  const id = campaignIdFor(surveyId);
  try {
    const data = await portFetch<{ entity: Entity }>(
      ctx,
      `/v1/blueprints/${CAMPAIGN_BLUEPRINT}/entities/${encodeURIComponent(id)}`,
      { method: "GET" }
    );
    return data.entity ? toCampaign(data.entity) : null;
  } catch (err) {
    if (/Port API 404\b/.test((err as Error).message)) return null;
    throw err;
  }
}

/**
 * All campaigns keyed by their survey identifier, for the list's per-card
 * "shared with" chip - one query instead of one per card. A missing key means
 * that survey was never shared.
 */
export async function listCampaignsBySurvey(
  ctx: PortCtx
): Promise<Record<string, Campaign>> {
  if (DEV_MOCK) {
    await delay();
    return { ...MOCK_CAMPAIGNS };
  }

  const data = await portFetch<{ entities: Entity[] }>(
    ctx,
    `/v1/blueprints/${CAMPAIGN_BLUEPRINT}/entities`,
    { method: "GET" }
  );
  const bySurvey: Record<string, Campaign> = {};
  for (const e of data.entities ?? []) {
    const rel = (e.relations ?? {}) as Record<string, unknown>;
    // Prefer the survey relation; fall back to the `<survey>-campaign` id shape.
    const surveyId = relIds(rel.survey)[0] ?? e.identifier.replace(/-campaign$/, "");
    if (surveyId) bySurvey[surveyId] = toCampaign(e);
  }
  return bySurvey;
}

export type LaunchCampaignInput = {
  surveyId: string;
  config: ShareConfig;
};

export type CampaignRun = { id: string };

/** Create or update the surveyCampaign entity directly (no workflow). */
export async function launchCampaign(
  ctx: PortCtx,
  { surveyId, config }: LaunchCampaignInput
): Promise<CampaignRun> {
  if (DEV_MOCK) {
    await delay(400);
    MOCK_CAMPAIGNS[surveyId] = {
      audience: config.audience,
      status: "active",
      deadline: config.deadline ? `${config.deadline}T23:59:59.000Z` : null,
      reminderCadence: config.reminderCadence,
      channel: "email",
      reminderCount: 0,
      lastNudgedAt: null,
      teams: config.audience === "teams" ? config.teams : [],
    };
    return { id: `run_${surveyId}_mock` };
  }

  const id = campaignIdFor(surveyId);
  const properties: Record<string, unknown> = {
    audience: config.audience,
    status: "active",
    reminderCadence: config.reminderCadence ?? "off",
  };
  if (config.deadline) properties.deadline = `${config.deadline}T23:59:59.000Z`;

  const relations: Record<string, unknown> = {
    survey: surveyId,
    teams: config.audience === "teams" ? config.teams : [],
  };

  await portFetch<unknown>(
    ctx,
    `/v1/blueprints/${CAMPAIGN_BLUEPRINT}/entities?upsert=true&merge=true`,
    {
      method: "POST",
      body: JSON.stringify({
        identifier: id,
        title: `${surveyId} Campaign`,
        properties,
        relations,
      }),
    }
  );
  return { id };
}

type NudgePayload = {
  campaignId: string;
  message: string;
  surveyTitle: string;
  surveyDescription: string;
  questionCount: number;
  dashboardUrl: string;
};

/** Trigger the `survey-nudge-now` workflow to manually send a nudge for an active campaign. */
export async function nudgeNow(
  ctx: PortCtx,
  campaignId: string,
  surveyId: string,
  payload: NudgePayload
): Promise<CampaignRun> {
  if (DEV_MOCK) {
    await delay(300);
    const campaign = MOCK_CAMPAIGNS[surveyId];
    if (campaign) {
      campaign.lastNudgedAt = new Date().toISOString();
      campaign.reminderCount = (campaign.reminderCount ?? 0) + 1;
    }
    return { id: `nudge_${campaignId}_mock` };
  }

  const data = await portFetch<{ workflowRun?: { identifier?: string } }>(
    ctx,
    `/v1/workflows/${encodeURIComponent(NUDGE_WORKFLOW)}/runs`,
    {
      method: "POST",
      body: JSON.stringify({
        inputs: {
          surveyId,
          message: payload.message,
          surveyTitle: payload.surveyTitle,
          surveyDescription: payload.surveyDescription,
          questionCount: payload.questionCount,
          dashboardUrl: payload.dashboardUrl,
        },
        entity: { blueprint: "surveyCampaign", identifier: campaignId },
      }),
    }
  );
  return { id: data.workflowRun?.identifier ?? "unknown" };
}

/**
 * Stop sharing a survey by deleting its campaign entity. This returns the
 * survey to the "Not shared" state - the runner hides it again and re-sharing
 * later just recreates the campaign. A 404 means it was already unshared.
 */
export async function unshareCampaign(
  ctx: PortCtx,
  surveyId: string
): Promise<void> {
  if (DEV_MOCK) {
    await delay(300);
    delete MOCK_CAMPAIGNS[surveyId];
    return;
  }

  const id = campaignIdFor(surveyId);
  try {
    await portFetch<unknown>(
      ctx,
      `/v1/blueprints/${CAMPAIGN_BLUEPRINT}/entities/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  } catch (err) {
    if (/Port API 404\b/.test((err as Error).message)) return;
    throw err;
  }
}
