import { MOCK_SCORECARDS } from "../dev/mockData";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import type { Scorecard, ScorecardRule } from "../types";
import { parsePortError } from "./portFetch";

type ScorecardsResponse = {
  scorecards?: unknown[];
};

function normalizeRule(raw: unknown): ScorecardRule | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.identifier !== "string" || !obj.identifier.trim()) {
    return null;
  }
  return {
    identifier: obj.identifier.trim(),
    title: typeof obj.title === "string" ? obj.title : undefined,
    level: typeof obj.level === "string" ? obj.level : undefined,
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
