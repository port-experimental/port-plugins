export type DoraTier = 'Elite' | 'High' | 'Medium' | 'Low';

export type DfBucket = 'Daily' | 'Weekly' | 'Monthly' | 'Yearly/rare';

export interface DoraConfig {
  dfBlueprint: string | null;
  ltBlueprint: string | null;
  cfrBlueprint: string | null;
  mttrBlueprint: string | null;
  dfCountProp: string;
  dfBucketProp: string;
  ltProp: string;
  cfrProp: string;
  mttrProp: string;
  periodProp: string;
}

export interface MonthlyDataPoint {
  month: string;      // "Jan 2025", "Feb 2025", etc. — for display
  timestamp: number;  // for sorting
  value: number;      // the metric value (avg/median for that month)
}

export interface HistoricalTrend {
  metric: 'df' | 'lt' | 'cfr' | 'mttr';
  label: string;          // e.g. "Lead Time for Change"
  unit: string;           // e.g. "h", "%", "deploys/day"
  color: string;          // line color
  points: MonthlyDataPoint[];
  tier: DoraTier;
}

export interface DeployFrequencyData {
  totalAssets: number;
  medianDeploysPerWeek: number;
  dailyPerformers: number;
  bucketCounts: Record<DfBucket, number>;
  topPerformers: Array<{ name: string; count: number; bucket: DfBucket }>;
}

export interface LeadTimeData {
  medianHours: number;
  tier: DoraTier;
  byProduct: Array<{ name: string; hours: number; tier: DoraTier }>;
}

export interface CfrData {
  averagePct: number;
  tier: DoraTier;
  byProduct: Array<{ name: string; pct: number; tier: DoraTier }>;
}

export interface MttrData {
  averageHours: number;
  tier: DoraTier;
  byProduct: Array<{ name: string; hours: number; tier: DoraTier }>;
}

export interface DoraSummary {
  df: DeployFrequencyData | null;
  lt: LeadTimeData | null;
  cfr: CfrData | null;
  mttr: MttrData | null;
  trends: HistoricalTrend[];
}
