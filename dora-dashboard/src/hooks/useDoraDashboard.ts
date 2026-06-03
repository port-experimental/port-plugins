import { useMemo } from 'react';
import { useEntities } from './useEntities';
import { Entity } from '../types';
import {
  DoraConfig,
  DoraSummary,
  DoraTier,
  DfBucket,
  DeployFrequencyData,
  LeadTimeData,
  CfrData,
  MttrData,
  MonthlyDataPoint,
  HistoricalTrend,
} from '../components/DoraDashboard/types';

// ─── Tier helpers ────────────────────────────────────────────────────────────

export function dfBucketTier(bucket: DfBucket): DoraTier {
  switch (bucket) {
    case 'Daily':       return 'Elite';
    case 'Weekly':      return 'High';
    case 'Monthly':     return 'Medium';
    case 'Yearly/rare': return 'Low';
  }
}

export function ltTier(hours: number): DoraTier {
  if (hours < 1)   return 'Elite';
  if (hours < 24)  return 'High';
  if (hours < 168) return 'Medium';
  return 'Low';
}

export function cfrTier(pct: number): DoraTier {
  if (pct < 1) return 'Elite';
  if (pct < 2) return 'High';
  if (pct < 5) return 'Medium';
  return 'Low';
}

export function mttrTier(hours: number): DoraTier {
  if (hours < 1)   return 'Elite';
  if (hours < 24)  return 'High';
  if (hours < 168) return 'Medium';
  return 'Low';
}

// ─── Bucket normalisation ────────────────────────────────────────────────────

function normaliseBucket(raw: unknown): DfBucket {
  const s = String(raw ?? '').toLowerCase().trim();
  // DORA tier strings (from Port's deployment frequency entities)
  if (s === 'elite')  return 'Daily';
  if (s === 'high')   return 'Weekly';
  if (s === 'medium') return 'Monthly';
  if (s === 'low')    return 'Yearly/rare';
  // Fallback: free-text matching
  if (s.includes('daily') || s.includes('elite'))    return 'Daily';
  if (s.includes('weekly') || s.includes('high'))    return 'Weekly';
  if (s.includes('monthly') || s.includes('medium')) return 'Monthly';
  return 'Yearly/rare';
}

// ─── Median helper ───────────────────────────────────────────────────────────

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function avg(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function entityName(e: Entity): string {
  return e.title || e.identifier;
}

// ─── Date extraction ─────────────────────────────────────────────────────────

const MONTH_NAMES: Record<string, number> = {
  jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
  jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  january: 0, february: 1, march: 2, april: 3, june: 5,
  july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
};

export function parseEntityDate(entity: Entity, periodProp: string): Date | null {
  // Priority 1: configurable period property
  const periodVal = entity.properties[periodProp];
  if (periodVal) {
    const d = new Date(String(periodVal));
    if (!isNaN(d.getTime())) return d;
  }

  // Priority 2: parse "Mon YYYY" or "Month YYYY" from title
  const titleMatch = String(entity.title ?? '').match(/([A-Za-z]{3,9})\s+(20\d{2})/);
  if (titleMatch) {
    const monthKey = titleMatch[1].toLowerCase();
    const year = parseInt(titleMatch[2], 10);
    const monthIdx = MONTH_NAMES[monthKey];
    if (monthIdx !== undefined) {
      return new Date(year, monthIdx, 1);
    }
  }

  // Priority 3: createdAt
  if (entity.createdAt) {
    const d = new Date(entity.createdAt);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

function toMonthKey(d: Date): string {
  const monthAbbrs = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `${monthAbbrs[d.getMonth()]} ${d.getFullYear()}`;
}

// ─── Trend processors ────────────────────────────────────────────────────────

function buildTrend(
  entities: Entity[],
  metric: 'df' | 'lt' | 'cfr' | 'mttr',
  label: string,
  unit: string,
  color: string,
  periodProp: string,
  valueFn: (e: Entity) => number,
  aggregateFn: (values: number[]) => number,
  tierFn: (v: number) => DoraTier,
): HistoricalTrend | null {
  if (entities.length === 0) return null;

  // Group by month
  const monthMap: Map<string, { timestamp: number; values: number[] }> = new Map();

  for (const e of entities) {
    const date = parseEntityDate(e, periodProp);
    if (!date) continue;

    const v = valueFn(e);
    if (!isFinite(v) || isNaN(v) || v === 0) continue;

    const key = toMonthKey(date);
    const ts  = new Date(date.getFullYear(), date.getMonth(), 1).getTime();

    if (!monthMap.has(key)) {
      monthMap.set(key, { timestamp: ts, values: [] });
    }
    monthMap.get(key)!.values.push(v);
  }

  if (monthMap.size < 2) return null;

  const points: MonthlyDataPoint[] = Array.from(monthMap.entries())
    .map(([month, { timestamp, values }]) => ({
      month,
      timestamp,
      value: aggregateFn(values),
    }))
    .filter(p => isFinite(p.value) && !isNaN(p.value) && p.value !== 0)
    .sort((a, b) => a.timestamp - b.timestamp);

  if (points.length < 2) return null;

  const latestValue = points[points.length - 1].value;
  return { metric, label, unit, color, points, tier: tierFn(latestValue) };
}

// ─── Processors ─────────────────────────────────────────────────────────────

function processDF(entities: Entity[], cfg: DoraConfig): DeployFrequencyData {
  const bucketCounts: Record<DfBucket, number> = {
    Daily: 0,
    Weekly: 0,
    Monthly: 0,
    'Yearly/rare': 0,
  };

  const performers: Array<{ name: string; count: number; bucket: DfBucket }> = [];
  const deployCounts: number[] = [];

  for (const e of entities) {
    const rawBucket = e.properties[cfg.dfBucketProp];
    const bucket    = normaliseBucket(rawBucket);
    bucketCounts[bucket]++;

    const rawCount = e.properties[cfg.dfCountProp];
    const count    = typeof rawCount === 'number' ? rawCount : parseFloat(String(rawCount ?? '')) || 0;
    performers.push({ name: entityName(e), count, bucket });
    if (count > 0) deployCounts.push(count);
  }

  performers.sort((a, b) => b.count - a.count);

  return {
    totalAssets:          entities.length,
    medianDeploysPerWeek: median(deployCounts),
    dailyPerformers:      bucketCounts['Daily'],
    bucketCounts,
    topPerformers:        performers.slice(0, 6),
  };
}

function processLT(entities: Entity[], cfg: DoraConfig): LeadTimeData {
  const byProduct = entities.map(e => {
    const rawHours = e.properties[cfg.ltProp];
    const hours    = typeof rawHours === 'number' ? rawHours : parseFloat(rawHours ?? '0') || 0;
    return { name: entityName(e), hours, tier: ltTier(hours) };
  });

  byProduct.sort((a, b) => b.hours - a.hours);

  const med  = median(byProduct.map(p => p.hours));
  return { medianHours: med, tier: ltTier(med), byProduct };
}

function processCFR(entities: Entity[], cfg: DoraConfig): CfrData {
  const byProduct = entities.map(e => {
    const rawPct = e.properties[cfg.cfrProp];
    const pct    = typeof rawPct === 'number' ? rawPct : parseFloat(rawPct ?? '0') || 0;
    return { name: entityName(e), pct, tier: cfrTier(pct) };
  });

  // Sort worst to best
  byProduct.sort((a, b) => b.pct - a.pct);

  const mean = avg(byProduct.map(p => p.pct));
  return { averagePct: mean, tier: cfrTier(mean), byProduct };
}

function processMTTR(entities: Entity[], cfg: DoraConfig): MttrData {
  const byProduct = entities.map(e => {
    const rawHours = e.properties[cfg.mttrProp];
    const hours    = typeof rawHours === 'number' ? rawHours : parseFloat(rawHours ?? '0') || 0;
    return { name: entityName(e), hours, tier: mttrTier(hours) };
  });

  byProduct.sort((a, b) => b.hours - a.hours);

  const mean = avg(byProduct.map(p => p.hours));
  return { averageHours: mean, tier: mttrTier(mean), byProduct };
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDoraDashboard(cfg: DoraConfig, nameFilter = ''): {
  summary: DoraSummary;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
} {
  const blueprintIds = useMemo(
    () => [cfg.dfBlueprint, cfg.ltBlueprint, cfg.cfrBlueprint, cfg.mttrBlueprint].filter(
      (id): id is string => !!id,
    ),
    [cfg.dfBlueprint, cfg.ltBlueprint, cfg.cfrBlueprint, cfg.mttrBlueprint],
  );

  const { data: allEntities, isLoading, isError, error } = useEntities(blueprintIds);

  const summary = useMemo<DoraSummary>(() => {
    const entities = allEntities ?? [];

    const needle = nameFilter.trim().toLowerCase();
    const nameMatch = needle
      ? (e: Entity) => entityName(e).toLowerCase().includes(needle)
      : () => true;

    const dfEntities   = cfg.dfBlueprint   ? entities.filter(e => e.blueprint === cfg.dfBlueprint   && nameMatch(e)) : [];
    const ltEntities   = cfg.ltBlueprint   ? entities.filter(e => e.blueprint === cfg.ltBlueprint   && nameMatch(e)) : [];
    const cfrEntities  = cfg.cfrBlueprint  ? entities.filter(e => e.blueprint === cfg.cfrBlueprint  && nameMatch(e)) : [];
    const mttrEntities = cfg.mttrBlueprint ? entities.filter(e => e.blueprint === cfg.mttrBlueprint && nameMatch(e)) : [];

    // ── Trend processing ──────────────────────────────────────────
    const periodProp = cfg.periodProp ?? 'period';

    const rawTrends: Array<HistoricalTrend | null> = [
      cfg.ltBlueprint
        ? buildTrend(
            ltEntities,
            'lt',
            'Lead Time for Change',
            'h',
            '#3860be',
            periodProp,
            e => {
              const v = e.properties[cfg.ltProp];
              return typeof v === 'number' ? v : parseFloat(v ?? '0') || 0;
            },
            median,
            ltTier,
          )
        : null,
      cfg.cfrBlueprint
        ? buildTrend(
            cfrEntities,
            'cfr',
            'Change Failure Rate',
            '%',
            '#dc2a2a',
            periodProp,
            e => {
              const v = e.properties[cfg.cfrProp];
              return typeof v === 'number' ? v : parseFloat(v ?? '0') || 0;
            },
            avg,
            cfrTier,
          )
        : null,
      cfg.mttrBlueprint
        ? buildTrend(
            mttrEntities,
            'mttr',
            'Mean Time to Recovery',
            'h',
            '#d97706',
            periodProp,
            e => {
              const v = e.properties[cfg.mttrProp];
              return typeof v === 'number' ? v : parseFloat(v ?? '0') || 0;
            },
            avg,
            mttrTier,
          )
        : null,
      cfg.dfBlueprint
        ? buildTrend(
            dfEntities,
            'df',
            'Deployment Frequency',
            'deploys/day',
            '#22c55e',
            periodProp,
            e => {
              const v = e.properties[cfg.dfCountProp];
              return typeof v === 'number' ? v : parseFloat(v ?? '0') || 0;
            },
            avg,
            () => 'Elite',
          )
        : null,
    ];

    const trends: HistoricalTrend[] = rawTrends.filter((t): t is HistoricalTrend => t !== null);

    return {
      df:   cfg.dfBlueprint   ? processDF(dfEntities, cfg)     : null,
      lt:   cfg.ltBlueprint   ? processLT(ltEntities, cfg)     : null,
      cfr:  cfg.cfrBlueprint  ? processCFR(cfrEntities, cfg)   : null,
      mttr: cfg.mttrBlueprint ? processMTTR(mttrEntities, cfg) : null,
      trends,
    };
  }, [allEntities, cfg, nameFilter]);

  return {
    summary,
    isLoading,
    isError,
    error: error as Error | null,
  };
}
