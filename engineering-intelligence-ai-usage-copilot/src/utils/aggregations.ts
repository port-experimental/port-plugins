import type {
  ActivityTotals,
  AggregationMode,
  BreakdownDimension,
  BreakdownMetric,
  BreakdownRow,
  DailyMetric,
  DateRange,
  Granularity,
  MetricTotals,
  Series,
  SeriesPoint,
} from "../types";
import { fmtDayShort, ratio } from "./format";

// ── Date range helpers (runtime — native Date is available in the iframe) ─────

export function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayIso(): string {
  return isoDay(new Date());
}

/** Shift an ISO day by `days` (negative = earlier). */
export function shiftDay(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return isoDay(d);
}

export const RANGE_PRESETS = [
  { value: 7, label: "Last 7 days" },
  { value: 14, label: "Last 14 days" },
  { value: 30, label: "Last 30 days" },
  { value: 60, label: "Last 60 days" },
  { value: 90, label: "Last 90 days" },
] as const;

/** A range covering the last `days` days, inclusive of today. */
export function presetRange(days: number): DateRange {
  const to = todayIso();
  return { from: shiftDay(to, -(days - 1)), to };
}

/** First day (YYYY-MM-01) of the month containing `iso`. */
export function monthStart(iso: string): string {
  return `${iso.slice(0, 7)}-01`;
}

/** Month-to-date: the 1st of the current month through today. */
export function thisMonthRange(): DateRange {
  const to = todayIso();
  return { from: monthStart(to), to };
}

/** The previous full calendar month. */
export function lastMonthRange(): DateRange {
  const to = shiftDay(monthStart(todayIso()), -1); // last day of previous month
  return { from: monthStart(to), to };
}

/** The equal-length range immediately preceding `range` (for delta comparison). */
export function previousRange(range: DateRange): DateRange {
  const from = new Date(`${range.from}T00:00:00Z`);
  const to = new Date(`${range.to}T00:00:00Z`);
  const days = Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
  return { from: shiftDay(range.from, -days), to: shiftDay(range.from, -1) };
}

// ── Bucketing ─────────────────────────────────────────────────────────────────

type Bucket = { key: string; label: string; date: string; items: DailyMetric[] };

function weekStart(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Monday = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return isoDay(d);
}

function bucketKey(day: string, g: Granularity): string {
  if (g === "day") return day;
  if (g === "week") return weekStart(day);
  return day.slice(0, 7); // YYYY-MM
}

function bucketLabel(key: string, g: Granularity): string {
  if (g === "month") {
    const d = new Date(`${key}-01T00:00:00Z`);
    return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
  }
  return fmtDayShort(key);
}

/** Group metrics into ordered buckets at the requested granularity. */
export function bucketize(
  metrics: DailyMetric[],
  g: Granularity
): Bucket[] {
  const map = new Map<string, Bucket>();
  for (const m of metrics) {
    if (!m.day) continue;
    const key = bucketKey(m.day, g);
    let b = map.get(key);
    if (!b) {
      b = { key, label: bucketLabel(key, g), date: key, items: [] };
      map.set(key, b);
    }
    b.items.push(m);
  }
  return [...map.values()].sort((a, b) => a.key.localeCompare(b.key));
}

// ── Reducers over a set of days ───────────────────────────────────────────────

function sum(items: DailyMetric[], sel: (m: DailyMetric) => number): number {
  return items.reduce((acc, m) => acc + sel(m), 0);
}

/** Value of the most recent day in the set (for point-in-time / stock metrics). */
function last(items: DailyMetric[], sel: (m: DailyMetric) => number): number {
  if (items.length === 0) return 0;
  const latest = items.reduce((a, b) => (a.day >= b.day ? a : b));
  return sel(latest);
}

function mean(vals: number[]): number {
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function median(vals: number[]): number {
  const s = [...vals].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Summarize a stock metric across a set of days using the chosen mode.
 * `latest` keeps the original point-in-time behavior; avg/median/max round to
 * whole users. Flow metrics do not use this — they are summed.
 */
export function reduceStock(
  items: DailyMetric[],
  sel: (m: DailyMetric) => number,
  agg: AggregationMode
): number {
  if (items.length === 0) return 0;
  if (agg === "latest") return last(items, sel);
  const vals = items.map(sel);
  if (agg === "max") return Math.max(...vals);
  if (agg === "median") return Math.round(median(vals));
  return Math.round(mean(vals));
}

// ── Headline KPI totals ───────────────────────────────────────────────────────

export function computeTotals(
  metrics: DailyMetric[],
  licensedSeats: number | null,
  agg: AggregationMode = "latest"
): MetricTotals {
  const mau = reduceStock(metrics, (m) => m.monthlyActiveUsers, agg);
  const generated = sum(metrics, (m) => m.codeGenerationActivityCount);
  const accepted = sum(metrics, (m) => m.codeAcceptanceActivityCount);
  const copilotPrs = sum(
    metrics,
    (m) =>
      (m.pullRequests?.totalReviewedByCopilot ?? 0) +
      (m.pullRequests?.totalCreatedByCopilot ?? 0)
  );

  return {
    activeUsersMonthly: mau,
    activeUsersDaily: reduceStock(metrics, (m) => m.dailyActiveUsers, agg),
    activeUsersWeekly: reduceStock(metrics, (m) => m.weeklyActiveUsers, agg),
    adoptionRate:
      licensedSeats && licensedSeats > 0 ? Math.min(mau / licensedSeats, 1) : null,
    acceptanceRate: ratio(accepted, generated),
    linesAccepted: sum(metrics, (m) => m.locAddedSum),
    suggestions: generated,
    copilotPrs,
  };
}

// ── Time-series builders ──────────────────────────────────────────────────────

/** Active users over time — DAU/WAU/MAU (stock metrics → summarized per bucket). */
export function activeUsersSeries(
  metrics: DailyMetric[],
  g: Granularity,
  agg: AggregationMode = "latest"
): SeriesPoint[] {
  return bucketize(metrics, g).map((b) => ({
    label: b.label,
    date: b.date,
    dau: reduceStock(b.items, (m) => m.dailyActiveUsers, agg),
    wau: reduceStock(b.items, (m) => m.weeklyActiveUsers, agg),
    mau: reduceStock(b.items, (m) => m.monthlyActiveUsers, agg),
  }));
}

/** Active users by surface over time (overlapping daily-active counts). */
export function surfaceSeries(
  metrics: DailyMetric[],
  g: Granularity,
  agg: AggregationMode = "latest"
): SeriesPoint[] {
  return bucketize(metrics, g).map((b) => ({
    label: b.label,
    date: b.date,
    cli: reduceStock(b.items, (m) => m.dailyActiveCliUsers, agg),
    cloudAgent: reduceStock(b.items, (m) => m.dailyActiveCopilotCloudAgentUsers, agg),
    codeReview: reduceStock(b.items, (m) => m.dailyActiveCodeReviewUsers, agg),
  }));
}

/** Suggestions vs acceptances over time (flow → summed in bucket). */
export function suggestionsSeries(
  metrics: DailyMetric[],
  g: Granularity
): SeriesPoint[] {
  return bucketize(metrics, g).map((b) => ({
    label: b.label,
    date: b.date,
    generated: sum(b.items, (m) => m.codeGenerationActivityCount),
    accepted: sum(b.items, (m) => m.codeAcceptanceActivityCount),
  }));
}

/** Acceptance-rate trend (activity-based and LOC-based), as percentages. */
export function acceptanceRateSeries(
  metrics: DailyMetric[],
  g: Granularity,
  agg: AggregationMode = "avg"
): SeriesPoint[] {
  return bucketize(metrics, g).map((b) => {
    if (agg === "avg") {
      // Weighted average across bucket: best represents true acceptance over the period.
      const gen = sum(b.items, (m) => m.codeGenerationActivityCount);
      const acc = sum(b.items, (m) => m.codeAcceptanceActivityCount);
      const locSug = sum(b.items, (m) => m.locSuggestedToAddSum);
      const locAdd = sum(b.items, (m) => m.locAddedSum);
      return {
        label: b.label, date: b.date,
        activity: gen > 0 ? Math.round((acc / gen) * 100) : 0,
        loc: locSug > 0 ? Math.round((locAdd / locSug) * 100) : 0,
      };
    }
    // For latest/median/peak: compute per-day rates then reduce.
    const sorted = [...b.items].sort((a, b) => a.day.localeCompare(b.day));
    const dayActivity = sorted.map((m) =>
      m.codeGenerationActivityCount > 0
        ? (m.codeAcceptanceActivityCount / m.codeGenerationActivityCount) * 100
        : 0
    );
    const dayLoc = sorted.map((m) =>
      m.locSuggestedToAddSum > 0
        ? (m.locAddedSum / m.locSuggestedToAddSum) * 100
        : 0
    );
    const reduceRates = (vals: number[]): number => {
      if (vals.length === 0) return 0;
      if (agg === "latest") return vals[vals.length - 1];
      if (agg === "max") return Math.max(...vals);
      return median(vals);
    };
    return {
      label: b.label, date: b.date,
      activity: Math.round(reduceRates(dayActivity)),
      loc: Math.round(reduceRates(dayLoc)),
    };
  });
}

/** Lines suggested vs accepted over time (flow → summed in bucket). */
export function locSeries(
  metrics: DailyMetric[],
  g: Granularity
): SeriesPoint[] {
  return bucketize(metrics, g).map((b) => ({
    label: b.label,
    date: b.date,
    suggested: sum(b.items, (m) => m.locSuggestedToAddSum),
    added: sum(b.items, (m) => m.locAddedSum),
  }));
}

/**
 * Copilot PR activity over time — created by Copilot + reviewed by Copilot
 * (flow metrics → summed in bucket).
 */
export function prActivitySeries(
  metrics: DailyMetric[],
  g: Granularity
): SeriesPoint[] {
  return bucketize(metrics, g).map((b) => ({
    label: b.label,
    date: b.date,
    created: sum(b.items, (m) => m.pullRequests?.totalCreatedByCopilot ?? 0),
    reviewed: sum(b.items, (m) => m.pullRequests?.totalReviewedByCopilot ?? 0),
  }));
}

/**
 * PR cycle time — median minutes to merge, reduced across the bucket.
 * Only days with non-zero values contribute; empty buckets yield 0.
 */
export function prCycleTimeSeries(
  metrics: DailyMetric[],
  g: Granularity,
  agg: AggregationMode = "avg"
): SeriesPoint[] {
  return bucketize(metrics, g).map((b) => {
    const allSorted = [...b.items]
      .sort((a, c) => a.day.localeCompare(c.day))
      .map((m) => m.pullRequests?.medianMinutesToMerge ?? 0);

    if (agg === "latest") {
      // Use the actual latest day's raw value — don't filter zeros first, as that
      // would silently return an earlier day when the most recent day has no PRs.
      const latest = allSorted[allSorted.length - 1] ?? 0;
      return { label: b.label, date: b.date, minutes: latest };
    }

    const nonZero = allSorted.filter((v) => v > 0);
    if (nonZero.length === 0) return { label: b.label, date: b.date, minutes: 0 };
    let minutes: number;
    if (agg === "max") minutes = Math.max(...nonZero);
    else if (agg === "median") minutes = Math.round(median(nonZero));
    else minutes = Math.round(nonZero.reduce((a, x) => a + x, 0) / nonZero.length);
    return { label: b.label, date: b.date, minutes };
  });
}

// ── Breakdown panel (sum an array across the range, grouped by dimension) ──────

type Keyed = { key: string } & ActivityTotals;

function accumulate(map: Map<string, Keyed>, key: string, t: ActivityTotals) {
  const cur =
    map.get(key) ??
    ({
      key,
      userInitiatedInteractionCount: 0,
      codeGenerationActivityCount: 0,
      codeAcceptanceActivityCount: 0,
      locSuggestedToAddSum: 0,
      locSuggestedToDeleteSum: 0,
      locAddedSum: 0,
      locDeletedSum: 0,
    } as Keyed);
  cur.codeGenerationActivityCount += t.codeGenerationActivityCount;
  cur.codeAcceptanceActivityCount += t.codeAcceptanceActivityCount;
  cur.locAddedSum += t.locAddedSum;
  cur.locSuggestedToAddSum += t.locSuggestedToAddSum;
  map.set(key, cur);
}

/** Iterate all rows for a single DailyMetric for a given dimension, calling `cb(key, totals)`. */
function forEachDimEntry(
  m: DailyMetric,
  dimension: BreakdownDimension,
  cb: (key: string, t: ActivityTotals) => void
) {
  if (dimension === "ide") {
    for (const r of m.totalsByIde) cb(r.ide, r);
  } else if (dimension === "feature") {
    for (const r of m.totalsByFeature) cb(r.feature, r);
  } else if (dimension === "language") {
    for (const r of m.totalsByLanguageFeature) cb(r.language, r);
  } else {
    for (const r of m.totalsByModelFeature) cb(r.model, r);
  }
}

export function buildBreakdown(
  metrics: DailyMetric[],
  dimension: BreakdownDimension
): BreakdownRow[] {
  const map = new Map<string, Keyed>();
  for (const m of metrics) {
    forEachDimEntry(m, dimension, (key, t) => accumulate(map, key, t));
  }

  return [...map.values()]
    .map((k) => ({
      label: k.key,
      codeGenerationActivityCount: k.codeGenerationActivityCount,
      codeAcceptanceActivityCount: k.codeAcceptanceActivityCount,
      locAddedSum: k.locAddedSum,
      acceptanceRate: ratio(
        k.codeAcceptanceActivityCount,
        k.codeGenerationActivityCount
      ),
    }))
    // Drop empty rows (e.g. the GitHub "others/others" placeholder with all zeros).
    .filter(
      (r) =>
        r.codeGenerationActivityCount > 0 ||
        r.codeAcceptanceActivityCount > 0 ||
        r.locAddedSum > 0
    );
}

const BREAKDOWN_PALETTE = [
  "#8b5cf6", // violet
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ec4899", // pink
  "#06b6d4", // cyan
];

const TOP_N = 6;

/**
 * Time-series breakdown: for each bucket plot the selected metric for the top-N
 * dimension keys (by total across the full range). Returns both the series-point
 * array and the dynamic Series descriptors for the chart legend.
 */
export function breakdownTimeSeries(
  metrics: DailyMetric[],
  g: Granularity,
  dimension: BreakdownDimension,
  metric: BreakdownMetric
): { points: SeriesPoint[]; series: Series[] } {
  // Pass 1: rank keys by total to pick top N.
  const totals = new Map<string, number>();
  for (const m of metrics) {
    forEachDimEntry(m, dimension, (key, t) => {
      totals.set(key, (totals.get(key) ?? 0) + t[metric]);
    });
  }
  const topKeys = [...totals.entries()]
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N)
    .map(([k]) => k);

  if (topKeys.length === 0) return { points: [], series: [] };

  // Pass 2: build time series — one numeric field per top key.
  const points = bucketize(metrics, g).map((b) => {
    const point: SeriesPoint = { label: b.label, date: b.date };
    for (const key of topKeys) point[key] = 0;
    for (const m of b.items) {
      forEachDimEntry(m, dimension, (key, t) => {
        if (topKeys.includes(key)) {
          (point[key] as number) += t[metric];
        }
      });
    }
    return point;
  });

  const series: Series[] = topKeys.map((key, i) => ({
    key,
    name: key,
    color: BREAKDOWN_PALETTE[i % BREAKDOWN_PALETTE.length],
  }));

  return { points, series };
}
