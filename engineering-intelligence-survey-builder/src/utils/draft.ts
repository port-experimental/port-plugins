import { blankDefinition, cloneDefinition, DEFAULT_SCALE } from "../surveys/registry";
import type {
  Dimension,
  Question,
  QuestionType,
  SurveyDefinition,
  SurveyDraft,
} from "../types";

/** kebab-case slug usable as an entity / question / dimension identifier. */
export function slugify(s: string, fallback = "item"): string {
  const out = s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return out || fallback;
}

/** Short random suffix to keep generated ids unique within a survey. */
export function shortId(): string {
  return Math.random().toString(36).slice(2, 7);
}

/** Build a fresh draft from a definition (template clone or blank). */
export function draftFromDefinition(def: SurveyDefinition): SurveyDraft {
  const d = cloneDefinition(def);
  return {
    entityId: null,
    isNew: true,
    title: d.title || "Untitled survey",
    framework: d.framework || "custom",
    status: "draft",
    cadence: "quarterly",
    description: d.description || "",
    anonymous: d.anonymous !== false,
    version: d.version,
    scale: d.scale ?? { ...DEFAULT_SCALE },
    dimensions: d.dimensions ?? [],
    questions: d.questions ?? [],
    publishedAt: null,
  };
}

export function blankDraft(): SurveyDraft {
  return draftFromDefinition(blankDefinition());
}

/** Reconstruct a draft from an existing survey entity for editing. */
export function draftFromEntity(args: {
  identifier: string;
  title?: string;
  properties?: Record<string, unknown>;
  definition: SurveyDefinition;
}): SurveyDraft {
  const p = args.properties ?? {};
  const def = args.definition;
  return {
    entityId: args.identifier,
    isNew: false,
    title: args.title || def.title || args.identifier,
    framework: (typeof p.framework === "string" && p.framework !== "custom")
      ? p.framework
      : def.framework || "custom",
    status: typeof p.status === "string" ? p.status : "draft",
    cadence: typeof p.cadence === "string" ? p.cadence : "quarterly",
    description: typeof p.description === "string" ? p.description : def.description || "",
    anonymous: def.anonymous !== false,
    version: def.version,
    scale: def.scale ?? { ...DEFAULT_SCALE },
    dimensions: def.dimensions ?? [],
    questions: def.questions ?? [],
    publishedAt: typeof p.publishedAt === "string" ? p.publishedAt : null,
  };
}

/** Compose the canonical SurveyDefinition that gets written to the entity. */
export function definitionFromDraft(draft: SurveyDraft, entityId: string): SurveyDefinition {
  return {
    id: entityId,
    title: draft.title.trim() || "Untitled survey",
    description: draft.description.trim() || undefined,
    framework: draft.framework.trim() || "custom",
    // Preserve the template's version (e.g. "2025.1") so the report alignment
    // and benchmark binding travel with the survey; default for blank surveys.
    version: draft.version?.trim() || "1.0.0",
    anonymous: draft.anonymous,
    scale: draft.scale,
    dimensions: draft.dimensions,
    questions: draft.questions,
  };
}

/** A new, type-appropriate question pre-filled with sensible defaults. */
export function newQuestion(type: QuestionType, dimensionId?: string): Question {
  const base: Question = {
    id: `q-${shortId()}`,
    text: "",
    type,
    required: true,
  };
  if (dimensionId) base.dimension = dimensionId;
  if (type === "single_choice" || type === "multi_choice") {
    base.choices = [
      { value: `opt-${shortId()}`, label: "Option 1" },
      { value: `opt-${shortId()}`, label: "Option 2" },
    ];
    if (type === "multi_choice") base.required = false;
  }
  if (type === "text") base.required = false;
  return base;
}

export function newDimension(): Dimension {
  return {
    id: `dim-${shortId()}`,
    name: "",
    description: "",
    color: pickColor(),
  };
}

const PALETTE = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#3b82f6",
  "#ec4899",
  "#8b5cf6",
  "#14b8a6",
  "#ef4444",
];
export function pickColor(seed = Math.floor(Math.random() * PALETTE.length)): string {
  return PALETTE[seed % PALETTE.length];
}

/** Move an array item from one index to another (returns a new array). */
export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length || from === to) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Validation issues that block saving (empty text, no questions, etc.). */
export function validateDraft(draft: SurveyDraft): string[] {
  const issues: string[] = [];
  if (!draft.title.trim()) issues.push("Give the survey a title.");
  if (draft.framework === "custom" || !draft.framework.trim()) issues.push("Give your custom framework a name (Setup tab → Framework name).");
  if (draft.questions.length === 0) issues.push("No questions yet - add at least one before saving.");

  draft.questions.forEach((q, i) => {
    const n = i + 1;
    if (!q.text.trim()) issues.push(`Question ${n} is missing its text.`);
    if (
      (q.type === "single_choice" || q.type === "multi_choice") &&
      (!q.choices || q.choices.length < 2)
    ) {
      issues.push(`Question ${n} needs at least two choices.`);
    }
    if (q.choices) {
      q.choices.forEach((c) => {
        if (!c.label.trim()) issues.push(`A choice in question ${n} has no label.`);
      });
    }
  });

  draft.dimensions.forEach((d, i) => {
    if (!d.name.trim()) issues.push(`Dimension ${i + 1} is missing a name.`);
  });

  return issues;
}
