import type { DimensionAgg } from "../types";
import { scoreDelta } from "../utils/aggregations";

type Props = {
  dims: DimensionAgg[];
  compareDims?: DimensionAgg[];
  compareLabel?: string;
};

export function DimensionBars({ dims, compareDims, compareLabel }: Props) {
  const isCompare = compareDims && compareDims.length > 0;

  return (
    <div className="section">
      <div className="section__header">
        <h3 className="section__title">Dimension scores</h3>
        {isCompare && (
          <div className="legend">
            <span className="legend__bar legend__bar--current" /> Current
            <span className="legend__bar legend__bar--compare" /> {compareLabel ?? "Previous"}
          </div>
        )}
      </div>
      <div className="dim-list">
        {dims.map((d) => {
          const comp = compareDims?.find((c) => c.id === d.id);
          // Deltas only appear when a "Compare with" survey is selected.
          const delta = comp ? scoreDelta(d.score, comp.score ?? null) : null;
          return (
            <DimRow
              key={d.id}
              dim={d}
              compareDim={comp}
              delta={delta}
              isCompare={!!isCompare}
            />
          );
        })}
      </div>
    </div>
  );
}

function DimRow({
  dim,
  compareDim,
  delta,
  isCompare,
}: {
  dim: DimensionAgg;
  compareDim?: DimensionAgg;
  delta: number | null;
  isCompare: boolean;
}) {
  return (
    <div className="dim-row">
      <div className="dim-row__meta">
        <span
          className="dim-row__dot"
          style={{ background: dim.color ?? "var(--primary)" }}
        />
        <span className="dim-row__name">{dim.name}</span>
        <div className="dim-row__scores">
          <span className="dim-row__score">
            {dim.score != null ? dim.score : "-"}
          </span>
          {isCompare && compareDim?.score != null && (
            <span className="dim-row__compare-score">
              {compareDim.score}
            </span>
          )}
          {delta != null && delta !== 0 && (
            <span className={`dim-row__delta ${delta > 0 ? "delta--up" : "delta--down"}`}>
              {delta > 0 ? "+" : ""}{delta}
            </span>
          )}
        </div>
      </div>
      <div className="dim-row__bars">
        <div className="dim-bar">
          <span
            className="dim-bar__fill"
            style={{
              width: `${dim.score ?? 0}%`,
              background: dim.color ?? "var(--primary)",
            }}
          />
        </div>
        {isCompare && compareDim && (
          <div className="dim-bar dim-bar--compare">
            <span
              className="dim-bar__fill dim-bar__fill--compare"
              style={{ width: `${compareDim.score ?? 0}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
