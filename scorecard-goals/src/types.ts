export type Page = {
  identifier?: string;
  pageFilters?: unknown;
};

export type User = {
  firstName?: string;
  lastName?: string;
  email?: string;
  picture?: string;
};

export type ScorecardRuleCondition = {
  property?: string;
  operator?: string;
  value?: unknown;
};

export type ScorecardRuleQuery = {
  combinator?: string;
  conditions?: ScorecardRuleCondition[];
};

export type ScorecardRule = {
  identifier: string;
  title?: string;
  level?: string;
  description?: string;
  query?: ScorecardRuleQuery;
};

export type Scorecard = {
  identifier: string;
  title: string;
  rules: ScorecardRule[];
};

export type ScorecardRuleResult = {
  identifier: string;
  level?: string;
  status?: string | boolean;
  message?: string;
  reason?: string;
  statusMessage?: string;
  failureMessage?: string;
  failureReason?: string;
  description?: string;
};

export type EntityScorecardEvaluation = {
  level?: string;
  rules?: ScorecardRuleResult[];
};

export type PortEntity = {
  identifier: string;
  title?: string;
  blueprint?: string;
  scorecards?: Record<string, EntityScorecardEvaluation>;
};

/** Alias for host PLUGIN_DATA.entity */
export type Entity = PortEntity;

export type ParamValue = {
  type?: string;
  value?: unknown;
};

export type Params = Record<string, ParamValue>;

export type BlueprintParam = {
  identifier: string;
  title: string;
};

export type PluginConfig = {
  blueprint: BlueprintParam;
};

export type ScorecardComplianceRow = {
  scorecardIdentifier: string;
  scorecardTitle: string;
  ruleCount: number;
  totalEntities: number;
  passedEntities: number;
  passPercent: number;
};

export type FailedRuleInfo = {
  ruleIdentifier: string;
  ruleTitle: string;
  scorecardIdentifier: string;
  scorecardTitle: string;
  failureReason: string;
};

export type EntityGapSummary = {
  identifier: string;
  title: string;
  failedRules: FailedRuleInfo[];
};
