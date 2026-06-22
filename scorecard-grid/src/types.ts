export interface Rule {
  identifier: string;
  title: string;
  description: string;
  level: string;
}

/**
 * A level from the Port scorecard definition.
 * rank 0 = lowest tier (most critical), rank n-1 = highest tier (best health).
 */
export interface ScorecardLevel {
  title: string;
  color: string;
  hex: string;
  rank: number;
}

/** One counter badge shown on a cube and in the detail-panel stat cards. */
export interface CounterConfig {
  emoji: string;
  label: string;
  property: string;
}

/**
 * One drill-down section in the detail panel.
 * The "relatedTo" filter for the selected entity is always injected automatically.
 * Index i maps to counters[i].
 */
export interface DrillDownConfig {
  label: string;
  blueprint: string;
  query: {
    combinator: "and" | "or";
    rules: Array<Record<string, unknown>>;
  };
  include?: string[];
}

export interface Entity {
  id: string;
  title: string;
  level: string;
  portIcon: string | null;
  /** Value of the property chosen via the iconProperty param, used as the icon lookup key. */
  iconValue: string | null;
  counters: Array<{ emoji: string; label: string; value: number }>;
  component: string | null;
  rules: Record<string, boolean>;
}

export interface WorkItem {
  id: string;
  title: string;
  url: string;
  properties: Record<string, unknown>;
}

/** Values come from upload-params.json — read via sdk.params in usePluginData. */
export interface PluginConfig {
  blueprintIdentifier: string;
  scorecardIdentifier: string;
  pollIntervalSeconds: number;
  counters: CounterConfig[];
  drillDown: DrillDownConfig[];
  /** Optional property key whose value is used as the icon lookup key instead of the entity's Port icon. */
  iconProperty?: string;
}
