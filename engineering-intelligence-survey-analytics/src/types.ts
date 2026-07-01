// ── Port host-bridge types ──────────────────────────────────────────────────

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

export type BlueprintParam = { identifier: string; title?: string } & Record<
  string,
  unknown
>;

export type Entity = {
  identifier: string;
  title?: string;
  icon?: string;
  /** Ownership "team" - Port returns this as an array of team identifiers. */
  team?: string[] | string;
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

export type PluginConfig = {
  surveyBlueprint: BlueprintParam;
  responseBlueprint: BlueprintParam;
};

// ── Survey definition ────────────────────────────────────────────────────────

export type QuestionType =
  | "likert"
  | "single_choice"
  | "multi_choice"
  | "boolean"
  | "nps"
  | "text";

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
  score?: number;
};

/**
 * Links a question to an external benchmark metric (consumed by the Benchmark
 * view). `source` is the benchmark dataset id (e.g. "dora-2025"), `metric` the
 * key within it. The question's choice `value`s must match the benchmark's
 * level keys so team answers join to the reference distribution.
 */
export type QuestionBenchmark = {
  source: string;
  metric: string;
};

export type Question = {
  id: string;
  text: string;
  type: QuestionType;
  dimension?: string;
  required?: boolean;
  reverse?: boolean;
  helpText?: string;
  scale?: Scale;
  choices?: Choice[];
  /** Optional external benchmark this question can be compared against. */
  benchmark?: QuestionBenchmark;
};

export type Dimension = {
  id: string;
  name: string;
  description?: string;
  color?: string;
};

export type SurveyDefinition = {
  id: string;
  title: string;
  description?: string;
  framework?: string;
  version?: string;
  anonymous?: boolean;
  scale?: Scale;
  dimensions: Dimension[];
  questions: Question[];
};

// ── Survey context (derived from entity) ────────────────────────────────────

export type SurveyMeta = {
  identifier: string;
  title: string;
  framework?: string;
  status?: string;
  createdAt?: string;
  publishedAt?: string;
  /** Eligible respondents per team, e.g. { platform: 8 }. Drives response rate. */
  targetRespondents?: Record<string, number>;
  definition: SurveyDefinition;
};

// ── Response record ──────────────────────────────────────────────────────────

export type AnswerValue = number | string | string[] | boolean | null;
export type Answers = Record<string, AnswerValue>;

/** Full response as read back from Port for analytics (includes team + raw answers). */
export type AnalyticsResponse = {
  identifier: string;
  respondent?: string;
  submittedAt?: string;
  team?: string;
  surveyId?: string;
  dimensionScores?: Record<string, number>;
  overallScore?: number;
  answers?: Answers;
};

// ── Aggregation output types ─────────────────────────────────────────────────

export type DimensionAgg = {
  id: string;
  name: string;
  color?: string;
  score: number | null;
  count: number;
};

export type QuestionAgg = {
  questionId: string;
  questionText: string;
  dimensionId?: string;
  dimensionName?: string;
  avgScore: number | null;
  count: number;
};

/** One bucket in a question's answer distribution. */
export type DistBucket = {
  label: string;
  /** Short label shown in the distribution bar (falls back to label). */
  shortLabel?: string;
  count: number;
  pct: number;
  /** Color tone by normalized "goodness" - green always means favorable.
   *  Five levels so that e.g. likert 4 and 5 render visually distinct. */
  tone: "very-low" | "low" | "mid" | "high" | "very-high";
};

export type QuestionDetail = QuestionAgg & {
  type: QuestionType;
  reverse?: boolean;
  buckets: DistBucket[];
};

/** One option's selection tally within a multi-select question. */
export type MultiChoiceOption = {
  value: string;
  label: string;
  shortLabel?: string;
  count: number;
  /** Share of respondents (who answered the question) that picked this option. */
  pct: number;
};

/** Per-question breakdown for an unscored multi-select question. */
export type MultiChoiceDetail = {
  questionId: string;
  questionText: string;
  dimensionName?: string;
  /** Respondents who selected at least one option for this question. */
  respondents: number;
  options: MultiChoiceOption[];
};

/** A team's row in the team × dimension heatmap. */
export type HeatmapRow = {
  team: string;
  count: number;
  overall: number | null;
  /** dimId -> score (null when below the anonymity floor or no data). */
  cells: Record<string, number | null>;
};

/** Per-team participation. */
export type ParticipationRow = {
  team: string;
  responses: number;
  target: number | null;
  rate: number | null;
};

/** One point on the over-time trend (one per survey, chronological). */
export type TrendPoint = {
  surveyId: string;
  /** Survey title, shown in the point tooltip. */
  title?: string;
  label: string;
  createdAt?: string;
  publishedAt?: string;
  count: number;
  overall: number | null;
  dimensions: Record<string, number | null>;
};
