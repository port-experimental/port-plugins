// ───────────────────────────────────────────────────────────────────────────
// Host bridge types (from PLUGIN_DATA) - see plugin-architecture.md
// ───────────────────────────────────────────────────────────────────────────

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

/** Value Port sends for a `type: "blueprint"` param (object) - or a plain id string. */
export type BlueprintParam = { identifier: string; title?: string } & Record<
  string,
  unknown
>;

export type Entity = {
  identifier: string;
  title?: string;
  icon?: string;
  team?: string;
  blueprint?: string;
  createdAt?: string;
  updatedAt?: string;
  properties?: Record<string, unknown>;
  relations?: Record<string, unknown>;
  relationsObjects?: Record<string, unknown>;
};

export type ParamValue = {
  type?: string;
  value?: unknown;
};

export type Params = Record<string, ParamValue>;

/** Derived from upload-params.json. */
export type PluginConfig = {
  /** Blueprint where submissions are written. Required - cannot be inferred. */
  responseBlueprint: BlueprintParam;
  /** Blueprint that holds survey definitions. Only needed in dashboard mode. */
  surveyBlueprint?: BlueprintParam | null;
};

// ───────────────────────────────────────────────────────────────────────────
// Survey definition - the abstraction. A survey is fully described by data, so
// the type, dimensions, questions and scales can change without code changes.
// ───────────────────────────────────────────────────────────────────────────

export type QuestionType =
  | "likert" // scored rating on a numeric scale (default 1–5)
  | "single_choice" // one option; optional per-choice score
  | "multi_choice" // many options (unscored by default)
  | "boolean" // yes / no
  | "nps" // 0–10 recommendation score (eNPS)
  | "text"; // free text (unscored)

export type Scale = {
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
};

export type Choice = {
  value: string;
  label: string;
  /** Abbreviated label for compact distribution display (e.g. "Daily", "<1h"). Falls back to label. */
  shortLabel?: string;
  /** Optional 0..1-normalizable score; when omitted a single_choice is unscored. */
  score?: number;
};

/**
 * Links a question to an external benchmark metric (consumed by the analytics
 * "Benchmark" view). `source` is the benchmark dataset id (e.g. "dora-2025"),
 * `metric` the key within it. The question's choice `value`s must match the
 * benchmark's level keys so team answers join to the reference distribution.
 */
export type QuestionBenchmark = {
  source: string;
  metric: string;
};

export type Question = {
  id: string;
  text: string;
  type: QuestionType;
  /** Links the answer to a Dimension.id for scoring/aggregation. */
  dimension?: string;
  required?: boolean;
  /** Reverse-code a likert item (e.g. "I feel exhausted"). */
  reverse?: boolean;
  helpText?: string;
  /** Per-question scale; falls back to the survey default scale. */
  scale?: Scale;
  choices?: Choice[];
  /** Optional external benchmark this question can be compared against. */
  benchmark?: QuestionBenchmark;
};

export type Dimension = {
  id: string;
  name: string;
  description?: string;
  /** Hex color used for the dimension's score meter. */
  color?: string;
};

export type SurveyDefinition = {
  id: string;
  title: string;
  description?: string;
  framework?: string;
  version?: string;
  anonymous?: boolean;
  /** Default likert scale applied to questions that do not define their own. */
  scale?: Scale;
  dimensions: Dimension[];
  questions: Question[];
};

// ───────────────────────────────────────────────────────────────────────────
// Answers & responses
// ───────────────────────────────────────────────────────────────────────────

export type AnswerValue = number | string | string[] | boolean | null;
export type Answers = Record<string, AnswerValue>;

/** Computed scores for a single submission. */
export type ScoreResult = {
  /** dimensionId -> normalized 0..100 (null when no scorable answers). */
  dimensionScores: Record<string, number>;
  /** Mean of dimension scores, 0..100. */
  overallScore: number | null;
};

/** A surveyResponse entity as read back from Port for the results view. */
export type SurveyResponseRecord = {
  identifier: string;
  respondent?: string;
  submittedAt?: string;
  dimensionScores?: Record<string, number>;
  overallScore?: number;
};
