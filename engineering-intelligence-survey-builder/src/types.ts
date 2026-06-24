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
  team?: string | string[];
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
  /** Blueprint that holds survey definitions. Required, this is what we author. */
  surveyBlueprint: BlueprintParam;
  /** Optional override for the dashboard URL used in Share invites. */
  respondentUrl?: string;
  /** Optional override for the survey-analytics dashboard URL ("View responses"). */
  analyticsUrl?: string;
};

// ───────────────────────────────────────────────────────────────────────────
// Survey definition - the shared abstraction. Identical to the runner's shape
// so a survey authored here drops straight into developer-survey / analytics.
// ───────────────────────────────────────────────────────────────────────────

export type QuestionType =
  | "likert" // scored rating on a numeric scale (default 1–5)
  | "single_choice" // one option; optional per-choice score
  | "multi_choice" // many options (unscored by default)
  | "boolean" // yes / no
  | "nps" // 0–10 recommendation score (eNPS)
  | "text"; // free text (unscored)

export const QUESTION_TYPES: { value: QuestionType; label: string; hint: string }[] = [
  { value: "likert", label: "Rating scale", hint: "Scored agree/disagree on a numeric scale" },
  { value: "single_choice", label: "Single choice", hint: "One option; choices may carry a score" },
  { value: "multi_choice", label: "Multi-select", hint: "Several options; unscored" },
  { value: "boolean", label: "Yes / No", hint: "Boolean; counts as 1/0 when scored" },
  { value: "text", label: "Free text", hint: "Open response; unscored" },
];

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

export type AnswerValue = number | string | string[] | boolean | null;
export type Answers = Record<string, AnswerValue>;

/** Computed scores for a single submission (used by the live preview's scoring). */
export type ScoreResult = {
  dimensionScores: Record<string, number>;
  overallScore: number | null;
};

// ───────────────────────────────────────────────────────────────────────────
// Builder-specific types - the working draft and the survey entity it produces.
// ───────────────────────────────────────────────────────────────────────────

/** Enum values mirror the `survey` blueprint schema (see README). */
export const FRAMEWORKS = ["SPACE", "AI Adoption", "DORA", "DX Core 4", "custom"] as const;
export const STATUSES = ["draft", "active", "closed"] as const;
export const CADENCES = ["one-off", "monthly", "quarterly"] as const;

// ───────────────────────────────────────────────────────────────────────────
// Sharing - a survey is *published* (status → active, runner-eligible) and then
// *shared* to an audience as a point-in-time campaign. The campaign, not the
// survey, owns the audience + reminder schedule, so one survey can be run many
// times (matching `cadence`). The widget only collects this config and triggers
// the `share_survey` self-service action; the action's backend creates the
// surveyCampaign entity and schedules nudges.
// ───────────────────────────────────────────────────────────────────────────

/** How often to nudge people who haven't responded yet. */
export const REMINDER_CADENCES = ["off", "daily", "every-3-days", "weekly"] as const;
/** Where a nudge is delivered. */
export const NUDGE_CHANNELS = ["email"] as const;

/** A Port team, projected to what the audience picker needs. */
export type Team = { identifier: string; title: string };

/** Everything the Share drawer collects to launch a share campaign. */
export type ShareConfig = {
  /** "teams" targets the selected team ids; "all" targets every team. */
  audience: "teams" | "all";
  /** Selected team identifiers (used only when audience === "teams"). */
  teams: string[];
  /** ISO date (yyyy-mm-dd) after which the campaign closes, or null for open-ended. */
  deadline: string | null;
  /** One of REMINDER_CADENCES. */
  reminderCadence: string;
};

/** Everything the editor manipulates; serialized to a `survey` entity on save. */
export type SurveyDraft = {
  /** Entity identifier. null while creating; set once saved or when editing. */
  entityId: string | null;
  /** True until first persisted - controls whether we generate the identifier. */
  isNew: boolean;
  title: string;
  framework: string;
  status: string;
  cadence: string;
  description: string;
  anonymous: boolean;
  /** Template/definition version (e.g. "2025.1"); surfaced as a read-only badge. */
  version?: string;
  /** Survey default likert scale (questions inherit unless overridden). */
  scale: Scale;
  dimensions: Dimension[];
  questions: Question[];
  /** ISO timestamp set the first time the survey is published (status → active). */
  publishedAt?: string | null;
};

/** A `survey` entity row as listed on the dashboard. */
export type SurveyRow = {
  identifier: string;
  title: string;
  description?: string;
  framework?: string;
  /** Template/definition version (e.g. "2025.1"); surfaced as a read-only badge. */
  version?: string;
  status?: string;
  cadence?: string;
  questionCount?: number;
  dimensionCount?: number;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
};
