import './DoraDashboard.css';
import { useState, useMemo, useRef, useCallback } from 'react';
import { usePortPluginData } from '@port-labs/plugins-sdk/react';
import { Params } from '../../types';
import { useDoraDashboard, dfBucketTier } from '../../hooks/useDoraDashboard';
import { DoraConfig, DoraTier, DfBucket, MonthlyDataPoint, HistoricalTrend } from './types';

// ─── Param helpers ───────────────────────────────────────────────────────────

function getBlueprintId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'object' && value !== null) {
    const id = (value as Record<string, unknown>).identifier;
    if (typeof id === 'string' && id.trim()) return id.trim();
  }
  return null;
}

function getStringParam(value: unknown, defaultVal: string): string {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return defaultVal;
}

// ─── Tier colour helpers ─────────────────────────────────────────────────────

const TIER_COLOURS: Record<DoraTier, string> = {
  Elite:  '#22c55e',
  High:   '#3860be',
  Medium: '#d97706',
  Low:    '#dc2a2a',
};

const BUCKET_COLOURS: Record<DfBucket, string> = {
  Daily:        '#22c55e',
  Weekly:       '#3860be',
  Monthly:      '#d97706',
  'Yearly/rare':'#dc2a2a',
};

function tierColor(tier: DoraTier): string {
  return TIER_COLOURS[tier];
}

// ─── Small shared UI pieces ──────────────────────────────────────────────────

function TierBadge({ tier }: { tier: DoraTier }) {
  return (
    <span className={`dora-badge dora-badge--${tier}`}>{tier} performer</span>
  );
}

function NotConfigured({ label }: { label: string }) {
  return (
    <div className="dora-kpi-card__unconfigured">
      {label} blueprint not configured
    </div>
  );
}

function fmt(n: number, decimals = 1): string {
  return n.toFixed(decimals);
}

// ─── Bucket bar chart (replaces broken donut) ────────────────────────────────

interface DonutSlice {
  bucket: DfBucket;
  count: number;
}

const BUCKETS: DfBucket[] = ['Daily', 'Weekly', 'Monthly', 'Yearly/rare'];

function BucketBarChart({ slices, total }: { slices: DonutSlice[]; total: number }) {
  const maxCount = Math.max(...slices.map(s => s.count), 1);

  return (
    <div className="dora-bucket-chart">
      <div className="dora-legend-row" style={{ marginBottom: 16 }}>
        {BUCKETS.map(b => (
          <div key={b} className="dora-legend-row__item">
            <span className="dora-legend-row__swatch" style={{ background: BUCKET_COLOURS[b] }} />
            <span className="dora-legend-row__label">{b}</span>
          </div>
        ))}
      </div>
      <div className="dora-bucket-bars">
        {BUCKETS.map(b => {
          const count = slices.find(s => s.bucket === b)?.count ?? 0;
          const pct   = total > 0 ? (count / total) * 100 : 0;
          const barW  = total > 0 ? (count / maxCount) * 100 : 0;
          return (
            <div key={b} className="dora-bucket-row">
              <span className="dora-bucket-row__label">{b}</span>
              <div className="dora-bucket-row__track">
                <div
                  className="dora-bucket-row__fill"
                  style={{ width: `${barW}%`, background: BUCKET_COLOURS[b] }}
                />
              </div>
              <span className="dora-bucket-row__count">{count}</span>
              <span className="dora-bucket-row__pct">{pct.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
      <div className="dora-bucket-chart__total">
        {total.toLocaleString()} assets total
      </div>
    </div>
  );
}

// ─── Top Performers row ──────────────────────────────────────────────────────

interface PerfRowItem {
  name: string;
  count: number;
  bucket: DfBucket;
}

function PerfRow({ item, max }: { item: PerfRowItem; max: number }) {
  const color = BUCKET_COLOURS[item.bucket];
  const pct = max > 0 ? Math.max((item.count / max) * 100, 2) : 2;
  return (
    <div className="dora-perf-row">
      <span className="dora-perf-row__name" title={item.name}>{item.name}</span>
      <span className="dora-perf-row__dot" style={{ background: color }} />
      <div className="dora-perf-row__bar-track">
        <div
          className="dora-perf-row__bar-fill"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="dora-perf-row__count">{item.count} deploys</span>
    </div>
  );
}

// ─── CFR row ─────────────────────────────────────────────────────────────────

interface CfrRowItem {
  name: string;
  pct: number;
  tier: DoraTier;
}

function CfrRow({ item, max }: { item: CfrRowItem; max: number }) {
  const pct = max > 0 ? Math.max((item.pct / max) * 100, 2) : 2;
  return (
    <div className="dora-cfr-row">
      <div className="dora-cfr-row__header">
        <span className="dora-cfr-row__name" title={item.name}>{item.name}</span>
        <span className={`dora-cfr-row__badge dora-cfr-row__badge--${item.tier}`}>
          {fmt(item.pct)}%
        </span>
      </div>
      <div className="dora-cfr-row__track">
        <div
          className={`dora-cfr-row__fill dora-cfr-row__fill--${item.tier}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── MTTR row ────────────────────────────────────────────────────────────────

interface MttrRowItem {
  name: string;
  hours: number;
  tier: DoraTier;
}

function MttrRow({ item, max }: { item: MttrRowItem; max: number }) {
  const pct = max > 0 ? Math.max((item.hours / max) * 100, 2) : 2;
  const label = item.hours >= 24
    ? `${fmt(item.hours / 24, 1)}d`
    : `${fmt(item.hours)}h`;
  return (
    <div className="dora-mttr-row">
      <span className="dora-mttr-row__name" title={item.name}>{item.name}</span>
      <div className="dora-mttr-row__bar-track">
        <div
          className={`dora-mttr-row__bar-fill dora-mttr-row__bar-fill--${item.tier}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="dora-mttr-row__val">{label}</span>
    </div>
  );
}

// ─── Lead Time chart ─────────────────────────────────────────────────────────

interface LtChartItem {
  name: string;
  hours: number;
}

function LtChart({ items }: { items: LtChartItem[] }) {
  if (items.length === 0) {
    return <div style={{ color: 'var(--dd-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>No data</div>;
  }

  const maxVal = Math.max(...items.map(i => i.hours), 0.001);
  // Compute nice x-axis ticks
  const tickCount = 5;
  const tickStep = Math.ceil(maxVal / tickCount / 10) * 10 || 10;
  const ticks: number[] = [];
  for (let t = 0; t <= maxVal + tickStep; t += tickStep) {
    ticks.push(t);
    if (ticks.length > tickCount + 1) break;
  }

  return (
    <div className="dora-lt-chart">
      <div className="dora-lt-chart__rows">
        {items.map((item, idx) => {
          const barPct = Math.max((item.hours / (ticks[ticks.length - 1] || maxVal)) * 100, 1);
          const label = item.hours >= 24
            ? `${fmt(item.hours / 24, 1)}d`
            : `${fmt(item.hours)}h`;
          return (
            <div key={idx} className="dora-lt-row">
              <span className="dora-lt-row__name" title={item.name}>{item.name}</span>
              <div className="dora-lt-row__bar-area">
                {/* Gridlines */}
                {ticks.slice(1).map(t => (
                  <div
                    key={t}
                    className="dora-lt-row__gridline"
                    style={{ left: `${(t / (ticks[ticks.length - 1] || maxVal)) * 100}%` }}
                  />
                ))}
                <div
                  className="dora-lt-row__bar"
                  style={{ width: `${barPct}%` }}
                />
              </div>
              <span className="dora-lt-row__val">{label}</span>
            </div>
          );
        })}
      </div>
      {/* X-axis */}
      <div className="dora-lt-xaxis">
        <div className="dora-lt-xaxis__inner">
          {ticks.map(t => (
            <span
              key={t}
              className="dora-lt-xaxis__tick"
              style={{ left: `${(t / (ticks[ticks.length - 1] || maxVal)) * 100}%` }}
            >
              {t}h
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CFR Vertical Bar Chart ──────────────────────────────────────────────────

interface CfrVBarItem {
  name: string;
  pct: number;
  tier: DoraTier;
}

function CfrVBarChart({ items }: { items: CfrVBarItem[] }) {
  if (items.length === 0) {
    return <div style={{ color: 'var(--dd-muted)', fontSize: '0.82rem', fontStyle: 'italic' }}>No data</div>;
  }

  const maxVal = Math.max(...items.map(i => i.pct), 0.001);
  // Nice y-axis ticks
  const yTickStep = maxVal <= 2 ? 0.5 : maxVal <= 6 ? 1 : maxVal <= 10 ? 2 : 5;
  const yTicks: number[] = [];
  for (let t = 0; t <= maxVal + yTickStep; t += yTickStep) {
    yTicks.push(parseFloat(t.toFixed(2)));
    if (yTicks.length > 8) break;
  }
  const yMax = yTicks[yTicks.length - 1] || maxVal;

  const TIERS: DoraTier[] = ['Elite', 'High', 'Medium', 'Low'];
  const TIER_LABELS: Record<DoraTier, string> = {
    Elite:  'Elite (<1%)',
    High:   'High (1–2%)',
    Medium: 'Medium (2–5%)',
    Low:    'Needs improvement (>5%)',
  };

  return (
    <div>
      {/* Legend */}
      <div className="dora-legend-row" style={{ marginBottom: 16 }}>
        {TIERS.map(t => (
          <div key={t} className="dora-legend-row__item">
            <span className="dora-legend-row__swatch" style={{ background: TIER_COLOURS[t] }} />
            <span className="dora-legend-row__label">{TIER_LABELS[t]}</span>
          </div>
        ))}
      </div>

      <div className="dora-cfr-vbar">
        {/* Y-axis */}
        <div className="dora-cfr-vbar__yaxis">
          {yTicks.map(t => (
            <span key={t} className="dora-cfr-vbar__ylabel">{t}%</span>
          ))}
        </div>

        {/* Chart area */}
        <div className="dora-cfr-vbar__chart-area">
          <div className="dora-cfr-vbar__plot">
            {/* Horizontal gridlines */}
            {yTicks.map(t => (
              <div
                key={t}
                className="dora-cfr-vbar__gridline"
                style={{ bottom: `${(t / yMax) * 100}%` }}
              />
            ))}
            {/* Bars */}
            {items.map((item, idx) => {
              const heightPct = Math.max((item.pct / yMax) * 100, 1);
              return (
                <div key={idx} className="dora-cfr-vbar__col">
                  <div
                    className="dora-cfr-vbar__bar"
                    style={{
                      height: `${heightPct}%`,
                      background: tierColor(item.tier),
                    }}
                    title={`${item.name}: ${fmt(item.pct)}%`}
                  />
                </div>
              );
            })}
          </div>
          {/* X-axis labels */}
          <div className="dora-cfr-vbar__xlabels">
            {items.map((item, idx) => (
              <span key={idx} className="dora-cfr-vbar__xlabel" title={item.name}>
                {item.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Line Chart (SVG) ────────────────────────────────────────────────────────

interface LineChartProps {
  points: MonthlyDataPoint[];
  color: string;
  unit: string;
  height?: number;
}

interface TooltipState {
  x: number;
  y: number;
  month: string;
  value: number;
}

function smoothPath(xs: number[], ys: number[]): string {
  if (xs.length === 0) return '';
  if (xs.length === 1) return `M ${xs[0]} ${ys[0]}`;

  let d = `M ${xs[0]} ${ys[0]}`;
  for (let i = 1; i < xs.length; i++) {
    const cp1x = xs[i - 1] + (xs[i] - xs[i - 1]) / 3;
    const cp1y = ys[i - 1];
    const cp2x = xs[i] - (xs[i] - xs[i - 1]) / 3;
    const cp2y = ys[i];
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${xs[i]} ${ys[i]}`;
  }
  return d;
}

function LineChart({ points, color, unit, height = 120 }: LineChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [hoverX, setHoverX] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 600;
  const H = height;
  const PAD_L = 8;
  const PAD_R = 8;
  const PAD_T = 12;
  const PAD_B = 36; // room for x labels

  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const minVal = Math.min(...points.map(p => p.value));
  const maxVal = Math.max(...points.map(p => p.value));
  const valRange = maxVal - minVal || 1;

  const toSvgX = (i: number) =>
    PAD_L + (points.length === 1 ? chartW / 2 : (i / (points.length - 1)) * chartW);
  const toSvgY = (v: number) =>
    PAD_T + chartH - ((v - minVal) / valRange) * chartH;

  const xs = points.map((_, i) => toSvgX(i));
  const ys = points.map(p => toSvgY(p.value));

  const linePath = smoothPath(xs, ys);
  const areaPath = points.length > 1
    ? `${linePath} L ${xs[xs.length - 1]} ${PAD_T + chartH} L ${xs[0]} ${PAD_T + chartH} Z`
    : '';

  // Gridlines at 4 evenly spaced values
  const gridValues = [0, 1, 2, 3].map(i => minVal + (valRange * i) / 3);

  // Label every Nth point
  const labelEvery = points.length > 8 ? Math.ceil(points.length / 8) : 1;

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const relX = svgX - PAD_L;
    const idx = Math.round((relX / chartW) * (points.length - 1));
    const clampedIdx = Math.max(0, Math.min(points.length - 1, idx));
    const px = xs[clampedIdx];
    const py = ys[clampedIdx];
    setHoverX(px);
    setTooltip({
      x: px,
      y: py,
      month: points[clampedIdx].month,
      value: points[clampedIdx].value,
    });
  }, [points, xs, ys, chartW]);

  const handleMouseLeave = useCallback(() => {
    setHoverX(null);
    setTooltip(null);
  }, []);

  if (points.length === 0) return null;

  return (
    <div className="dora-line-chart">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: 'block', overflow: 'visible' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Gridlines */}
        {gridValues.map((v, i) => {
          const gy = toSvgY(v);
          return (
            <line
              key={i}
              x1={PAD_L} y1={gy}
              x2={W - PAD_R} y2={gy}
              stroke="rgba(136,146,176,0.15)"
              strokeWidth={1}
            />
          );
        })}

        {/* Area fill */}
        {areaPath && (
          <path
            d={areaPath}
            fill={color}
            fillOpacity={0.15}
            strokeWidth={0}
          />
        )}

        {/* Line */}
        {points.length >= 2 && (
          <path
            d={linePath}
            fill="none"
            stroke={color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={xs[i]}
            cy={ys[i]}
            r={4}
            fill={color}
            opacity={hoverX === xs[i] ? 1 : 0.7}
          />
        ))}

        {/* X-axis labels */}
        {points.map((p, i) => {
          if (i % labelEvery !== 0 && i !== points.length - 1) return null;
          return (
            <text
              key={i}
              x={xs[i]}
              y={H - PAD_B + 14}
              fontSize={10}
              fill="rgba(136,146,176,0.7)"
              textAnchor="end"
              transform={`rotate(-40, ${xs[i]}, ${H - PAD_B + 14})`}
            >
              {p.month}
            </text>
          );
        })}

        {/* Hover vertical line */}
        {hoverX !== null && (
          <line
            x1={hoverX} y1={PAD_T}
            x2={hoverX} y2={PAD_T + chartH}
            stroke="rgba(136,146,176,0.4)"
            strokeWidth={1}
            strokeDasharray="4,3"
          />
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="dora-line-tooltip"
          style={{
            left: `${(tooltip.x / W) * 100}%`,
            top: `${(tooltip.y / H) * 100}%`,
          }}
        >
          <span className="dora-line-tooltip__month">{tooltip.month}</span>
          <span className="dora-line-tooltip__value">
            {tooltip.value.toFixed(1)}{unit}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Historical Trends section ────────────────────────────────────────────────

const TREND_ORDER: Array<'lt' | 'cfr' | 'mttr' | 'df'> = ['lt', 'cfr', 'mttr', 'df'];

function formatTrendValue(value: number, unit: string): string {
  if (unit === 'h') {
    return value >= 24 ? `${(value / 24).toFixed(1)}d` : `${value.toFixed(1)}h`;
  }
  return `${value.toFixed(1)}${unit}`;
}

function HistoricalTrendsSection({ trends }: { trends: HistoricalTrend[] }) {
  if (trends.length === 0) return null;

  const trendMap = new Map(trends.map(t => [t.metric, t]));
  const ordered = TREND_ORDER.map(m => trendMap.get(m)).filter((t): t is HistoricalTrend => !!t);

  if (ordered.length === 0) return null;

  return (
    <div className="dora-full-panel">
      <div className="dora-section-title">Historical Trends</div>
      <div className="dora-trends-grid">
        {ordered.map(trend => {
          const latestPoint = trend.points[trend.points.length - 1];
          const currentLabel = latestPoint ? formatTrendValue(latestPoint.value, trend.unit) : '';
          return (
            <div key={trend.metric} className="dora-trend-panel">
              <div className="dora-trend-panel__header">
                <span className="dora-trend-panel__title">{trend.label}</span>
                {currentLabel && (
                  <span
                    className="dora-trend-panel__current"
                    style={{ color: trend.color, borderColor: trend.color }}
                  >
                    {currentLabel}
                  </span>
                )}
              </div>
              <LineChart
                points={trend.points}
                color={trend.color}
                unit={trend.unit}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Filter bar ──────────────────────────────────────────────────────────────

const TIER_OPTIONS: Array<DoraTier | 'All'> = ['All', 'Elite', 'High', 'Medium', 'Low'];

function FilterBar({
  nameFilter,
  onNameChange,
  tierFilter,
  onTierChange,
}: {
  nameFilter: string;
  onNameChange: (v: string) => void;
  tierFilter: DoraTier | 'All';
  onTierChange: (v: DoraTier | 'All') => void;
}) {
  return (
    <div className="dora-filter-bar">
      <input
        className="dora-filter-bar__search"
        type="text"
        placeholder="Filter by name…"
        value={nameFilter}
        onChange={e => onNameChange(e.target.value)}
      />
      <div className="dora-filter-bar__tiers">
        {TIER_OPTIONS.map(t => (
          <button
            key={t}
            className={[
              'dora-filter-bar__tier',
              t !== 'All' ? `dora-filter-bar__tier--${t}` : '',
              tierFilter === t ? 'dora-filter-bar__tier--active' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => onTierChange(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function DoraDashboard() {
  const { params, theme } = usePortPluginData();
  const typedParams = (params ?? {}) as Params;

  const [nameFilter, setNameFilter] = useState('');
  const [tierFilter, setTierFilter] = useState<DoraTier | 'All'>('All');

  const cfg: DoraConfig = useMemo(() => ({
    dfBlueprint:   getBlueprintId(typedParams['dfBlueprint']?.value),
    ltBlueprint:   getBlueprintId(typedParams['ltBlueprint']?.value),
    cfrBlueprint:  getBlueprintId(typedParams['cfrBlueprint']?.value),
    mttrBlueprint: getBlueprintId(typedParams['mttrBlueprint']?.value),
    dfCountProp:   getStringParam(typedParams['dfCountProp']?.value,  'numberOfDeploys'),
    dfBucketProp:  getStringParam(typedParams['dfBucketProp']?.value, 'deploymentFrequencyBucket'),
    ltProp:        getStringParam(typedParams['ltProp']?.value,       'leadTimeForChangeHours'),
    cfrProp:       getStringParam(typedParams['cfrProp']?.value,      'changeFailureRate'),
    mttrProp:      getStringParam(typedParams['mttrProp']?.value,     'meanTimeToRecoveryHours'),
    periodProp:    getStringParam(typedParams['periodProp']?.value,   'period'),
  }), [typedParams]);

  const { summary, isLoading, isError, error } = useDoraDashboard(cfg, nameFilter);

  const hasAnyBlueprint =
    cfg.dfBlueprint || cfg.ltBlueprint || cfg.cfrBlueprint || cfg.mttrBlueprint;

  if (isLoading && hasAnyBlueprint) {
    return (
      <div className="dora-dashboard" data-theme={theme?.mode}>
        <div className="dora-dashboard__state">Loading DORA data…</div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="dora-dashboard" data-theme={theme?.mode}>
        <div className="dora-dashboard__state dora-dashboard__state--error">
          {error?.message ?? 'Failed to load DORA data'}
        </div>
      </div>
    );
  }

  const { df, lt, cfr, mttr, trends } = summary;

  // ── Deployment Frequency KPI tier ────────────────────────────────
  const dfTier: DoraTier | null = df
    ? dfBucketTier(
        df.bucketCounts['Daily'] >= df.bucketCounts['Weekly'] &&
        df.bucketCounts['Daily'] >= df.bucketCounts['Monthly'] &&
        df.bucketCounts['Daily'] >= df.bucketCounts['Yearly/rare']
          ? 'Daily'
          : df.bucketCounts['Weekly'] >= df.bucketCounts['Monthly'] &&
            df.bucketCounts['Weekly'] >= df.bucketCounts['Yearly/rare']
            ? 'Weekly'
            : df.bucketCounts['Monthly'] >= df.bucketCounts['Yearly/rare']
              ? 'Monthly'
              : 'Yearly/rare',
      )
    : null;

  // ── Donut slices ──────────────────────────────────────────────────
  const donutSlices: DonutSlice[] = df
    ? [
        { bucket: 'Daily' as DfBucket,        count: df.bucketCounts['Daily'] },
        { bucket: 'Weekly' as DfBucket,       count: df.bucketCounts['Weekly'] },
        { bucket: 'Monthly' as DfBucket,      count: df.bucketCounts['Monthly'] },
        { bucket: 'Yearly/rare' as DfBucket,  count: df.bucketCounts['Yearly/rare'] },
      ]
    : [];

  const byTier = tierFilter !== 'All';

  // ── Top performers ────────────────────────────────────────────────
  const topPerfItems: PerfRowItem[] = df
    ? df.topPerformers
        .filter(p => !byTier || dfBucketTier(p.bucket) === tierFilter)
        .map(p => ({ name: p.name, count: p.count, bucket: p.bucket }))
    : [];
  const topPerfMax = topPerfItems.length > 0
    ? Math.max(...topPerfItems.map(i => i.count))
    : 1;

  // ── CFR rows ─────────────────────────────────────────────────────
  const cfrRowItems: CfrRowItem[] = cfr
    ? cfr.byProduct
        .filter(p => !byTier || p.tier === tierFilter)
        .slice(0, 8)
        .map(p => ({ name: p.name, pct: p.pct, tier: p.tier }))
    : [];
  const cfrRowMax = cfrRowItems.length > 0
    ? Math.max(...cfrRowItems.map(i => i.pct))
    : 1;

  // ── MTTR rows ─────────────────────────────────────────────────────
  const mttrRowItems: MttrRowItem[] = mttr
    ? mttr.byProduct
        .filter(p => !byTier || p.tier === tierFilter)
        .slice(0, 7)
        .map(p => ({ name: p.name, hours: p.hours, tier: p.tier }))
    : [];
  const mttrRowMax = mttrRowItems.length > 0
    ? Math.max(...mttrRowItems.map(i => i.hours))
    : 1;

  // ── Lead time items (top 7) ───────────────────────────────────────
  const ltItems: LtChartItem[] = lt
    ? lt.byProduct
        .filter(p => !byTier || p.tier === tierFilter)
        .slice(0, 7)
        .map(p => ({ name: p.name, hours: p.hours }))
    : [];

  // ── CFR vertical chart (all products sorted ascending) ────────────
  const cfrVBarItems: CfrVBarItem[] = cfr
    ? [...cfr.byProduct]
        .filter(p => !byTier || p.tier === tierFilter)
        .sort((a, b) => a.pct - b.pct)
        .map(p => ({ name: p.name, pct: p.pct, tier: p.tier }))
    : [];

  const calcDate = new Date().toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="dora-dashboard" data-theme={theme?.mode}>

      {/* ── 0. FILTER BAR ───────────────────────────────────────────── */}
      <FilterBar
        nameFilter={nameFilter}
        onNameChange={setNameFilter}
        tierFilter={tierFilter}
        onTierChange={setTierFilter}
      />

      {/* ── 1. KPI ROW ──────────────────────────────────────────────── */}
      <div className="dora-kpi-row">

        {/* Deployment Frequency */}
        <div className="dora-kpi-card">
          <div className="dora-kpi-card__label">Deployment Frequency</div>
          {df ? (
            <>
              <div className="dora-kpi-card__value">
                {fmt(df.medianDeploysPerWeek, 1)}
                <span className="dora-kpi-card__value--unit">deploys/wk</span>
              </div>
              <div className="dora-kpi-card__subtitle">median across {df.totalAssets} services</div>
              <div className="dora-kpi-card__badges">
                {dfTier && <TierBadge tier={dfTier} />}
              </div>
            </>
          ) : (
            <NotConfigured label="Deployment Frequency" />
          )}
        </div>

        {/* Lead Time for Change */}
        <div className="dora-kpi-card">
          <div className="dora-kpi-card__label">Lead Time for Change</div>
          {lt ? (
            <>
              <div className="dora-kpi-card__value">
                {lt.medianHours >= 24
                  ? fmt(lt.medianHours / 24, 1)
                  : fmt(lt.medianHours)}
                <span className="dora-kpi-card__value--unit">
                  {lt.medianHours >= 24 ? 'd' : 'h'}
                </span>
              </div>
              <div className="dora-kpi-card__subtitle">median across prod deployments</div>
              <div className="dora-kpi-card__badges">
                <TierBadge tier={lt.tier} />
              </div>
            </>
          ) : (
            <NotConfigured label="Lead Time" />
          )}
        </div>

        {/* MTTR */}
        <div className="dora-kpi-card">
          <div className="dora-kpi-card__label">Mean Time to Recovery</div>
          {mttr ? (
            <>
              <div className="dora-kpi-card__value">
                {mttr.averageHours >= 24
                  ? fmt(mttr.averageHours / 24, 1)
                  : fmt(mttr.averageHours)}
                <span className="dora-kpi-card__value--unit">
                  {mttr.averageHours >= 24 ? 'd' : 'h'}
                </span>
              </div>
              <div className="dora-kpi-card__subtitle">avg across products</div>
              <div className="dora-kpi-card__badges">
                <TierBadge tier={mttr.tier} />
              </div>
            </>
          ) : (
            <NotConfigured label="MTTR" />
          )}
        </div>

        {/* CFR */}
        <div className="dora-kpi-card">
          <div className="dora-kpi-card__label">Change Failure Rate</div>
          {cfr ? (
            <>
              <div className="dora-kpi-card__value">
                {fmt(cfr.averagePct)}
                <span className="dora-kpi-card__value--unit">%</span>
              </div>
              <div className="dora-kpi-card__subtitle">avg across products</div>
              <div className="dora-kpi-card__badges">
                <TierBadge tier={cfr.tier} />
              </div>
            </>
          ) : (
            <NotConfigured label="Change Failure Rate" />
          )}
        </div>

      </div>

      {/* ── 2. DF DONUT + TOP PERFORMERS ─────────────────────────────── */}
      <div className="dora-two-col">

        {/* Bucket bar chart panel */}
        <div className={`dora-panel${!df ? ' dora-panel--unconfigured' : ''}`}>
          <div className="dora-section-title">Deployment Frequency — By Bucket</div>
          {df ? (
            <BucketBarChart slices={donutSlices} total={df.totalAssets} />
          ) : (
            'Deployment Frequency blueprint not configured'
          )}
        </div>

        {/* Top performers */}
        <div className={`dora-panel${!df ? ' dora-panel--unconfigured' : ''}`}>
          <div className="dora-section-title">Top Performers — Deployment Frequency</div>
          {df ? (
            <div className="dora-perf-list">
              {topPerfItems.map((item, idx) => (
                <PerfRow key={idx} item={item} max={topPerfMax} />
              ))}
            </div>
          ) : (
            'Deployment Frequency blueprint not configured'
          )}
        </div>

      </div>

      {/* ── 3. CFR BY PRODUCT + MTTR BY PRODUCT ─────────────────────── */}
      <div className="dora-two-col">

        {/* CFR by product */}
        <div className={`dora-panel${!cfr ? ' dora-panel--unconfigured' : ''}`}>
          <div className="dora-section-title">Change Failure Rate — By Product</div>
          {cfr ? (
            <div className="dora-cfr-list">
              {cfrRowItems.map((item, idx) => (
                <CfrRow key={idx} item={item} max={cfrRowMax} />
              ))}
            </div>
          ) : (
            'Change Failure Rate blueprint not configured'
          )}
        </div>

        {/* MTTR by product */}
        <div className={`dora-panel${!mttr ? ' dora-panel--unconfigured' : ''}`}>
          <div className="dora-section-title">MTTR — Products with Highest Recovery Time</div>
          {mttr ? (
            <div className="dora-mttr-list">
              {mttrRowItems.map((item, idx) => (
                <MttrRow key={idx} item={item} max={mttrRowMax} />
              ))}
            </div>
          ) : (
            'MTTR blueprint not configured'
          )}
        </div>

      </div>

      {/* ── 4. HISTORICAL TRENDS (full width, 2×2 grid) ─────────────── */}
      <HistoricalTrendsSection trends={trends} />

      {/* ── 6. LEAD TIME DISTRIBUTION (full width) ──────────────────── */}
      <div className={`dora-full-panel${!lt ? ' dora-full-panel--unconfigured' : ''}`}>
        <div className="dora-section-title">
          Lead Time Distribution — Production Deployments (Hours)
        </div>
        {lt ? (
          <>
            <div className="dora-legend-row">
              <div className="dora-legend-row__item">
                <span className="dora-legend-row__swatch" style={{ background: 'var(--dd-accent)' }} />
                <span className="dora-legend-row__label">Lead time hours per deployment</span>
              </div>
            </div>
            <LtChart items={ltItems} />
          </>
        ) : (
          'Lead Time blueprint not configured'
        )}
      </div>

      {/* ── 7. CFR DISTRIBUTION (vertical, full width) ──────────────── */}
      <div className={`dora-full-panel${!cfr ? ' dora-full-panel--unconfigured' : ''}`}>
        <div className="dora-section-title">CFR Distribution Across Products (%)</div>
        {cfr ? (
          <CfrVBarChart items={cfrVBarItems} />
        ) : (
          'Change Failure Rate blueprint not configured'
        )}
      </div>

      {/* ── 8. FOOTER ────────────────────────────────────────────────── */}
      <div className="dora-footer">
        Data from Port · Calculated {calcDate}
      </div>

    </div>
  );
}
