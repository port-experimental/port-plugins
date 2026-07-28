import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchMetrics } from "../api/metrics";
import type { PortCtx } from "../api/portFetch";
import type { DateRange, Page } from "../types";

type SearchRule = Record<string, unknown>;

/** Flatten dashboard page filters (dashboard-wide + $team) into search rules. */
function pageFilterRules(page: Page | undefined): SearchRule[] {
  const filters = (page?.pageFilters ?? []) as Array<Record<string, unknown>>;
  if (!Array.isArray(filters)) return [];
  return filters.flatMap((f) =>
    Array.isArray(f.rules) ? (f.rules as SearchRule[]) : []
  );
}

export function useMetrics(
  ctx: PortCtx | null,
  args: { blueprint: string; dayProp: string } | null,
  range: DateRange,
  page: Page | undefined,
  enabled = true
) {
  const pageRules = useMemo(() => pageFilterRules(page), [page]);

  return useQuery({
    queryKey: [
      "metrics",
      ctx?.token,
      args?.blueprint,
      args?.dayProp,
      range.from,
      range.to,
      pageRules,
    ],
    queryFn: () =>
      fetchMetrics(ctx!, {
        blueprint: args!.blueprint,
        dayProp: args!.dayProp,
        from: range.from,
        to: range.to,
        pageRules,
      }),
    enabled: enabled && !!ctx && !!args,
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
  });
}
