import { useState } from "react";
import type { DistBucket } from "../types";
import type {
  BenchmarkBucket,
  BenchmarkComparison,
  BenchmarkMetricComparison,
} from "../benchmarks/compare";

type Props = {
  comparisons: BenchmarkComparison[];
  teamLabel?: string;
};

const TONE_COLOR: Record<DistBucket["tone"], string> = {
  "very-low": "#ef4444",
  low: "#f59e0b",
  mid: "#eab308",
  high: "#4ade80",
  "very-high": "#10b981",
};

/** Friendly names for the known DORA metrics; falls back to a humanized id. */
const METRIC_LABELS: Record<string, string> = {
  deploy_frequency: "Deployment frequency",
  lead_time: "Lead time for changes",
  recovery_time: "Failed deployment recovery time",
  change_failure: "Change failure rate",
  rework_rate: "Rework rate",
};

function metricName(id: string): string {
  return (
    METRIC_LABELS[id] ??
    id.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase())
  );
}

type Standing = { label: string; tone: DistBucket["tone"]; arrow: string };

/** Map a percentile (lower = more elite) to a plain-language standing. */
function standingFor(topPct: number): Standing {
  if (topPct <= 20) return { label: "Top tier", tone: "very-high", arrow: "↑" };
  if (topPct <= 40) return { label: "Above average", tone: "high", arrow: "↑" };
  if (topPct <= 60) return { label: "Typical", tone: "mid", arrow: "→" };
  if (topPct <= 80) return { label: "Below average", tone: "low", arrow: "↓" };
  return { label: "Bottom tier", tone: "very-low", arrow: "↓" };
}

function overallVerdict(topPct: number): string {
  if (topPct <= 20) return "top-tier delivery performance";
  if (topPct <= 40) return "above-average delivery performance";
  if (topPct <= 60) return "middle of the pack";
  if (topPct <= 80) return "below-average delivery performance";
  return "bottom-tier delivery performance";
}

function DistBar({
  buckets,
  kind,
}: {
  buckets: BenchmarkBucket[];
  kind: "team" | "bench";
}) {
  const segs = buckets
    .map((b) => ({ ...b, pct: kind === "team" ? b.teamPct : b.benchPct ?? 0 }))
    .filter((s) => s.pct > 0);
  const total = segs.reduce((a, s) => a + s.pct, 0);

  if (total === 0) {
    return <div className="bm-bar bm-bar--empty">No responses yet</div>;
  }
  return (
    <div className="bm-bar" role="img" aria-label="Answer distribution">
      {segs.map((s) => (
        <span
          key={s.value}
          className="bm-bar__seg"
          style={{ width: `${s.pct}%`, background: TONE_COLOR[s.tone] }}
          title={`${s.label}: ${s.pct}%`}
        />
      ))}
    </div>
  );
}

function MetricRow({
  m,
  benchLabel,
  showDetail,
}: {
  m: BenchmarkMetricComparison;
  benchLabel: string;
  showDetail: boolean;
}) {
  const hasData = m.teamMedianTopPct != null;
  const s = hasData ? standingFor(m.teamMedianTopPct as number) : null;
  const ahead = hasData ? Math.round(100 - (m.teamMedianTopPct as number)) : null;

  return (
    <div className="bm-metric">
      <div className="bm-metric__row">
        <span className="bm-metric__name">{metricName(m.metric)}</span>
        <span className="bm-metric__you">
          {m.teamMedianLabel ? (
            <>
              You: <strong>{m.teamMedianLabel}</strong>
            </>
          ) : (
            <span className="muted">No responses</span>
          )}
        </span>
        {s ? (
          <span
            className="bm-metric__verdict"
            style={{ color: TONE_COLOR[s.tone] }}
          >
            <span aria-hidden="true">{s.arrow}</span> {s.label}
          </span>
        ) : (
          <span className="bm-metric__verdict muted">-</span>
        )}
        <span className="bm-metric__ahead muted">
          {ahead != null ? `ahead of ~${ahead}% of orgs` : ""}
        </span>
      </div>

      {showDetail && (
        <div className="bm-detail">
          <div className="bm-pair">
            <span className="bm-pair__label">Your team</span>
            <DistBar buckets={m.buckets} kind="team" />
          </div>
          <div className="bm-pair">
            <span className="bm-pair__label">{benchLabel}</span>
            <DistBar buckets={m.buckets} kind="bench" />
          </div>
          <div className="bm-legend">
            {m.buckets.map((b) => (
              <span key={b.value} className="bm-legend__item">
                <span
                  className="bm-legend__swatch"
                  style={{ background: TONE_COLOR[b.tone] }}
                />
                <span className="bm-legend__label">{b.shortLabel ?? b.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ComparisonCard({
  c,
  teamLabel,
}: {
  c: BenchmarkComparison;
  teamLabel?: string;
}) {
  const [showDetail, setShowDetail] = useState(false);
  const b = c.benchmark;
  const benchLabel =
    `${b.framework ?? ""} ${b.publishedYear ?? ""}`.trim() || "Benchmark";
  const caption = [
    b.source,
    b.sampleSize ? `n ≈ ${b.sampleSize.toLocaleString()}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const who = teamLabel ?? "All teams";

  return (
    <div className="section">
      <div className="section__header">
        <div className="section__title-group">
          <h3 className="section__title">Compare to benchmark</h3>
          <span className="bm-scope" title="Reflects the TEAM filter above">
            {who}
          </span>
          {b.url ? (
            <a className="bm-source" href={b.url} target="_blank" rel="noreferrer">
              {caption}
            </a>
          ) : (
            <span className="bm-source muted">{caption}</span>
          )}
        </div>
        <button
          type="button"
          className="bm-detail-toggle"
          aria-expanded={showDetail}
          onClick={() => setShowDetail((v) => !v)}
        >
          {showDetail ? "Hide distributions" : "Show distributions"}
        </button>
      </div>

      {c.overallTopPct != null ? (
        <div className="bm-summary">
          <p className="bm-summary__lead">
            <strong>{who}: {overallVerdict(c.overallTopPct)}</strong> vs {benchLabel}.
          </p>
          <p className="bm-summary__detail muted">
            {c.best && (
              <>
                Strongest: <strong>{metricName(c.best.metric)}</strong>
                {" "}({standingFor(c.best.teamMedianTopPct as number).label.toLowerCase()}).{" "}
              </>
            )}
            {c.worst && c.worst !== c.best && (
              <>
                Needs attention: <strong>{metricName(c.worst.metric)}</strong>
                {" "}({standingFor(c.worst.teamMedianTopPct as number).label.toLowerCase()}).
              </>
            )}
            {" "}Based on {c.responseCount}{" "}
            {c.responseCount === 1 ? "response" : "responses"}.
          </p>
        </div>
      ) : (
        <p className="muted bm-intro">
          No responses yet for {who} - showing the {benchLabel} reference
          distribution. The standing per metric appears once there are responses.
        </p>
      )}

      <div className="bm-metrics">
        {c.metrics.map((m) => (
          <MetricRow
            key={m.questionId}
            m={m}
            benchLabel={benchLabel}
            showDetail={showDetail}
          />
        ))}
      </div>
    </div>
  );
}

export function BenchmarkView({ comparisons, teamLabel }: Props) {
  if (comparisons.length === 0) {
    return (
      <div className="state state--empty">
        <span className="state__title">No benchmark available</span>
        <span className="muted">
          This survey has no questions tagged with a benchmark.
        </span>
      </div>
    );
  }

  return (
    <>
      {comparisons.map((c) => (
        <ComparisonCard key={c.benchmark.id} c={c} teamLabel={teamLabel} />
      ))}
    </>
  );
}
