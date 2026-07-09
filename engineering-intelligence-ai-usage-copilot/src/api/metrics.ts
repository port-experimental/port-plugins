import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_METRIC_ENTITIES } from "../dev/mockData";
import type {
  ActivityTotals,
  AdoptionPhase,
  CliTotals,
  CopilotCommentType,
  DailyMetric,
  Entity,
  IdeTotals,
  PullRequestTotals,
} from "../types";
import { delay, portFetch, type PortCtx } from "./portFetch";

// ── Property readers ─────────────────────────────────────────────────────────

function num(obj: Record<string, unknown> | undefined, key: string): number {
  const v = obj?.[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

function str(
  obj: Record<string, unknown> | undefined,
  key: string
): string | undefined {
  const v = obj?.[key];
  return typeof v === "string" ? v : undefined;
}

function arr(
  obj: Record<string, unknown> | undefined,
  key: string
): Record<string, unknown>[] {
  const v = obj?.[key];
  return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
}

function obj(
  parent: Record<string, unknown> | undefined,
  key: string
): Record<string, unknown> | undefined {
  const v = parent?.[key];
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : undefined;
}

function toActivityTotals(r: Record<string, unknown>): ActivityTotals {
  return {
    userInitiatedInteractionCount: num(r, "user_initiated_interaction_count"),
    codeGenerationActivityCount: num(r, "code_generation_activity_count"),
    codeAcceptanceActivityCount: num(r, "code_acceptance_activity_count"),
    locSuggestedToAddSum: num(r, "loc_suggested_to_add_sum"),
    locSuggestedToDeleteSum: num(r, "loc_suggested_to_delete_sum"),
    locAddedSum: num(r, "loc_added_sum"),
    locDeletedSum: num(r, "loc_deleted_sum"),
  };
}

function toPhase(r: Record<string, unknown>): AdoptionPhase {
  return {
    phase: str(r, "phase") ?? "Unknown",
    phaseNumber: num(r, "phase_number"),
    totalEngagedUsers: num(r, "total_engaged_users"),
    avgUserInitiatedInteractions: num(r, "avg_user_initiated_interactions"),
    avgCodeGenerationActivities: num(r, "avg_code_generation_activities"),
    avgCodeAcceptanceActivities: num(r, "avg_code_acceptance_activities"),
    avgLocAdded: num(r, "avg_loc_added"),
    avgLocDeleted: num(r, "avg_loc_deleted"),
    avgPullRequestsReviewed: num(r, "avg_pull_requests_reviewed"),
    avgPullRequestsCreated: num(r, "avg_pull_requests_created"),
    avgPullRequestsMerged: num(r, "avg_pull_requests_merged"),
    avgPullRequestsMedianMinutesToMerge: num(
      r,
      "avg_pull_requests_median_minutes_to_merge"
    ),
  };
}

function toPullRequests(
  p: Record<string, unknown> | undefined
): PullRequestTotals | null {
  if (!p) return null;
  const commentTypes: CopilotCommentType[] = arr(
    p,
    "copilot_suggestions_by_comment_type"
  ).map((c) => ({
    commentType: str(c, "comment_type") ?? "unknown",
    totalCopilotSuggestions: num(c, "total_copilot_suggestions"),
    totalCopilotAppliedSuggestions: num(c, "total_copilot_applied_suggestions"),
  }));
  return {
    totalReviewed: num(p, "total_reviewed"),
    totalCreated: num(p, "total_created"),
    totalCreatedByCopilot: num(p, "total_created_by_copilot"),
    totalReviewedByCopilot: num(p, "total_reviewed_by_copilot"),
    totalMerged: num(p, "total_merged"),
    medianMinutesToMerge: num(p, "median_minutes_to_merge"),
    totalSuggestions: num(p, "total_suggestions"),
    totalAppliedSuggestions: num(p, "total_applied_suggestions"),
    totalCopilotSuggestions: num(p, "total_copilot_suggestions"),
    totalCopilotAppliedSuggestions: num(p, "total_copilot_applied_suggestions"),
    suggestionsByCommentType: commentTypes,
  };
}

function toCli(c: Record<string, unknown> | undefined): CliTotals | null {
  if (!c) return null;
  const tokens = obj(c, "token_usage");
  return {
    sessionCount: num(c, "session_count"),
    requestCount: num(c, "request_count"),
    promptCount: num(c, "prompt_count"),
    outputTokensSum: num(tokens, "output_tokens_sum"),
    promptTokensSum: num(tokens, "prompt_tokens_sum"),
    avgTokensPerRequest: num(tokens, "avg_tokens_per_request"),
  };
}

/** Normalize a raw ISO/date string to YYYY-MM-DD (empty when unparseable). */
function toIsoDay(raw: string | undefined): string {
  if (!raw) return "";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

/** Map a Port entity to a normalized DailyMetric. */
export function toDailyMetric(e: Entity, dayProp: string): DailyMetric {
  const p = e.properties ?? {};
  return {
    identifier: e.identifier,
    day: toIsoDay(str(p, dayProp) ?? e.updatedAt ?? e.createdAt),
    organizationId: str(p, "organization_id") ?? str(p, "git_hub_org"),
    enterpriseId: str(p, "enterprise_id"),
    orgName:
      str(p, "organization_name") ??
      str(p, "org_name") ??
      str(p, "organization_login") ??
      str(p, "git_hub_org") ??
      str(p, "organization_id"),

    dailyActiveUsers: num(p, "daily_active_users"),
    dailyActiveCliUsers: num(p, "daily_active_cli_users"),
    dailyActiveCopilotCloudAgentUsers: num(
      p,
      "daily_active_copilot_cloud_agent_users"
    ),
    weeklyActiveUsers: num(p, "weekly_active_users"),
    weeklyActiveCopilotCloudAgentUsers: num(
      p,
      "weekly_active_copilot_cloud_agent_users"
    ),
    monthlyActiveUsers: num(p, "monthly_active_users"),
    monthlyActiveChatUsers: num(p, "monthly_active_chat_users"),
    monthlyActiveAgentUsers: num(p, "monthly_active_agent_users"),
    monthlyActiveCopilotCloudAgentUsers: num(
      p,
      "monthly_active_copilot_cloud_agent_users"
    ),

    dailyActiveCodeReviewUsers: num(p, "daily_active_copilot_code_review_users"),
    weeklyActiveCodeReviewUsers: num(
      p,
      "weekly_active_copilot_code_review_users"
    ),
    monthlyActiveCodeReviewUsers: num(
      p,
      "monthly_active_copilot_code_review_users"
    ),
    dailyPassiveCodeReviewUsers: num(
      p,
      "daily_passive_copilot_code_review_users"
    ),
    weeklyPassiveCodeReviewUsers: num(
      p,
      "weekly_passive_copilot_code_review_users"
    ),
    monthlyPassiveCodeReviewUsers: num(
      p,
      "monthly_passive_copilot_code_review_users"
    ),

    userInitiatedInteractionCount: num(p, "user_initiated_interaction_count"),
    codeGenerationActivityCount: num(p, "code_generation_activity_count"),
    codeAcceptanceActivityCount: num(p, "code_acceptance_activity_count"),
    locSuggestedToAddSum: num(p, "loc_suggested_to_add_sum"),
    locSuggestedToDeleteSum: num(p, "loc_suggested_to_delete_sum"),
    locAddedSum: num(p, "loc_added_sum"),
    locDeletedSum: num(p, "loc_deleted_sum"),

    totalsByIde: arr(p, "totals_by_ide").map(
      (r): IdeTotals => ({ ide: str(r, "ide") ?? "unknown", ...toActivityTotals(r) })
    ),
    totalsByFeature: arr(p, "totals_by_feature").map((r) => ({
      feature: str(r, "feature") ?? "unknown",
      ...toActivityTotals(r),
    })),
    totalsByLanguageFeature: arr(p, "totals_by_language_feature").map((r) => ({
      language: str(r, "language") ?? "unknown",
      feature: str(r, "feature") ?? "unknown",
      ...toActivityTotals(r),
    })),
    totalsByLanguageModel: arr(p, "totals_by_language_model").map((r) => ({
      language: str(r, "language") ?? "unknown",
      model: str(r, "model") ?? "unknown",
      ...toActivityTotals(r),
    })),
    totalsByModelFeature: arr(p, "totals_by_model_feature").map((r) => ({
      model: str(r, "model") ?? "unknown",
      feature: str(r, "feature") ?? "unknown",
      ...toActivityTotals(r),
    })),
    adoptionPhases: arr(p, "totals_by_ai_adoption_phase").map(toPhase),

    pullRequests: toPullRequests(obj(p, "pull_requests")),
    cli: toCli(obj(p, "totals_by_cli")),
  };
}

// ── Fetch ────────────────────────────────────────────────────────────────────

type SearchRule = Record<string, unknown>;

type ChunkArgs = {
  blueprint: string;
  dayProp: string;
  /** Already-deduplicated page rules (dayProp rule excluded). */
  pageRules: SearchRule[];
};

/** Single paginated request for [from, to]. Returns entities + truncation flag. */
async function fetchChunk(
  ctx: PortCtx,
  { blueprint, dayProp, pageRules }: ChunkArgs,
  from: string,
  to: string
): Promise<{ entities: Entity[]; hasMore: boolean }> {
  const dateRule: SearchRule = {
    property: dayProp,
    operator: "between",
    value: { from: `${from}T00:00:00Z`, to: `${to}T23:59:59Z` },
  };
  const data = await portFetch<{ entities: Entity[]; hasMoreEntities?: boolean }>(
    ctx,
    `/v1/blueprints/${encodeURIComponent(blueprint)}/entities/search`,
    {
      method: "POST",
      body: JSON.stringify({
        query: { combinator: "and", rules: [dateRule, ...pageRules] },
        limit: 1000,
      }),
    }
  );
  return { entities: data.entities ?? [], hasMore: !!data.hasMoreEntities };
}

/**
 * Recursively fetch all entities in [from, to] by halving the date range
 * whenever a chunk is truncated at the 1,000-entity limit. Both halves are
 * fetched in parallel, so wall-clock time grows logarithmically with entity
 * count rather than linearly. Works for any volume without offset pagination.
 */
async function fetchAllEntities(
  ctx: PortCtx,
  args: ChunkArgs,
  from: string,
  to: string
): Promise<Entity[]> {
  const { entities, hasMore } = await fetchChunk(ctx, args, from, to);
  if (!hasMore) return entities;

  const f = new Date(`${from}T00:00:00Z`);
  const t = new Date(`${to}T00:00:00Z`);
  const diffDays = Math.round((t.getTime() - f.getTime()) / 86_400_000);
  if (diffDays < 1) {
    // Single day with >1,000 entities — return what we have (shouldn't happen
    // in practice: would require >1,000 GitHub orgs active on the same day).
    return entities;
  }

  const mid = new Date(f.getTime() + Math.floor(diffDays / 2) * 86_400_000);
  const midStr = mid.toISOString().slice(0, 10);
  const midNextStr = new Date(mid.getTime() + 86_400_000).toISOString().slice(0, 10);

  const [left, right] = await Promise.all([
    fetchAllEntities(ctx, args, from, midStr),
    fetchAllEntities(ctx, args, midNextStr, to),
  ]);
  return [...left, ...right];
}

/**
 * Fetch daily metric entities for a blueprint within [from, to] (inclusive),
 * merging any dashboard page-filter rules. Results are sorted ascending by day.
 */
export async function fetchMetrics(
  ctx: PortCtx,
  args: {
    blueprint: string;
    dayProp: string;
    from: string;
    to: string;
    pageRules: SearchRule[];
  }
): Promise<DailyMetric[]> {
  if (DEV_MOCK) {
    await delay();
    return MOCK_METRIC_ENTITIES.map((e) => toDailyMetric(e, args.dayProp))
      .filter((m) => m.day >= args.from && m.day <= args.to)
      .sort((a, b) => a.day.localeCompare(b.day));
  }

  // Deduplicate pageRules: drop any rule that targets the same property as
  // dayProp — the date rule already constrains it and an AND-combined duplicate
  // would silently produce 0 results.
  const safePageRules = args.pageRules.filter(
    (r) => (r as { property?: string }).property !== args.dayProp
  );

  const chunkArgs: ChunkArgs = {
    blueprint: args.blueprint,
    dayProp: args.dayProp,
    pageRules: safePageRules,
  };

  const entities = await fetchAllEntities(ctx, chunkArgs, args.from, args.to);

  return entities
    .map((e) => toDailyMetric(e, args.dayProp))
    // Belt-and-suspenders: keep only rows whose parsed day is within range,
    // in case the server-side date operator is lenient about time-of-day.
    .filter((m) => m.day && m.day >= args.from && m.day <= args.to)
    .sort((a, b) => a.day.localeCompare(b.day));
}
