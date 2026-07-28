import { useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import type { Dimension, TrendPoint } from "../types";
import { scoreDelta } from "../utils/aggregations";

type TrendRange = "1y" | "2y" | "all";

type Props = {
  trend: TrendPoint[];
  dimensions: Dimension[];
  framework?: string;
  teamLabel?: string;
};

const W = 600;
const H = 150;
const PAD = { top: 16, right: 16, bottom: 28, left: 30 };

function domain(values: number[]): [number, number] {
  if (values.length === 0) return [0, 100];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const lo = Math.max(0, Math.floor((min - 8) / 10) * 10);
  const hi = Math.min(100, Math.ceil((max + 8) / 10) * 10);
  return [lo, hi === lo ? lo + 10 : hi];
}

const RANGE_OPTIONS: { value: TrendRange; label: string }[] = [
  { value: "1y", label: "1Y" },
  { value: "2y", label: "2Y" },
  { value: "all", label: "All" },
];

const MS_YEAR = 365.25 * 24 * 60 * 60 * 1000;

function ptDate(t: TrendPoint): number {
  return new Date(t.publishedAt ?? t.createdAt ?? 0).getTime();
}

function fmtFullDate(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Day-level axis label ("Jun 20"), used when two surveys share a month label. */
function fmtDayLabel(iso?: string): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function TrendLine({ trend, dimensions, framework, teamLabel }: Props) {
  const [range, setRange] = useState<TrendRange>("all");
  // Which dimension lines are plotted. Empty by default, so the chart leads with
  // the Overall line alone and dimensions are revealed on demand.
  const [visibleDims, setVisibleDims] = useState<Set<string>>(() => new Set());
  // hover = which survey (idx) and which series (key) the cursor is nearest.
  const [hover, setHover] = useState<{ idx: number; key: string } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const allPts = trend.filter((t) => t.overall != null);
  if (allPts.length < 1) return null;

  const now = Date.now();
  const hasOlderThan1Y = allPts.some((t) => now - ptDate(t) > MS_YEAR);

  const pts =
    range === "1y"
      ? allPts.filter((t) => now - ptDate(t) <= MS_YEAR)
      : range === "2y"
        ? allPts.filter((t) => now - ptDate(t) <= 2 * MS_YEAR)
        : allPts;

  const overallVals = pts.map((t) => t.overall as number);

  const dimSeries = dimensions.map((d) => ({
    dim: d,
    vals: pts.map((t) => t.dimensions[d.id]).filter((v): v is number => typeof v === "number"),
  }));
  // Only dimensions with at least one data point can be plotted or toggled.
  const dimsWithData = dimSeries.filter((s) => s.vals.length > 0);
  const isDimVisible = (id: string) => visibleDims.has(id);
  const visibleDimSeries = dimsWithData.filter((s) => isDimVisible(s.dim.id));
  const anyDimVisible = visibleDimSeries.length > 0;

  const toggleAllDims = () =>
    setVisibleDims(anyDimVisible ? new Set() : new Set(dimsWithData.map((s) => s.dim.id)));
  const toggleDim = (id: string) =>
    setVisibleDims((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // The domain follows only what is drawn (Overall + visible dimensions), so the
  // Overall line uses the full height when shown on its own.
  const allVals = [...overallVals, ...visibleDimSeries.flatMap((s) => s.vals)];
  const [lo, hi] = domain(allVals);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const x = (i: number) =>
    PAD.left + (pts.length === 1 ? innerW / 2 : (i / (pts.length - 1)) * innerW);
  const y = (v: number) =>
    PAD.top + innerH - ((v - lo) / (hi - lo)) * innerH;

  const overallPoints = overallVals.map((v, i) => `${x(i)},${y(v)}`).join(" ");

  const gridVals = [lo, Math.round((lo + hi) / 2), hi];

  // When two surveys share a month-year label (e.g. both "Jun 2026"), fall back
  // to a day-level axis label so the points are distinguishable.
  const labelsCollide = new Set(pts.map((p) => p.label)).size < pts.length;
  const axisLabel = (t: TrendPoint) =>
    labelsCollide ? fmtDayLabel(t.publishedAt ?? t.createdAt) : t.label;

  const hovered = hover ? pts[hover.idx] ?? null : null;

  // Show the popup only near an actual score: snap to the nearest survey by x,
  // then the nearest series by y, and require the cursor to be close to both.
  const handleMove = (e: ReactMouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const sx = ((e.clientX - rect.left) / rect.width) * W;
    const sy = ((e.clientY - rect.top) / rect.height) * H;

    let idx = 0;
    let bestX = Infinity;
    pts.forEach((_, i) => {
      const d = Math.abs(x(i) - sx);
      if (d < bestX) { bestX = d; idx = i; }
    });

    const series: { key: string; yv: number }[] = [
      { key: "overall", yv: y(pts[idx].overall as number) },
      ...visibleDimSeries.flatMap(({ dim }) => {
        const v = pts[idx].dimensions[dim.id];
        return typeof v === "number" ? [{ key: dim.id, yv: y(v) }] : [];
      }),
    ];
    let key = "overall";
    let bestY = Infinity;
    for (const s of series) {
      const d = Math.abs(s.yv - sy);
      if (d < bestY) { bestY = d; key = s.key; }
    }

    if (bestX <= 44 && bestY <= 16) setHover({ idx, key });
    else setHover(null);
  };

  return (
    <div className="section">
      <div className="section__header">
        <div className="section__title-group">
          <h3 className="section__title">Trend over time</h3>
          <span className="section__hint muted">
            {[
              framework ? `${framework} framework` : null,
              teamLabel ? `${teamLabel} team` : "All teams",
            ].filter(Boolean).join(" · ")}
          </span>
        </div>
        <div className="trend-controls">
          {dimsWithData.length > 0 && (
            <button
              type="button"
              className={`trend-range__btn${anyDimVisible ? " trend-range__btn--active" : ""}`}
              onClick={toggleAllDims}
              aria-pressed={anyDimVisible}
            >
              {anyDimVisible ? "Hide dimensions" : "Show dimensions"}
            </button>
          )}
          {hasOlderThan1Y && (
            <div className="trend-range">
              {RANGE_OPTIONS.filter(
                (o) => o.value === "all" || o.value === "1y" || allPts.some((t) => now - ptDate(t) > MS_YEAR)
              ).map((o) => (
                <button
                  key={o.value}
                  className={`trend-range__btn${range === o.value ? " trend-range__btn--active" : ""}`}
                  onClick={() => setRange(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="trend-chart">
      <svg
        ref={svgRef}
        className="trend-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="Overall score trend across surveys"
        onMouseMove={handleMove}
        onMouseLeave={() => setHover(null)}
      >
        {/* gridlines */}
        {gridVals.map((g) => (
          <g key={g}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(g)}
              y2={y(g)}
              className="trend-grid"
            />
            <text x={4} y={y(g) + 3} className="trend-axis">
              {g}
            </text>
          </g>
        ))}

        {/* per-dimension lines (behind overall), only those toggled on */}
        {visibleDimSeries.map(({ dim, vals }) => {
          const color = dim.color ?? "var(--primary)";
          if (vals.length === 1) {
            return (
              <circle
                key={dim.id}
                cx={x(0)}
                cy={y(vals[0])}
                r={3}
                fill={color}
                fillOpacity={0.6}
              />
            );
          }
          const points = vals.map((v, i) => `${x(i)},${y(v)}`).join(" ");
          return (
            <g key={dim.id}>
              <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth={1.5}
                strokeOpacity={0.7}
                strokeLinecap="round"
                strokeDasharray="4 3"
              />
              {vals.map((v, i) => (
                <circle key={i} cx={x(i)} cy={y(v)} r={2.5} fill={color} fillOpacity={0.9} />
              ))}
            </g>
          );
        })}

        {/* overall score line (on top, solid) */}
        <polyline points={overallPoints} className="trend-line" fill="none" />

        {/* dots + value labels + x labels */}
        {pts.map((t, i) => (
          <g key={t.surveyId}>
            <circle cx={x(i)} cy={y(t.overall as number)} r={4} className="trend-dot" />
            <text x={x(i)} y={y(t.overall as number) - 9} className="trend-value">
              {t.overall}
            </text>
            <text
              x={x(i)}
              y={H - 8}
              textAnchor={i === 0 ? "start" : i === pts.length - 1 ? "end" : "middle"}
              className="trend-xlabel"
            >
              {axisLabel(t)}
            </text>
          </g>
        ))}
      </svg>

        {/* Hover popup: anchored to the point, one metric per row, with the
            series nearest the cursor emphasized. HTML overlay, never clipped. */}
        {hovered && hover && (
          <div
            className="trend-pop"
            style={{
              left: `${(x(hover.idx) / W) * 100}%`,
              top: `${(y(hovered.overall as number) / H) * 100}%`,
              transform: `translate(${
                hover.idx === 0 ? "0" : hover.idx === pts.length - 1 ? "-100%" : "-50%"
              }, ${y(hovered.overall as number) < H * 0.45 ? "14px" : "calc(-100% - 14px)"})`,
            }}
          >
            <div className="trend-pop__title">{hovered.title ?? hovered.label}</div>
            <div className="trend-pop__date">
              {fmtFullDate(hovered.publishedAt ?? hovered.createdAt)}
            </div>
            <div className="trend-pop__rows">
              <div className={`trend-pop__row${hover.key === "overall" ? " trend-pop__row--focus" : ""}`}>
                <span className="trend-pop__dot" style={{ background: "currentColor" }} />
                <span className="trend-pop__name">Overall</span>
                <span className="trend-pop__val">{hovered.overall ?? "-"}</span>
              </div>
              {visibleDimSeries.map(({ dim: d }) => (
                <div
                  key={d.id}
                  className={`trend-pop__row${hover.key === d.id ? " trend-pop__row--focus" : ""}`}
                >
                  <span
                    className="trend-pop__dot"
                    style={{ background: d.color ?? "var(--primary)" }}
                  />
                  <span className="trend-pop__name">{d.name}</span>
                  <span className="trend-pop__val">{hovered.dimensions[d.id] ?? "-"}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Latest snapshot, stacked one per row for readability. Hover a point on
          the chart for that survey's full breakdown. */}
      <div className="trend-detail">
        <span className="trend-detail__caption muted">
          Latest survey · change vs the previous survey
          {dimsWithData.length > 0 ? " · click a dimension to plot its line" : ""}
        </span>
        <div className="trend-dims">
          {overallVals.length > 0 && (
            <TrendStat
              color="currentColor"
              name="Overall"
              value={overallVals[overallVals.length - 1]}
              delta={
                overallVals.length < 2
                  ? null
                  : overallVals[overallVals.length - 1] - overallVals[overallVals.length - 2]
              }
            />
          )}
          {dimsWithData.map(({ dim, vals }) => (
            <TrendStat
              key={dim.id}
              color={dim.color ?? "var(--primary)"}
              name={dim.name}
              value={vals[vals.length - 1]}
              delta={
                vals.length < 2
                  ? null
                  : scoreDelta(vals[vals.length - 1], vals[vals.length - 2])
              }
              hidden={!isDimVisible(dim.id)}
              onToggle={() => toggleDim(dim.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function TrendStat({
  color,
  name,
  value,
  delta,
  hidden,
  onToggle,
}: {
  color: string;
  name: string;
  value: number | null;
  delta: number | null;
  /** When toggleable, whether this dimension's line is currently hidden. */
  hidden?: boolean;
  /** When set, the row is a button that shows/hides this dimension's line. */
  onToggle?: () => void;
}) {
  const inner = (
    <>
      <span
        className="trend-dim__dot"
        style={{
          background: hidden ? "transparent" : color,
          boxShadow: hidden ? `inset 0 0 0 1.5px ${color}` : "none",
        }}
      />
      <span className="trend-dim__name">{name}</span>
      <span className="trend-dim__val">{value ?? "-"}</span>
      {delta != null && delta !== 0 && (
        <span className={`trend-dim__delta ${delta > 0 ? "delta--up" : "delta--down"}`}>
          {delta > 0 ? "↑" : "↓"} {Math.abs(delta)}
        </span>
      )}
    </>
  );

  if (!onToggle) return <div className="trend-dim">{inner}</div>;

  return (
    <button
      type="button"
      className={`trend-dim trend-dim--toggle${hidden ? " trend-dim--hidden" : ""}`}
      onClick={onToggle}
      aria-pressed={!hidden}
      title={hidden ? `Show ${name} on the chart` : `Hide ${name}`}
    >
      {inner}
    </button>
  );
}
