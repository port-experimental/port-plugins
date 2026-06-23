import { FRAMEWORKS } from "../types";
import type { SurveyRow } from "../types";

export type Group = { framework: string; items: SurveyRow[] };

const PRESET_FRAMEWORKS = new Set<string>(FRAMEWORKS);

/** Group consecutive rows by framework (the list arrives framework-sorted).
 *  Custom-named frameworks (not in the preset list) are all bucketed under "custom". */
export function groupByFramework(rows: SurveyRow[]): Group[] {
  const map = new Map<string, SurveyRow[]>();
  for (const r of rows) {
    const raw = r.framework || "custom";
    const key = PRESET_FRAMEWORKS.has(raw) ? raw : "custom";
    const bucket = map.get(key);
    if (bucket) bucket.push(r);
    else map.set(key, [r]);
  }
  return Array.from(map.entries()).map(([framework, items]) => ({ framework, items }));
}

export const byNewest = (a: SurveyRow, b: SurveyRow) =>
  new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();

/** Surfacing priority: active first, then drafts (work in progress), then the rest. */
const promoteRank = (s: SurveyRow) =>
  s.status === "active" ? 0 : s.status === "draft" ? 1 : 2;

/**
 * Split a framework's surveys into the ones to show up front (active + draft
 * surveys, or the most recent if there are none) and the older history to
 * collapse. Drafts ride alongside active ones so in-progress work stays visible.
 */
export function partition(items: SurveyRow[]): { primary: SurveyRow[]; history: SurveyRow[] } {
  const sorted = [...items].sort(
    (a, b) => promoteRank(a) - promoteRank(b) || byNewest(a, b)
  );
  const promoted = sorted.filter((s) => promoteRank(s) < 2);
  const primary = promoted.length ? promoted : sorted.slice(0, 1);
  const primaryIds = new Set(primary.map((s) => s.identifier));
  return { primary, history: sorted.filter((s) => !primaryIds.has(s.identifier)) };
}
