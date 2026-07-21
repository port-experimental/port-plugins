import {
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type { Series, SeriesPoint } from "../../types";

type Props = {
  data: SeriesPoint[];
  series: Series[];
  /** Format a raw value for tooltips / axis (e.g. percentages or counts). */
  format?: (v: number) => string;
  /** Fix the y-axis top (e.g. 100 for percentages). */
  maxOverride?: number;
  /** Fill the area under the first series (single-metric charts). */
  area?: boolean;
  /** Previous-period series, index-aligned; drawn as a dashed muted overlay. */
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

export function LineChart({
  data,
  series,
  format = (v) => String(v),
  maxOverride,
  area = false,
  compareData,
  ariaLabel = "Trend chart",
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  if (data.length === 0) return null;
  const hasCompare = !!compareData && compareData.length > 0;

  const values = data.flatMap((d) => series.map((s) => Number(d[s.key] ?? 0)));
  const compareValues = hasCompare
    ? compareData!.flatMap((d) => series.map((s) => Number(d[s.key] ?? 0)))
    : [];
  const rawMax = Math.max(1, ...values, ...compareValues);
  const max = maxOverride ?? niceMax(rawMax);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const n = data.length;

  const x = (i: number) =>
    PAD.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / max) * innerH;

  const gridVals = [0, max / 2, max];
  const labelStep = Math.ceil(n / 8);

  const handleMove = (e: ReactMouseEvent<SVGSVGElement>) => {
    const clientX = e.clientX;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      if (!rect.width) return;
      const sx = ((clientX - rect.left) / rect.width) * W;
      let idx = 0;
      let best = Infinity;
      for (let i = 0; i < n; i++) {
        const d = Math.abs(x(i) - sx);
        if (d < best) { best = d; idx = i; }
      }
      setHoverIdx(idx);
    });
  };

  const hovered = hoverIdx != null ? data[hoverIdx] : null;

  return (
    <div className="chart">
      <div className="chart__plot">
        <svg
          ref={svgRef}
          className="chart__svg"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label={ariaLabel}
          onMouseMove={handleMove}
          onMouseLeave={() => {
            if (rafRef.current !== null) {
              cancelAnimationFrame(rafRef.current);
              rafRef.current = null;
            }
            setHoverIdx(null);
          }}
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

          {hovered && hoverIdx != null && (
            <line
              x1={x(hoverIdx)}
              x2={x(hoverIdx)}
              y1={PAD.top}
              y2={PAD.top + innerH}
              className="chart__cursor"
            />
          )}

          {/* Previous-period overlay (dashed, muted), index-aligned. */}
          {hasCompare &&
            series.map((s) => {
              // Match by date rather than index so mismatched-length arrays don't
              // silently plot compare values against the wrong primary dates.
              const cmpByDate = new Map(compareData!.map((d) => [d.date, d]));
              const pts = data
                .map((d, i) => {
                  const cd = cmpByDate.get(d.date);
                  const cv = cd?.[s.key];
                  return cv != null ? `${x(i)},${y(Number(cv))}` : null;
                })
                .filter(Boolean) as string[];
              if (pts.length < 2) return null;
              return (
                <polyline
                  key={`cmp-${s.key}`}
                  points={pts.join(" ")}
                  fill="none"
                  stroke={s.color}
                  strokeWidth={1.5}
                  strokeOpacity={0.4}
                  strokeDasharray="4 3"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              );
            })}

          {series.map((s, si) => {
            const pts = data.map((d, i) => `${x(i)},${y(Number(d[s.key] ?? 0))}`);
            return (
              <g key={s.key}>
                {area && si === 0 && (
                  <polygon
                    points={`${x(0)},${y(0)} ${pts.join(" ")} ${x(n - 1)},${y(0)}`}
                    fill={s.color}
                    fillOpacity={0.12}
                  />
                )}
                {n === 1 ? (
                  <circle cx={x(0)} cy={y(Number(data[0][s.key] ?? 0))} r={3.5} fill={s.color} />
                ) : (
                  <polyline
                    points={pts.join(" ")}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                )}
                {hoverIdx != null && (
                  <circle
                    cx={x(hoverIdx)}
                    cy={y(Number(data[hoverIdx]?.[s.key] ?? 0))}
                    r={3.5}
                    fill={s.color}
                    stroke="var(--card)"
                    strokeWidth={1.5}
                  />
                )}
              </g>
            );
          })}

          {data.map((d, i) =>
            i % labelStep === 0 || i === n - 1 ? (
              <text
                key={d.date}
                x={x(i)}
                y={H - 8}
                textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"}
                className="chart__xlabel"
              >
                {d.label}
              </text>
            ) : null
          )}
        </svg>

        {hovered && hoverIdx != null && (
          <div
            className="chart__pop"
            style={{
              left: `${(x(hoverIdx) / W) * 100}%`,
              transform: `translate(${hoverIdx > n / 2 ? "-100%" : "0"}, 0)`,
            }}
          >
            <div className="chart__pop-title">{hovered.label}</div>
            {series.map((s) => {
              const cur = Number(hovered[s.key] ?? 0);
              const prevRaw = hasCompare ? compareData!.find((d) => d.date === hovered.date)?.[s.key] : undefined;
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
            <span className="chart__legend-dash" />
            Previous period
          </span>
        )}
      </div>
    </div>
  );
}
