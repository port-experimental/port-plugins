import { useQuery } from "@tanstack/react-query";
import { fetchAllInsights } from "../api/insights";
import type { PortCtx } from "../api/portFetch";

export function useInsights(
  ctx: PortCtx | null,
  blueprintId: string | null,
  generating = false,
  pending = false,
  orgFilter: string | null = null,
) {
  const fast = generating || pending;
  return useQuery({
    queryKey: ["copilot-insights", ctx?.token, blueprintId, orgFilter],
    queryFn: () => fetchAllInsights(ctx!, blueprintId!, orgFilter),
    enabled: !!ctx && !!blueprintId,
    staleTime: fast ? 0 : 30 * 1000,
    refetchInterval: fast ? 8 * 1000 : 30 * 1000,
  });
}
