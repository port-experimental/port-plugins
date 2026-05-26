import { MOCK_SCORECARDS } from "../dev/mockData";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import type { Scorecard, ScorecardRule, ScorecardRuleQuery } from "../types";
import { parsePortError } from "./portFetch";

type ScorecardsResponse = {
  scorecards?: unknown[];
};

function normalizeQuery(raw: unknown): ScorecardRuleQuery | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  const conditionsRaw = Array.isArray(obj.conditions) ? obj.conditions : [];
  const conditions = conditionsRaw
    .filter((c): c is Record<string, unknown> => !!c && typeof c === "object")
    .map((c) => ({
      property: typeof c.property === "string" ? c.property : undefined,
      operator: typeof c.operator === "string" ? c.operator : undefined,
      value: c.value,
    }));

  return {
    combinator: typeof obj.combinator === "string" ? obj.combinator : undefined,
    conditions: conditions.length ? conditions : undefined,
  };
}

function normalizeRule(raw: unknown): ScorecardRule | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.identifier !== "string" || !obj.identifier.trim()) {
    return null;
  }
  const description =
    typeof obj.description === "string"
      ? obj.description
      : typeof obj.rule_description === "string"
        ? obj.rule_description
        : undefined;

  return {
    identifier: obj.identifier.trim(),
    title: typeof obj.title === "string" ? obj.title : undefined,
    level: typeof obj.level === "string" ? obj.level : undefined,
    description,
    query: normalizeQuery(obj.query),
  };
}

function normalizeScorecard(raw: unknown): Scorecard | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.identifier !== "string" || !obj.identifier.trim()) {
    return null;
  }
  const rulesRaw = Array.isArray(obj.rules) ? obj.rules : [];
  const rules = rulesRaw
    .map(normalizeRule)
    .filter((r): r is ScorecardRule => r != null);

  return {
    identifier: obj.identifier.trim(),
    title:
      typeof obj.title === "string" && obj.title.trim()
        ? obj.title.trim()
        : obj.identifier.trim(),
    rules,
  };
}

export async function fetchBlueprintScorecards(
  baseUrl: string,
  token: string,
  blueprintIdentifier: string
): Promise<Scorecard[]> {
  if (DEV_MOCK) return MOCK_SCORECARDS;

  const res = await fetch(
    `${baseUrl}/v1/blueprints/${encodeURIComponent(blueprintIdentifier)}/scorecards`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!res.ok) await parsePortError(res);

  const data = (await res.json()) as ScorecardsResponse;
  const list = Array.isArray(data.scorecards) ? data.scorecards : [];
  return list
    .map(normalizeScorecard)
    .filter((sc): sc is Scorecard => sc != null);
}
