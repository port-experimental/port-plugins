// ── Port host-bridge types ──────────────────────────────────────────────────

export type Page = {
  identifier?: string;
  pageFilters?: unknown;
};

export type User = {
  firstName?: string;
  lastName?: string;
  email?: string;
  picture?: string;
};

export type BlueprintParam = { identifier: string; title?: string } & Record<
  string,
  unknown
>;

export type Entity = {
  identifier: string;
  title?: string;
  icon?: string;
  team?: string[] | string;
  blueprint?: string;
  createdAt?: string;
  updatedAt?: string;
  properties?: Record<string, unknown>;
  relations?: Record<string, unknown>;
  relationsObjects?: Record<string, unknown>;
};

export type ParamValue = {
  type?: string;
  value?: unknown;
};

export type Params = Record<string, ParamValue>;

export type PluginConfig = {
  /** Blueprint holding the daily organization-usage-metrics entities. */
  metricsBlueprint: BlueprintParam;
  /** Licensed Copilot seats — enables the adoption-rate KPI when provided. */
  licensedSeats: number | null;
  /** Property key holding the ISO date of each daily record (default: `day`). */
  dayProp: string;
  /** Blueprint holding AI-generated Copilot insight entities (optional). */
  copilotInsightsBlueprint: BlueprintParam | null;
  /** Port action identifier to trigger insight generation (optional). */
  copilotInsightsAction: string | null;
};

// ── Domain model: organization-usage-metrics ────────────────────────────────
// One entity per (organization, day). Field names mirror GitHub Copilot's
// organization usage-metrics payload; the mapper (api/metrics.ts) reads these
// snake_case keys from each entity's `properties`.

/** Shared shape for the per-IDE / per-feature breakdown arrays. */
export type ActivityTotals = {
  userInitiatedInteractionCount: number;
  codeGenerationActivityCount: number;
  codeAcceptanceActivityCount: number;
  locSuggestedToAddSum: number;
  locSuggestedToDeleteSum: number;
  locAddedSum: number;
  locDeletedSum: number;
};

export type IdeTotals = ActivityTotals & { ide: string };
export type FeatureTotals = ActivityTotals & { feature: string };
export type LanguageFeatureTotals = ActivityTotals & {
  language: string;
  feature: string;
};
export type LanguageModelTotals = ActivityTotals & {
  language: string;
  model: string;
};
export type ModelFeatureTotals = ActivityTotals & {
  model: string;
  feature: string;
};

/** One GitHub-defined AI adoption cohort for a given day. */
export type AdoptionPhase = {
  phase: string;
  phaseNumber: number;
  totalEngagedUsers: number;
  avgUserInitiatedInteractions: number;
  avgCodeGenerationActivities: number;
  avgCodeAcceptanceActivities: number;
  avgLocAdded: number;
  avgLocDeleted: number;
  avgPullRequestsReviewed: number;
  avgPullRequestsCreated: number;
  avgPullRequestsMerged: number;
  avgPullRequestsMedianMinutesToMerge: number;
};

export type CopilotCommentType = {
  commentType: string;
  totalCopilotSuggestions: number;
  totalCopilotAppliedSuggestions: number;
};

export type PullRequestTotals = {
  totalReviewed: number;
  totalCreated: number;
  totalCreatedByCopilot: number;
  totalReviewedByCopilot: number;
  totalMerged: number;
  medianMinutesToMerge: number;
  totalSuggestions: number;
  totalAppliedSuggestions: number;
  totalCopilotSuggestions: number;
  totalCopilotAppliedSuggestions: number;
  suggestionsByCommentType: CopilotCommentType[];
};

export type CliTotals = {
  sessionCount: number;
  requestCount: number;
  promptCount: number;
  outputTokensSum: number;
  promptTokensSum: number;
  avgTokensPerRequest: number;
};

/** A single day's org-level usage record, normalized from a Port entity. */
export type DailyMetric = {
  identifier: string;
  /** ISO date (YYYY-MM-DD) parsed from the `day` property. */
  day: string;
  organizationId?: string;
  enterpriseId?: string;
  /** Human-readable org name — entity title, falling back to organizationId. */
  orgName?: string;

  // Active users
  dailyActiveUsers: number;
  dailyActiveCliUsers: number;
  dailyActiveCopilotCloudAgentUsers: number;
  weeklyActiveUsers: number;
  weeklyActiveCopilotCloudAgentUsers: number;
  monthlyActiveUsers: number;
  monthlyActiveChatUsers: number;
  monthlyActiveAgentUsers: number;
  monthlyActiveCopilotCloudAgentUsers: number;

  // Code review users (active = author, passive = reviewed)
  dailyActiveCodeReviewUsers: number;
  weeklyActiveCodeReviewUsers: number;
  monthlyActiveCodeReviewUsers: number;
  dailyPassiveCodeReviewUsers: number;
  weeklyPassiveCodeReviewUsers: number;
  monthlyPassiveCodeReviewUsers: number;

  // Activity + LOC
  userInitiatedInteractionCount: number;
  codeGenerationActivityCount: number;
  codeAcceptanceActivityCount: number;
  locSuggestedToAddSum: number;
  locSuggestedToDeleteSum: number;
  locAddedSum: number;
  locDeletedSum: number;

  // Breakdowns
  totalsByIde: IdeTotals[];
  totalsByFeature: FeatureTotals[];
  totalsByLanguageFeature: LanguageFeatureTotals[];
  totalsByLanguageModel: LanguageModelTotals[];
  totalsByModelFeature: ModelFeatureTotals[];
  adoptionPhases: AdoptionPhase[];

  // Nested rollups
  pullRequests: PullRequestTotals | null;
  cli: CliTotals | null;
};

// ── Filter + view state ──────────────────────────────────────────────────────

/** Dimension the breakdown panel groups by. */
export type BreakdownDimension = "ide" | "feature" | "language" | "model";

/** Metric the breakdown panel ranks each dimension by. */
export type BreakdownMetric =
  | "codeGenerationActivityCount"
  | "codeAcceptanceActivityCount"
  | "locAddedSum";

/** Rollup bucket for the time-series charts. */
export type Granularity = "day" | "week" | "month";

/**
 * How point-in-time (stock) metrics — active users, stickiness — are summarized
 * across a bucket or the whole range. Flow metrics (suggestions, LOC, PRs) are
 * always summed and ignore this. `latest` preserves the original behavior.
 */
export type AggregationMode = "latest" | "avg" | "median" | "max";

export type DateRange = { from: string; to: string };

export type TabKey = "adoption" | "usage" | "insights";

/** Comparison baseline for the dashboard-wide "Compare" control. */
export type CompareMode = "off" | "previous";

/** One org/enterprise in the org selector. */
export type OrgOption = { id: string; name: string };

// ── Copilot Insights ─────────────────────────────────────────────────────────

/** One row in the findings table returned by the AI. */
export type InsightFinding = {
  insight: string;
  category?: string;
  impact?: string;
  evidence?: string;
  severity?: "High" | "Medium" | "Low";
  confidence?: "High" | "Medium" | "Low";
  recommendedAction?: string;
};

/** A single AI-generated insight entity stored in Port. */
export type CopilotInsight = {
  identifier: string;
  title?: string;
  /** Human-readable period label, e.g. "2026-06-01 to 2026-07-05". */
  period?: string;
  /** ISO timestamp of when this insight was generated. */
  generatedAt?: string;
  /** Port workflow run ID, e.g. "wfr_xxx". */
  runId?: string;
  /** GitHub org this insight was generated for. Empty string means all orgs. */
  org?: string;
  /** Executive summary paragraph. */
  summary?: string;
  findings?: InsightFinding[];
  riskSignals?: string[];
  /** E.g. "based on 30 days of data". */
  confidenceNote?: string;
};

export type ActionRunStatus =
  | "IN_PROGRESS"
  | "SUCCESS"
  | "FAILURE"
  | "CANCELLED"
  | "WAITING_FOR_APPROVAL";

export type ActionRun = {
  id: string;
  status: ActionRunStatus;
  endedAt?: string;
};

// ── Aggregation output types ─────────────────────────────────────────────────

/** One point on a time-series chart (already rolled up to the granularity). */
export type SeriesPoint = { label: string; date: string } & Record<
  string,
  number | string
>;

/** A named series plotted on a chart. */
export type Series = { key: string; name: string; color: string };

/** One row in the ranked breakdown panel. */
export type BreakdownRow = {
  label: string;
  codeGenerationActivityCount: number;
  codeAcceptanceActivityCount: number;
  locAddedSum: number;
  /** acceptance ÷ generation, 0..1 (null when no generation). */
  acceptanceRate: number | null;
};

/**
 * Headline KPI values for a range. Stock metrics (active users, adoption rate)
 * use the latest in-range snapshot; flow metrics (acceptance, LOC, suggestions,
 * PRs) are summed across the range.
 */
export type MetricTotals = {
  activeUsersMonthly: number;
  activeUsersDaily: number;
  activeUsersWeekly: number;
  /** MAU ÷ licensed seats, 0..1 (null when seats not configured). */
  adoptionRate: number | null;
  /** accepted ÷ generated, 0..1 (null when no generation). */
  acceptanceRate: number | null;
  linesAccepted: number;
  suggestions: number;
  copilotPrs: number;
};
