import type { AggregationMode, BreakdownDimension, BreakdownMetric, Granularity, Series } from "../types";

/** Categorical palette used across charts (kept distinct in light & dark). */
export const PALETTE = {
  violet: "#8b5cf6",
  green: "#10b981",
  amber: "#f59e0b",
  blue: "#3b82f6",
  pink: "#ec4899",
  cyan: "#06b6d4",
  slate: "#64748b",
} as const;

export const ACTIVE_USER_SERIES: Series[] = [
  { key: "mau", name: "Monthly active", color: PALETTE.violet },
  { key: "wau", name: "Weekly active", color: PALETTE.blue },
  { key: "dau", name: "Daily active", color: PALETTE.green },
];

export const SURFACE_SERIES: Series[] = [
  { key: "cli", name: "CLI", color: PALETTE.amber },
  { key: "cloudAgent", name: "Cloud agent", color: PALETTE.cyan },
  { key: "codeReview", name: "Code review", color: PALETTE.pink },
];

export const ACCEPTANCE_RATE_SERIES: Series[] = [
  { key: "activity", name: "Suggestion acceptance", color: PALETTE.green },
  { key: "loc", name: "Lines accepted", color: PALETTE.blue },
];

export const SUGGESTION_SERIES: Series[] = [
  { key: "generated", name: "Suggested", color: PALETTE.slate },
  { key: "accepted", name: "Accepted", color: PALETTE.green },
];

export const LOC_SERIES: Series[] = [
  { key: "suggested", name: "Suggested", color: PALETTE.slate },
  { key: "added", name: "Accepted", color: PALETTE.violet },
];

export const PR_ACTIVITY_SERIES: Series[] = [
  { key: "created", name: "Created by Copilot", color: PALETTE.violet },
  { key: "reviewed", name: "Reviewed by Copilot", color: PALETTE.cyan },
];

export const PR_CYCLE_TIME_SERIES: Series[] = [
  { key: "minutes", name: "Median time to merge", color: PALETTE.amber },
];

export const GRANULARITY_OPTS: { value: Granularity; label: string }[] = [
  { value: "day",   label: "Daily" },
  { value: "week",  label: "Weekly" },
  { value: "month", label: "Monthly" },
];

export const AGGREGATION_OPTS: { value: AggregationMode; label: string }[] = [
  { value: "latest", label: "Latest" },
  { value: "avg",    label: "Avg" },
  { value: "median", label: "Median" },
  { value: "max",    label: "Peak" },
];

export const BREAKDOWN_DIMENSIONS: { value: BreakdownDimension; label: string }[] =
  [
    { value: "ide", label: "IDE" },
    { value: "feature", label: "Feature" },
    { value: "language", label: "Language" },
    { value: "model", label: "Model" },
  ];

export const BREAKDOWN_METRICS: { value: BreakdownMetric; label: string }[] = [
  { value: "codeGenerationActivityCount", label: "Suggestions" },
  { value: "codeAcceptanceActivityCount", label: "Acceptances" },
  { value: "locAddedSum", label: "Lines accepted" },
];

export const BREAKDOWN_METRIC_LABELS: Record<BreakdownMetric, string> = {
  codeGenerationActivityCount: "Suggestions",
  codeAcceptanceActivityCount: "Acceptances",
  locAddedSum: "Lines accepted",
};
