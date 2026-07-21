import type {
  AggregationMode,
  BreakdownDimension,
  BreakdownMetric,
  DateRange,
  Granularity,
  TabKey,
} from "../types";
// Granularity is used in WidgetSettings — keep the import above.
import { presetRange } from "./aggregations";

// Bump version when the shape changes so stale stored data is ignored.
const KEY = "port_ai_adoption_view_v3";

/** Per-widget granularity and aggregation overrides. */
export type WidgetSettings = {
  // Adoption tab
  granActiveUsers: Granularity;
  aggActiveUsers: AggregationMode;
  granActiveSurface: Granularity;
  aggActiveSurface: AggregationMode;
  granStickiness: Granularity;
  aggStickiness: AggregationMode;
  // Usage tab
  granSuggestions: Granularity;
  granAcceptance: Granularity;
  aggAcceptance: AggregationMode;
  granLoc: Granularity;
  granPrActivity: Granularity;
  granCycleTime: Granularity;
  aggCycleTime: AggregationMode;
  granDimTrend: Granularity;
};

export function defaultWidgetSettings(g: Granularity): WidgetSettings {
  return {
    granActiveUsers: g, aggActiveUsers: "avg",
    granActiveSurface: g, aggActiveSurface: "avg",
    granStickiness: g, aggStickiness: "avg",
    granSuggestions: g,
    granAcceptance: g, aggAcceptance: "avg",
    granLoc: g,
    granPrActivity: g,
    granCycleTime: g, aggCycleTime: "avg",
    granDimTrend: g,
  };
}

/** The slice of filter state we remember across reloads (a "saved view"). */
export type PersistedView = {
  tab: TabKey;
  preset: number | null;
  range: DateRange;
  dimension: BreakdownDimension;
  metric: BreakdownMetric;
  /** Selected org ID; null = all orgs. */
  selectedOrg: string | null;
  widgetSettings: WidgetSettings;
};

function hydrate(v: Partial<PersistedView>): Partial<PersistedView> {
  if (typeof v.preset === "number") v.range = presetRange(v.preset);
  return v;
}

export function loadView(): Partial<PersistedView> | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return hydrate(JSON.parse(raw) as Partial<PersistedView>);
  } catch {
    return null;
  }
}

export function saveView(v: PersistedView): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* storage unavailable — non-fatal */
  }
}

/** Canonical key for dirty comparison — excludes range when preset is set.
 *  Tab is intentionally excluded: switching tabs is navigation, not a view change. */
export function viewKey(v: Partial<PersistedView>): string {
  return JSON.stringify({
    preset: v.preset,
    range: v.preset == null ? v.range : null,
    dimension: v.dimension,
    metric: v.metric,
    selectedOrg: v.selectedOrg,
    widgetSettings: v.widgetSettings,
  });
}
