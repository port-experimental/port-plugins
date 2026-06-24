import type {
  AnalyticsResponse,
  Choice,
  DistBucket,
  SurveyDefinition,
} from "../types";
import type { Benchmark } from "./types";
import { resolveBenchmark } from "./registry";

// ── Output shapes ────────────────────────────────────────────────────────────

export type BenchmarkBucket = {
  value: string;
  label: string;
  shortLabel?: string;
  /** Team responses that chose this answer. */
  teamCount: number;
  /** Team distribution for this answer (% of the team's answered responses). */
  teamPct: number;
  /** Reference distribution for this answer (% of the benchmark population). */
  benchPct: number | null;
  /** Cumulative percentile at this answer or better (lower = more elite). */
  topPct: number | null;
  /** Color tone by goodness (from the choice score), green = favorable. */
  tone: DistBucket["tone"];
};

export type BenchmarkMetricComparison = {
  questionId: string;
  metric: string;
  /** Question text. */
  label: string;
  dimensionName?: string;
  /** Responses that answered this question. */
  teamCount: number;
  /** Percentile of the team's median respondent (lower = more elite), or null. */
  teamMedianTopPct: number | null;
  /** The team's median answer's short label, for the headline. */
  teamMedianLabel?: string;
  buckets: BenchmarkBucket[];
};

export type BenchmarkComparison = {
  benchmark: Benchmark;
  metrics: BenchmarkMetricComparison[];
  /** Strongest metric (lowest median percentile). */
  best: BenchmarkMetricComparison | null;
  /** Weakest metric (highest median percentile) - "needs attention". */
  worst: BenchmarkMetricComparison | null;
  /** Mean of the per-metric median percentiles (lower = more elite), or null. */
  overallTopPct: number | null;
  /** Max responses answered across the benchmarked metrics. */
  responseCount: number;
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function toneFor(norm: number): DistBucket["tone"] {
  if (norm >= 0.8) return "very-high";
  if (norm >= 0.6) return "high";
  if (norm >= 0.4) return "mid";
  if (norm >= 0.2) return "low";
  return "very-low";
}

/** Distinct benchmark sources referenced by the definition's questions. */
export function defBenchmarkSources(def: SurveyDefinition): string[] {
  const sources = new Set<string>();
  for (const q of def.questions) {
    if (q.benchmark?.source) sources.add(q.benchmark.source);
  }
  return [...sources];
}

/** True when the survey has at least one question whose benchmark resolves. */
export function hasResolvableBenchmark(def: SurveyDefinition): boolean {
  return def.questions.some((q) => {
    // Mirror buildBenchmarkComparison's requirements: a benchmark join needs
    // choices, a resolved metric, and its levels - otherwise the tab would show
    // but render an empty comparison.
    if (!q.benchmark || !q.choices?.length) return false;
    const bm = resolveBenchmark(q.benchmark.source);
    const metric = bm?.metrics[q.benchmark.metric];
    return !!metric && typeof metric.levels === "object";
  });
}

// ── Build comparison ─────────────────────────────────────────────────────────

/**
 * For each benchmark source referenced by the survey, build a per-metric
 * comparison of the team's answer distribution against the reference
 * distribution. Questions without a resolvable benchmark are skipped.
 */
export function buildBenchmarkComparison(
  def: SurveyDefinition,
  responses: AnalyticsResponse[]
): BenchmarkComparison[] {
  const dimMap = Object.fromEntries(def.dimensions.map((d) => [d.id, d.name]));
  const bySource = new Map<string, BenchmarkMetricComparison[]>();
  const benchmarkBySource = new Map<string, Benchmark>();

  for (const q of def.questions) {
    if (!q.benchmark || !q.choices?.length) continue;
    const benchmark = resolveBenchmark(q.benchmark.source);
    const metric = benchmark?.metrics[q.benchmark.metric];
    // Guard `levels` so a malformed benchmark can't throw at `metric.levels[...]`.
    if (!benchmark || !metric || typeof metric.levels !== "object") continue;
    benchmarkBySource.set(benchmark.id, benchmark);

    const choiceByValue = new Map<string, Choice>(
      q.choices.map((c) => [c.value, c])
    );
    const scores = q.choices
      .map((c) => c.score)
      .filter((s): s is number => typeof s === "number");
    const maxScore = scores.length ? Math.max(...scores, 0) : 0;

    // Team answer counts (single-choice answers only).
    const teamCounts = new Map<string, number>();
    const chosen: Choice[] = [];
    for (const r of responses) {
      const v = r.answers?.[q.id];
      if (typeof v !== "string") continue;
      const c = choiceByValue.get(v);
      if (!c) continue;
      teamCounts.set(v, (teamCounts.get(v) ?? 0) + 1);
      chosen.push(c);
    }
    const teamCount = chosen.length;

    const buckets: BenchmarkBucket[] = q.choices.map((c) => {
      const tc = teamCounts.get(c.value) ?? 0;
      const level = metric.levels[c.value];
      const goodNorm =
        typeof c.score === "number" && maxScore > 0 ? c.score / maxScore : null;
      return {
        value: c.value,
        label: c.label,
        shortLabel: c.shortLabel,
        teamCount: tc,
        teamPct: teamCount > 0 ? Math.round((tc / teamCount) * 100) : 0,
        benchPct: level ? level.atPct : null,
        topPct: level ? level.topPct : null,
        tone: goodNorm != null ? toneFor(goodNorm) : "mid",
      };
    });

    // Team median respondent → its benchmark percentile (lower = more elite).
    let teamMedianTopPct: number | null = null;
    let teamMedianLabel: string | undefined;
    const scoredChosen = chosen.filter((c) => typeof c.score === "number");
    if (scoredChosen.length > 0) {
      const sorted = [...scoredChosen].sort((a, b) => a.score! - b.score!);
      const median = sorted[Math.floor((sorted.length - 1) / 2)];
      teamMedianTopPct = metric.levels[median.value]?.topPct ?? null;
      teamMedianLabel = median.shortLabel ?? median.label;
    }

    const comparison: BenchmarkMetricComparison = {
      questionId: q.id,
      metric: q.benchmark.metric,
      label: q.text,
      dimensionName: q.dimension ? dimMap[q.dimension] : undefined,
      teamCount,
      teamMedianTopPct,
      teamMedianLabel,
      buckets,
    };

    const list = bySource.get(benchmark.id) ?? [];
    list.push(comparison);
    bySource.set(benchmark.id, list);
  }

  return [...bySource.entries()].map(([id, metrics]) => {
    const scored = metrics.filter(
      (m): m is BenchmarkMetricComparison & { teamMedianTopPct: number } =>
        m.teamMedianTopPct != null
    );
    const byTopPct = [...scored].sort(
      (a, b) => a.teamMedianTopPct - b.teamMedianTopPct
    );
    const overallTopPct = scored.length
      ? Math.round(
          scored.reduce((s, m) => s + m.teamMedianTopPct, 0) / scored.length
        )
      : null;
    return {
      benchmark: benchmarkBySource.get(id)!,
      metrics,
      best: byTopPct[0] ?? null,
      worst: byTopPct[byTopPct.length - 1] ?? null,
      overallTopPct,
      responseCount: metrics.reduce((m, c) => Math.max(m, c.teamCount), 0),
    };
  });
}
