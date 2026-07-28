import type {
  AnswerValue,
  Answers,
  Question,
  Scale,
  ScoreResult,
  SurveyDefinition,
} from "./types";

const DEFAULT_SCALE: Scale = {
  min: 1,
  max: 5,
  minLabel: "Strongly disagree",
  maxLabel: "Strongly agree",
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

export function scaleFor(def: SurveyDefinition, q: Question): Scale {
  return q.scale ?? def.scale ?? DEFAULT_SCALE;
}

/** Has the respondent provided a usable answer for this question? */
export function isAnswered(q: Question, value: AnswerValue): boolean {
  if (value == null) return false;
  if (q.type === "multi_choice") return Array.isArray(value) && value.length > 0;
  if (q.type === "text") return typeof value === "string" && value.trim() !== "";
  if (typeof value === "string") return value.trim() !== "";
  return true; // numbers (likert/nps) and booleans
}

/** Required questions still missing an answer - drives submit validation. */
export function missingRequired(
  def: SurveyDefinition,
  answers: Answers
): Question[] {
  return def.questions.filter(
    (q) => q.required && !isAnswered(q, answers[q.id] ?? null)
  );
}

/**
 * Normalize a single answer to 0..1 for dimension scoring, applying reverse
 * coding. Returns null for answers that do not carry a score signal (text,
 * multi_choice, unscored single_choice, or nps - which is handled as eNPS).
 */
export function normalizeAnswer(
  def: SurveyDefinition,
  q: Question,
  value: AnswerValue
): number | null {
  if (!isAnswered(q, value)) return null;

  let norm: number | null = null;

  if (q.type === "likert") {
    const scale = scaleFor(def, q);
    const span = scale.max - scale.min;
    if (span > 0 && typeof value === "number") {
      norm = clamp01((value - scale.min) / span);
    }
  } else if (q.type === "boolean") {
    norm = value === true ? 1 : 0;
  } else if (q.type === "single_choice" && q.choices?.length) {
    const chosen = q.choices.find((c) => c.value === value);
    const scores = q.choices
      .map((c) => c.score)
      .filter((s): s is number => typeof s === "number");
    if (chosen && typeof chosen.score === "number" && scores.length) {
      const max = Math.max(...scores, 0);
      norm = max > 0 ? clamp01(chosen.score / max) : null;
    }
  }

  if (norm == null) return null;
  return q.reverse ? 1 - norm : norm;
}

/** Compute per-dimension (0..100) and overall scores for one submission. */
export function computeScores(
  def: SurveyDefinition,
  answers: Answers
): ScoreResult {
  const buckets: Record<string, number[]> = {};

  for (const q of def.questions) {
    if (!q.dimension) continue;
    const norm = normalizeAnswer(def, q, answers[q.id] ?? null);
    if (norm == null) continue;
    (buckets[q.dimension] ??= []).push(norm);
  }

  const dimensionScores: Record<string, number> = {};
  for (const [dim, vals] of Object.entries(buckets)) {
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    dimensionScores[dim] = Math.round(mean * 100);
  }

  const dims = Object.values(dimensionScores);
  const overallScore =
    dims.length > 0
      ? Math.round(dims.reduce((a, b) => a + b, 0) / dims.length)
      : null;

  return { dimensionScores, overallScore };
}
