import { useQuery } from "@tanstack/react-query";
import { searchSurveys, toSurveyRow } from "../api/entities";
import type { PortCtx } from "../api/portFetch";
import type { SurveyRow } from "../types";

/** List all survey entities for the dashboard, ordered for authoring. */
export function useSurveys(ctx: PortCtx | null, surveyBlueprint?: string) {
  return useQuery<SurveyRow[]>({
    queryKey: ["surveys", surveyBlueprint],
    enabled: !!ctx && !!surveyBlueprint,
    queryFn: async () => {
      const entities = await searchSurveys(ctx!, surveyBlueprint!);
      return entities.map(toSurveyRow).sort(compareSurveys);
    },
  });
}

/**
 * Order: group by framework, then newest period first within each group.
 * A plain title sort gets chronology wrong ("Q1 2026" < "Q4 2025" lexically),
 * so we extract a year+quarter key from the title; fall back to the entity's
 * createdAt, then a natural-numeric title compare.
 */
function compareSurveys(a: SurveyRow, b: SurveyRow): number {
  // 1. Framework group (entities without a framework sort last).
  const fa = a.framework ?? "￿";
  const fb = b.framework ?? "￿";
  if (fa !== fb) return fa.localeCompare(fb);

  // 2. Parsed period, descending (newest first).
  const pa = periodKey(a.title);
  const pb = periodKey(b.title);
  if (pa != null && pb != null) {
    if (pa !== pb) return pb - pa;
  } else if (pa != null || pb != null) {
    return pa == null ? 1 : -1; // titles with a period sort ahead of those without
  }

  // 3. createdAt, descending.
  if (a.createdAt && b.createdAt && a.createdAt !== b.createdAt) {
    return a.createdAt < b.createdAt ? 1 : -1;
  }

  // 4. Natural-numeric title compare.
  return a.title.localeCompare(b.title, undefined, { numeric: true });
}

/** Extract a sortable year*10+quarter key from a title, or null if none found. */
function periodKey(title: string): number | null {
  let year: number | null = null;
  let quarter = 0;

  const qy = title.match(/\bQ([1-4])\b[^\d]*?(\d{4})\b/i); // "Q4 2025"
  const yq = title.match(/\b(\d{4})\b[^\d]*?Q([1-4])\b/i); // "2025 Q4" / "2025-Q4"
  if (qy) {
    quarter = Number(qy[1]);
    year = Number(qy[2]);
  } else if (yq) {
    year = Number(yq[1]);
    quarter = Number(yq[2]);
  } else {
    const y = title.match(/\b(20\d{2})\b/); // bare year
    if (y) year = Number(y[1]);
  }

  return year == null ? null : year * 10 + quarter;
}
