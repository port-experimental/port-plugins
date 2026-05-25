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

export type ScorecardRule = {
  identifier: string;
  title?: string;
  level?: string;
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
};

export type EntityGapSummary = {
  identifier: string;
  title: string;
  failedRules: FailedRuleInfo[];
};
