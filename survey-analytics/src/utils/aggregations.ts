import type {
  AnalyticsResponse,
  Answers,
  DimensionAgg,
  DistBucket,
  HeatmapRow,
  MultiChoiceDetail,
  MultiChoiceOption,
  ParticipationRow,
  Question,
  QuestionDetail,
  Scale,
  SurveyDefinition,
  SurveyMeta,
  TrendPoint,
} from "../types";

/** Below this many responses, scores are hidden to protect anonymity. */
export const MIN_RESPONSES = 1;

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

// ── Dimension / overall ──────────────────────────────────────────────────────

export function aggregateDimensions(
  def: SurveyDefinition,
  responses: AnalyticsResponse[]
): DimensionAgg[] {
  return def.dimensions.map((d) => {
    const scores = responses
      .map((r) => r.dimensionScores?.[d.id])
      .filter((s): s is number => typeof s === "number");
    return {
      id: d.id,
      name: d.name,
      color: d.color,
      score: mean(scores),
      count: scores.length,
    };
  });
}

export function aggregateOverall(responses: AnalyticsResponse[]): number | null {
  return mean(
    responses
      .map((r) => r.overallScore)
      .filter((s): s is number => typeof s === "number")
  );
}

export function extractTeams(responses: AnalyticsResponse[]): string[] {
  const teams = new Set<string>();
  for (const r of responses) if (r.team) teams.add(r.team);
  return [...teams].sort();
}

// ── Team × dimension heatmap ─────────────────────────────────────────────────

/**
 * Build the heatmap matrix. Teams with fewer than MIN_RESPONSES get null cells
 * (rendered as "-") to protect anonymity.
 */
export function buildHeatmap(
  def: SurveyDefinition,
  responses: AnalyticsResponse[]
): { rows: HeatmapRow[]; allTeams: HeatmapRow } {
  const teams = extractTeams(responses);

  const rowFor = (team: string | null): HeatmapRow => {
    const subset = team ? responses.filter((r) => r.team === team) : responses;
    const below = subset.length < MIN_RESPONSES;
    const dims = aggregateDimensions(def, subset);
    const cells: Record<string, number | null> = {};
    for (const d of dims) cells[d.id] = below ? null : d.score;
    return {
      team: team ?? "All teams",
      count: subset.length,
      overall: below ? null : aggregateOverall(subset),
      cells,
    };
  };

  return {
    rows: teams.map((t) => rowFor(t)),
    allTeams: rowFor(null),
  };
}

// ── Participation ────────────────────────────────────────────────────────────

export function buildParticipation(
  responses: AnalyticsResponse[],
  targets: Record<string, number> | undefined
): { rows: ParticipationRow[]; totalResponses: number; totalTarget: number | null } {
  // Teams come from both the targets (so 0-response teams still show) and data.
  const teamSet = new Set<string>(extractTeams(responses));
  if (targets) for (const t of Object.keys(targets)) teamSet.add(t);
  const teams = [...teamSet].sort();

  const rows: ParticipationRow[] = teams.map((team) => {
    const responsesN = responses.filter((r) => r.team === team).length;
    const target = targets?.[team] ?? null;
    return {
      team,
      responses: responsesN,
      target,
      rate: target && target > 0 ? Math.round((responsesN / target) * 100) : null,
    };
  });

  const totalTarget = targets
    ? Object.values(targets).reduce((a, b) => a + b, 0)
    : null;

  return { rows, totalResponses: responses.length, totalTarget };
}

/** Distinct teams that submitted at least one response. */
export function teamsResponded(
  responses: AnalyticsResponse[],
  targets: Record<string, number> | undefined
): { responded: number; total: number } {
  const responded = extractTeams(responses).length;
  const total = targets
    ? Object.keys(targets).length
    : extractTeams(responses).length;
  return { responded, total };
}

// ── Answer normalization (mirrors the runner's scoring) ──────────────────────

const DEFAULT_SCALE: Scale = {
  min: 1,
  max: 5,
  minLabel: "Strongly disagree",
  maxLabel: "Strongly agree",
};

function scaleFor(def: SurveyDefinition, q: Question): Scale {
  return q.scale ?? def.scale ?? DEFAULT_SCALE;
}

function normalizeAnswer(
  def: SurveyDefinition,
  q: Question,
  value: unknown
): number | null {
  if (value == null) return null;
  let norm: number | null = null;

  if (q.type === "likert" && typeof value === "number") {
    const scale = scaleFor(def, q);
    const span = scale.max - scale.min;
    if (span > 0) norm = Math.max(0, Math.min(1, (value - scale.min) / span));
  } else if (q.type === "boolean") {
    norm = value === true ? 1 : 0;
  } else if (q.type === "single_choice" && q.choices?.length) {
    const chosen = q.choices.find((c) => c.value === value);
    const scores = q.choices
      .map((c) => c.score)
      .filter((s): s is number => typeof s === "number");
    if (chosen && typeof chosen.score === "number" && scores.length) {
      const max = Math.max(...scores, 0);
      norm = max > 0 ? Math.max(0, Math.min(1, chosen.score / max)) : null;
    }
  }

  if (norm == null) return null;
  return q.reverse ? 1 - norm : norm;
}

function toneFor(norm: number): DistBucket["tone"] {
  if (norm >= 0.8) return "very-high";
  if (norm >= 0.6) return "high";
  if (norm >= 0.4) return "mid";
  if (norm >= 0.2) return "low";
  return "very-low";
}

// ── Question ranking + answer distribution ───────────────────────────────────

/**
 * Ranked scoreable questions (lowest avg first), each with an answer
 * distribution. Color tone is by normalized goodness, so green is always
 * favorable even for reverse-coded items.
 */
export function aggregateQuestions(
  def: SurveyDefinition,
  responses: AnalyticsResponse[]
): QuestionDetail[] {
  const withAnswers = responses.filter((r) => r.answers);
  const dimMap = Object.fromEntries(def.dimensions.map((d) => [d.id, d.name]));

  const out: QuestionDetail[] = [];

  for (const q of def.questions) {
    // Skip questions that never carry a dimension score: free text, NPS, and
    // unscored multi-select.
    if (q.type === "text" || q.type === "nps" || q.type === "multi_choice") continue;

    const norms: number[] = [];
    const valueCounts = new Map<number | string, number>();

    for (const r of withAnswers) {
      const raw = (r.answers as Answers)[q.id] ?? null;
      const norm = normalizeAnswer(def, q, raw);
      if (norm != null) {
        norms.push(norm);
        if (typeof raw === "number" || typeof raw === "string") {
          valueCounts.set(raw, (valueCounts.get(raw) ?? 0) + 1);
        }
      }
    }

    const count = norms.length;
    const avgScore =
      count > 0
        ? Math.round((norms.reduce((a, b) => a + b, 0) / count) * 100)
        : null;

    // Distribution buckets - likert: numeric scale points; single_choice: each choice option.
    const buckets: DistBucket[] = [];
    if (q.type === "likert") {
      const scale = scaleFor(def, q);
      const span = scale.max - scale.min || 1;
      for (let v = scale.min; v <= scale.max; v++) {
        const c = (valueCounts.get(v) as number) ?? 0;
        const rawNorm = (v - scale.min) / span;
        const goodNorm = q.reverse ? 1 - rawNorm : rawNorm;
        buckets.push({
          label: String(v),
          count: c,
          pct: count > 0 ? Math.round((c / count) * 100) : 0,
          tone: toneFor(goodNorm),
        });
      }
    } else if (q.type === "single_choice" && q.choices?.length) {
      const scores = q.choices
        .map((c) => c.score)
        .filter((s): s is number => typeof s === "number");
      const maxScore = scores.length ? Math.max(...scores, 0) : 0;
      for (const choice of q.choices) {
        const c = (valueCounts.get(choice.value) as number) ?? 0;
        const goodNorm =
          typeof choice.score === "number" && maxScore > 0
            ? choice.score / maxScore
            : null;
        buckets.push({
          label: choice.label,
          shortLabel: choice.shortLabel,
          count: c,
          pct: count > 0 ? Math.round((c / count) * 100) : 0,
          tone: goodNorm != null ? toneFor(goodNorm) : "mid",
        });
      }
    }

    out.push({
      questionId: q.id,
      questionText: q.text,
      dimensionId: q.dimension,
      dimensionName: q.dimension ? dimMap[q.dimension] : undefined,
      type: q.type,
      reverse: q.reverse,
      avgScore,
      count,
      buckets,
    });
  }

  return out.sort((a, b) => {
    if (a.avgScore == null && b.avgScore == null) return 0;
    if (a.avgScore == null) return 1;
    if (b.avgScore == null) return -1;
    return a.avgScore - b.avgScore;
  });
}

// ── Multi-select breakdown (unscored) ────────────────────────────────────────

/**
 * Per-option tallies for each multi-select question. These never carry a score,
 * so they're surfaced as plain "% of respondents who picked each option" rather
 * than fed into dimension/overall scores. Options are sorted most-picked first;
 * any answered value not declared in the definition is appended verbatim.
 */
export function aggregateMultiChoice(
  def: SurveyDefinition,
  responses: AnalyticsResponse[]
): MultiChoiceDetail[] {
  const withAnswers = responses.filter((r) => r.answers);
  const dimMap = Object.fromEntries(def.dimensions.map((d) => [d.id, d.name]));
  const out: MultiChoiceDetail[] = [];

  for (const q of def.questions) {
    if (q.type !== "multi_choice") continue;

    // Normalize each respondent's answer to a deduped string[] of selections.
    const counts = new Map<string, number>();
    let respondents = 0;
    for (const r of withAnswers) {
      const raw = (r.answers as Answers)[q.id];
      const sel = Array.isArray(raw)
        ? raw.filter((v): v is string => typeof v === "string" && v.trim() !== "")
        : typeof raw === "string" && raw.trim()
        ? [raw]
        : [];
      if (sel.length === 0) continue;
      respondents++;
      for (const v of new Set(sel)) counts.set(v, (counts.get(v) ?? 0) + 1);
    }

    const options: MultiChoiceOption[] = [];
    const seen = new Set<string>();
    const pushOpt = (value: string, label: string, shortLabel?: string) => {
      const count = counts.get(value) ?? 0;
      options.push({
        value,
        label,
        shortLabel,
        count,
        pct: respondents > 0 ? Math.round((count / respondents) * 100) : 0,
      });
      seen.add(value);
    };
    for (const c of q.choices ?? []) pushOpt(c.value, c.label, c.shortLabel);
    for (const v of counts.keys()) if (!seen.has(v)) pushOpt(v, v);

    // Most-picked first; ties keep the definition order (stable sort).
    options.sort((a, b) => b.count - a.count);

    out.push({
      questionId: q.id,
      questionText: q.text,
      dimensionName: q.dimension ? dimMap[q.dimension] : undefined,
      respondents,
      options,
    });
  }

  return out;
}

// ── Trend across surveys (chronological) ─────────────────────────────────────

/**
 * One trend point per survey, ordered oldest → newest by publishedAt (falls
 * back to createdAt). When `team` is set, the trend reflects only that team's
 * responses.
 */
export function buildTrend(
  surveys: SurveyMeta[],
  responsesBySurvey: Record<string, AnalyticsResponse[]>,
  dimensionIds: string[],
  team?: string
): TrendPoint[] {
  const dateOf = (s: SurveyMeta) => s.publishedAt ?? s.createdAt ?? "";
  const ordered = [...surveys].sort(
    (a, b) => new Date(dateOf(a)).getTime() - new Date(dateOf(b)).getTime()
  );

  return ordered.map((s) => {
    const all = responsesBySurvey[s.identifier] ?? [];
    const subset = team ? all.filter((r) => r.team === team) : all;
    const below = subset.length < MIN_RESPONSES;

    const dimensions: Record<string, number | null> = {};
    for (const id of dimensionIds) {
      const scores = subset
        .map((r) => r.dimensionScores?.[id])
        .filter((v): v is number => typeof v === "number");
      dimensions[id] = below ? null : mean(scores);
    }

    return {
      surveyId: s.identifier,
      title: s.title,
      label: fmtMonthYear(s.publishedAt ?? s.createdAt),
      createdAt: s.createdAt,
      publishedAt: s.publishedAt,
      count: subset.length,
      overall: below ? null : aggregateOverall(subset),
      dimensions,
    };
  });
}

function fmtMonthYear(iso: string | undefined): string {
  if (!iso) return "?";
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export function scoreDelta(
  current: number | null,
  previous: number | null
): number | null {
  if (current == null || previous == null) return null;
  return current - previous;
}
