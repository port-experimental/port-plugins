import type { BreakdownMetric, BreakdownRow } from "../types";
import { fmtCompact, fmtInt, fmtPct } from "../utils/format";
import { PALETTE } from "../utils/constants";

type Props = {
  rows: BreakdownRow[];
  metric: BreakdownMetric;
  /** Previous-period rows (matched by label) — enables a Δ column. */
  compareRows?: BreakdownRow[] | null;
  /** Max rows shown as ranked bars (the table lists all). */
  topN?: number;
};

export function RankedBreakdown({ rows, metric, compareRows, topN = 8 }: Props) {
  if (rows.length === 0) {
    return <p className="muted">No breakdown data in this range.</p>;
  }

  const compare = compareRows && compareRows.length > 0 ? compareRows : null;
  const prevByLabel = new Map<string, number>();
  if (compare) for (const r of compare) prevByLabel.set(r.label, r[metric]);

  const sorted = [...rows].sort((a, b) => b[metric] - a[metric]);
  const top = sorted.slice(0, topN);
  const max = Math.max(1, ...top.map((r) => r[metric]));

  return (
    <div className="breakdown">
      <div className="breakdown__bars">
        {top.map((r) => (
          <div key={r.label} className="breakdown__row">
            <span className="breakdown__label" title={r.label}>
              {r.label}
            </span>
            <div className="breakdown__track">
              <span
                className="breakdown__fill"
                style={{ width: `${(r[metric] / max) * 100}%` }}
              />
            </div>
            <span className="breakdown__val">{fmtCompact(r[metric])}</span>
          </div>
        ))}
      </div>

      <div className={`table${compare ? " table--compare" : ""}`}>
        <div className="table__head">
          <span className="table__cell table__cell--name">Name</span>
          <span className="table__cell table__cell--num">Suggestions</span>
          <span className="table__cell table__cell--num">Acceptances</span>
          <span className="table__cell table__cell--num">Accept %</span>
          <span className="table__cell table__cell--num">Lines</span>
          {compare && <span className="table__cell table__cell--num">Δ prev</span>}
        </div>
        {sorted.map((r) => {
          const prev = compare ? prevByLabel.get(r.label) ?? 0 : null;
          const diff = prev != null ? r[metric] - prev : null;
          return (
            <div key={r.label} className="table__row">
              <span className="table__cell table__cell--name" title={r.label}>
                {r.label}
              </span>
              <span className="table__cell table__cell--num">
                {fmtInt(r.codeGenerationActivityCount)}
              </span>
              <span className="table__cell table__cell--num">
                {fmtInt(r.codeAcceptanceActivityCount)}
              </span>
              <span className="table__cell table__cell--num">
                {fmtPct(r.acceptanceRate, 0)}
              </span>
              <span className="table__cell table__cell--num">
                {fmtInt(r.locAddedSum)}
              </span>
              {compare && (
                <span
                  className={`table__cell table__cell--num ${
                    diff == null || diff === 0
                      ? ""
                      : diff > 0
                        ? "delta--up"
                        : "delta--down"
                  }`}
                >
                  {diff == null || diff === 0
                    ? "–"
                    : `${diff > 0 ? "+" : "−"}${fmtCompact(Math.abs(diff))}`}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
