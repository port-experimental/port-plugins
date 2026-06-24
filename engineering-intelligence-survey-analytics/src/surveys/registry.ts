import type {
  Choice,
  Dimension,
  Question,
  QuestionType,
  Scale,
  SurveyDefinition,
} from "../types";
import { SPACE_SURVEY } from "./space";
import { AI_ADOPTION_SURVEY } from "./ai-adoption";

export const TEMPLATES: Record<string, SurveyDefinition> = {
  space: SPACE_SURVEY,
  "ai-adoption": AI_ADOPTION_SURVEY,
};

export const DEFAULT_TEMPLATE = SPACE_SURVEY;

export function templateFor(
  key?: string | null
): SurveyDefinition | undefined {
  if (!key) return undefined;
  const k = key.trim().toLowerCase();
  if (TEMPLATES[k]) return TEMPLATES[k];
  return Object.values(TEMPLATES).find(
    (t) => (t.framework ?? "").toLowerCase() === k
  );
}

export function resolveDefinition(input: {
  inline?: unknown;
  framework?: string | null;
}): SurveyDefinition {
  const inline = normalizeDefinition(input.inline);
  if (inline) return inline;
  return templateFor(input.framework) ?? DEFAULT_TEMPLATE;
}

export function normalizeDefinition(raw: unknown): SurveyDefinition | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  let questions = Array.isArray(obj.questions)
    ? (obj.questions as Question[])
    : null;
  let dimensions = Array.isArray(obj.dimensions)
    ? (obj.dimensions as Dimension[])
    : [];

  // No flat top-level questions? Recover a nested (e.g. Port AI) definition.
  if (!questions || questions.length === 0) {
    const flat = flattenNestedDefinition(obj);
    if (!flat) return null;
    questions = flat.questions;
    dimensions = flat.dimensions;
  }

  return {
    id: typeof obj.id === "string" ? obj.id : "custom",
    title: typeof obj.title === "string" ? obj.title : "Survey",
    description:
      typeof obj.description === "string" ? obj.description : undefined,
    framework: typeof obj.framework === "string" ? obj.framework : undefined,
    version: typeof obj.version === "string" ? obj.version : undefined,
    anonymous: typeof obj.anonymous === "boolean" ? obj.anonymous : undefined,
    scale: (obj.scale as SurveyDefinition["scale"]) ?? undefined,
    dimensions,
    questions,
  };
}

// ── Nested-definition recovery ───────────────────────────────────────────────
// Some authoring paths (notably Port AI) emit a definition that nests each
// question inside its dimension and keeps eNPS / open-ended items in separate
// `enps` and `openEnded` fields, with no flat top-level `questions` array. The
// plugins consume a flat { dimensions, questions } shape, so we recover it here.

/** kebab-case slug for a stable choice value. */
function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

/** Map a loose `type` string (e.g. Port AI's "scale"/"choice") to a QuestionType. */
function coerceQuestionType(raw: unknown): QuestionType | null {
  const t = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  switch (t) {
    case "scale":
    case "likert":
    case "rating":
      return "likert";
    case "choice":
    case "single_choice":
    case "single":
    case "select":
      return "single_choice";
    case "multi_choice":
    case "multi":
    case "multiselect":
    case "multi_select":
      return "multi_choice";
    case "boolean":
    case "bool":
    case "yesno":
      return "boolean";
    case "nps":
    case "enps":
      return "nps";
    case "text":
    case "open":
    case "open_ended":
    case "free_text":
      return "text";
    default:
      return null;
  }
}

function coerceScale(raw: unknown): Scale | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const s = raw as Record<string, unknown>;
  if (typeof s.min !== "number" || typeof s.max !== "number") return undefined;
  return {
    min: s.min,
    max: s.max,
    minLabel: typeof s.minLabel === "string" ? s.minLabel : "",
    maxLabel: typeof s.maxLabel === "string" ? s.maxLabel : "",
  };
}

function coerceChoices(raw: unknown): Choice[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const choices = raw
    .map((o): Choice | null => {
      if (typeof o === "string") return { value: slugify(o) || o, label: o };
      if (o && typeof o === "object") {
        const obj = o as Record<string, unknown>;
        const label =
          typeof obj.label === "string"
            ? obj.label
            : typeof obj.text === "string"
            ? obj.text
            : typeof obj.value === "string"
            ? obj.value
            : "";
        if (!label) return null;
        const value =
          typeof obj.value === "string" ? obj.value : slugify(label) || label;
        const choice: Choice = { value, label };
        if (typeof obj.shortLabel === "string") choice.shortLabel = obj.shortLabel;
        if (typeof obj.score === "number") choice.score = obj.score;
        return choice;
      }
      return null;
    })
    .filter((c): c is Choice => c !== null);
  return choices.length ? choices : undefined;
}

/** Map one nested question object to a canonical Question (null if unusable). */
function coerceQuestion(raw: unknown, dimensionId?: string): Question | null {
  if (!raw || typeof raw !== "object") return null;
  const q = raw as Record<string, unknown>;
  const id = typeof q.id === "string" && q.id ? q.id : undefined;
  const text =
    typeof q.text === "string"
      ? q.text
      : typeof q.title === "string"
      ? q.title
      : typeof q.prompt === "string"
      ? q.prompt
      : undefined;
  if (!id || !text) return null;

  const scale = coerceScale(q.scale);
  const choices = coerceChoices(q.options ?? q.choices);
  // Explicit type wins; otherwise infer from the question's own fields.
  const type =
    coerceQuestionType(q.type) ??
    (choices ? "single_choice" : scale ? "likert" : "text");

  const out: Question = { id, text, type };
  if (dimensionId) out.dimension = dimensionId;
  if (scale) out.scale = scale;
  if (choices && (type === "single_choice" || type === "multi_choice")) {
    out.choices = choices;
  }
  if (q.reversed === true || q.reverse === true) out.reverse = true;
  if (q.required === true) out.required = true;
  else if (q.required === false) out.required = false;
  if (typeof q.helpText === "string") out.helpText = q.helpText;
  const benchmark = coerceBenchmark(q.benchmark);
  if (benchmark) out.benchmark = benchmark;
  return out;
}

/** Preserve a question's benchmark link through the nested-recovery path. */
function coerceBenchmark(raw: unknown): Question["benchmark"] | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const b = raw as Record<string, unknown>;
  if (typeof b.source === "string" && typeof b.metric === "string") {
    return { source: b.source, metric: b.metric };
  }
  return undefined;
}

/**
 * Recover a flat { dimensions, questions } from a nested definition. Returns
 * null when nothing question-like is found.
 */
function flattenNestedDefinition(
  obj: Record<string, unknown>
): { dimensions: Dimension[]; questions: Question[] } | null {
  const dimensions: Dimension[] = [];
  const questions: Question[] = [];

  const rawDims = Array.isArray(obj.dimensions) ? obj.dimensions : [];
  for (const rawDim of rawDims) {
    if (!rawDim || typeof rawDim !== "object") continue;
    const d = rawDim as Record<string, unknown>;
    const id = typeof d.id === "string" && d.id ? d.id : undefined;
    if (!id) continue;
    const name =
      typeof d.name === "string"
        ? d.name
        : typeof d.title === "string"
        ? d.title
        : id;
    const dim: Dimension = { id, name };
    if (typeof d.description === "string") dim.description = d.description;
    if (typeof d.color === "string") dim.color = d.color;
    dimensions.push(dim);

    const nested = Array.isArray(d.questions) ? d.questions : [];
    for (const rq of nested) {
      const q = coerceQuestion(rq, id);
      if (q) questions.push(q);
    }
  }

  // eNPS - one 0–10 recommendation question kept outside the dimensions.
  if (obj.enps && typeof obj.enps === "object") {
    const e = obj.enps as Record<string, unknown>;
    const text =
      typeof e.question === "string"
        ? e.question
        : typeof e.text === "string"
        ? e.text
        : undefined;
    if (e.enabled !== false && text) {
      questions.push({
        id: typeof e.id === "string" && e.id ? e.id : "enps",
        text,
        type: "nps",
      });
    }
  }

  // Open-ended free-text questions kept outside the dimensions.
  const openEnded = Array.isArray(obj.openEnded)
    ? obj.openEnded
    : Array.isArray(obj.open_ended)
    ? (obj.open_ended as unknown[])
    : [];
  for (const rawO of openEnded) {
    const q = coerceQuestion(rawO);
    if (q) questions.push({ ...q, type: "text" });
  }

  if (questions.length === 0) return null;
  return { dimensions, questions };
}
