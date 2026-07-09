import { useState } from "react";
import type { Series, SeriesPoint } from "../../types";

type Props = {
  data: SeriesPoint[];
  series: Series[];
  format?: (v: number) => string;
  /** Previous-period series, index-aligned; drawn as faint ghost bars. */
  compareData?: SeriesPoint[] | null;
  ariaLabel?: string;
};

const W = 640;
const H = 158;
const PAD = { top: 12, right: 14, bottom: 24, left: 34 };

function niceMax(v: number): number {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const norm = v / mag;
  const step = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return step * mag;
}

/** Grouped column chart with optional faint "ghost" bars for the prior period. */
export function GroupedBars({
  data,
  series,
  format = (v) => String(v),
  compareData,
  ariaLabel = "Bar chart",
}: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  if (data.length === 0) return null;
  const hasCompare = !!compareData && compareData.length > 0;

  const cmpVals = hasCompare
    ? compareData!.flatMap((d) => series.map((s) => Number(d[s.key] ?? 0)))
    : [];
  const max = niceMax(
    Math.max(
      1,
      ...data.flatMap((d) => series.map((s) => Number(d[s.key] ?? 0))),
      ...cmpVals
    )
  );

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const n = data.length;
  const groupW = innerW / n;
  const barGap = 2;
  const barW = Math.max(
    1,
    (groupW * 0.7 - barGap * (series.length - 1)) / series.length
  );

  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;
  const gridVals = [0, max / 2, max];
  const labelStep = Math.ceil(n / 8);

  return (
    <div className="chart">
      <div className="chart__plot">
        <svg
          className="chart__svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={ariaLabel}
        >
          {gridVals.map((g) => (
            <g key={g}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(g)}
                y2={y(g)}
                className="chart__grid"
              />
              <text x={4} y={y(g) + 3} className="chart__axis">
                {format(g)}
              </text>
            </g>
          ))}

          {data.map((d, i) => {
            const gx = PAD.left + i * groupW + groupW * 0.15;
            return (
              <g
                key={d.date}
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              >
                {hoverIdx === i && (
                  <rect
                    x={PAD.left + i * groupW}
                    y={PAD.top}
                    width={groupW}
                    height={innerH}
                    className="chart__bar-hover"
                  />
                )}
                {series.map((s, si) => {
                  const slotX = gx + si * (barW + barGap);
                  const v = Number(d[s.key] ?? 0);
                  const cv = hasCompare
                    ? Number(compareData![i]?.[s.key] ?? 0)
                    : null;
                  return (
                    <g key={s.key}>
                      {cv != null && (
                        <rect
                          x={slotX}
                          y={y(cv)}
                          width={barW}
                          height={Math.max(0, innerH - (y(cv) - PAD.top))}
                          rx={1.5}
                          fill={s.color}
                          fillOpacity={0.25}
                        />
                      )}
                      <rect
                        x={cv != null ? slotX + barW * 0.2 : slotX}
                        y={y(v)}
                        width={cv != null ? barW * 0.6 : barW}
                        height={Math.max(0, innerH - (y(v) - PAD.top))}
                        rx={1.5}
                        fill={s.color}
                      />
                    </g>
                  );
                })}
              </g>
            );
          })}

          {data.map((d, i) =>
            i % labelStep === 0 || i === n - 1 ? (
              <text
                key={d.date}
                x={PAD.left + i * groupW + groupW / 2}
                y={H - 8}
                textAnchor="middle"
                className="chart__xlabel"
              >
                {d.label}
              </text>
            ) : null
          )}
        </svg>

        {hoverIdx != null && (
          <div
            className="chart__pop"
            style={{
              left: `${((PAD.left + hoverIdx * groupW + groupW / 2) / W) * 100}%`,
              transform: `translate(${hoverIdx > n / 2 ? "-100%" : "0"}, 0)`,
            }}
          >
            <div className="chart__pop-title">{data[hoverIdx].label}</div>
            {series.map((s) => {
              const cur = Number(data[hoverIdx][s.key] ?? 0);
              const prevRaw = hasCompare
                ? compareData![hoverIdx]?.[s.key]
                : undefined;
              const prev = prevRaw != null ? Number(prevRaw) : null;
              const diff = prev != null ? cur - prev : null;
              return (
                <div key={s.key} className="chart__pop-row">
                  <span className="chart__pop-dot" style={{ background: s.color }} />
                  <span className="chart__pop-name">{s.name}</span>
                  <span className="chart__pop-val">{format(cur)}</span>
                  {diff != null && (
                    <span
                      className={`chart__pop-delta ${diff >= 0 ? "delta--up" : "delta--down"}`}
                    >
                      {diff >= 0 ? "▲" : "▼"} {format(Math.abs(diff))}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="chart__legend">
        {series.map((s) => (
          <span key={s.key} className="chart__legend-item">
            <span className="chart__legend-dot" style={{ background: s.color }} />
            {s.name}
          </span>
        ))}
        {hasCompare && (
          <span className="chart__legend-item chart__legend-item--muted">
            <span className="chart__legend-ghost" />
            Previous period
          </span>
        )}
      </div>
    </div>
  );
}
