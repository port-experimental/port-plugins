import { useQuery } from "@tanstack/react-query";
import { portFetch, type PortCtx } from "../api/portFetch";

export type NormalizedRunStatus = "success" | "failure" | "cancelled" | "in_progress" | "waiting";

export function useRunStatus(ctx: PortCtx | null, runId: string | null | undefined) {
  return useQuery({
    queryKey: ["run-status", ctx?.token, runId],
    queryFn: async () => {
      const data = await portFetch<{ run: { status: string; result?: string } }>(
        ctx!,
        `/v1/workflows/runs/${encodeURIComponent(runId!)}`
      );
      const { status, result } = data.run;
      if (status === "IN_PROGRESS" || status === "RUNNING" || status === "PENDING" || status === "QUEUED") return "in_progress" as NormalizedRunStatus;
      if (status === "WAITING_FOR_APPROVAL" || status === "WAITING") return "waiting" as NormalizedRunStatus;
      if (status === "CANCELLED" || result === "CANCELLED") return "cancelled" as NormalizedRunStatus;
      if (result === "FAILURE" || result === "FAILED") return "failure" as NormalizedRunStatus;
      if (result === "SUCCESS" || status === "COMPLETED") return "success" as NormalizedRunStatus;
      // Unknown status — treat as terminal (success) to prevent infinite polling.
      return "success" as NormalizedRunStatus;
    },
    enabled: !!ctx && !!runId,
    staleTime: 0,
    refetchInterval: (query) => {
      const s = query.state.data;
      return s === "in_progress" || s === "waiting" ? 1000 : false;
    },
    retry: false,
  });
}
