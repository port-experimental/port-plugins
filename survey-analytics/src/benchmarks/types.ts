// ── Benchmark reference data ─────────────────────────────────────────────────
// A benchmark is an external reference distribution a survey can be compared
// against (e.g. the published DORA 2025 numbers). Benchmarks are bundled with
// the plugin (see ./registry). A survey question opts in via its
// `benchmark: { source, metric }` tag; the join is by choice `value`.

export type BenchmarkLevel = {
  /** Share of the reference population that selected exactly this answer (%). */
  atPct: number;
  /** Cumulative share at this answer or better - a percentile rank where
   *  LOWER = more elite, consistent across every metric. (%) */
  topPct: number;
};

export type BenchmarkMetric = {
  /** Real-world direction of the underlying metric, for labeling only. The
   *  comparison itself relies on the survey's choice scores + `topPct`. */
  betterDirection: "higher" | "lower";
  /** Reference distribution keyed by the survey question's choice `value`. */
  levels: Record<string, BenchmarkLevel>;
};

export type Benchmark = {
  /** Stable id; matches a question's `benchmark.source` (e.g. "dora-2025"). */
  id: string;
  framework?: string;
  /** Human-readable provenance, shown in the UI. */
  source: string;
  publishedYear?: number;
  /** Reference sample size, for the "n ≈ …" caption. */
  sampleSize?: number;
  /** Survey window, e.g. "2025-06-13/2025-07-21". */
  window?: string;
  url?: string;
  /** Distributions keyed by metric id (matches a question's `benchmark.metric`). */
  metrics: Record<string, BenchmarkMetric>;
};
