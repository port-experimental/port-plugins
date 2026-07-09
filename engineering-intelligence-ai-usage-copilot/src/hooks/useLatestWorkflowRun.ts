import { useQuery } from "@tanstack/react-query";
import { portFetch, type PortCtx } from "../api/portFetch";
import type { NormalizedRunStatus } from "./useRunStatus";

export type WorkflowRun = {
  identifier: string;
  status: NormalizedRunStatus;
};

type RawRun = { identifier: string; status: string; result?: string };

function normalize(status: string, result?: string): NormalizedRunStatus {
  if (status === "IN_PROGRESS" || status === "RUNNING") return "in_progress";
  if (status === "WAITING_FOR_APPROVAL" || status === "WAITING") return "waiting";
  if (status === "CANCELLED" || result === "CANCELLED") return "cancelled";
  if (result === "FAILURE" || result === "FAILED") return "failure";
  if (result === "SUCCESS" || status === "COMPLETED") return "success";
  return "in_progress";
}

function extractRun(data: Record<string, unknown>): RawRun | null {
  // Try every response shape Port might return
  const candidates = [
    ...(Array.isArray(data.runs) ? data.runs : []),
    ...(Array.isArray(data.workflowRuns) ? data.workflowRuns : []),
    ...(Array.isArray(data.data) ? data.data : []),
    ...(data.run && typeof data.run === "object" ? [data.run] : []),
  ];
  return (candidates[0] as RawRun) ?? null;
}

async function fetchRun(ctx: PortCtx, workflowId: string): Promise<WorkflowRun | null> {
  const wid = encodeURIComponent(workflowId);
  // Try the most-likely paths; stop at first success
  const paths = [
    `/v1/workflows/${wid}/runs?limit=1`,
    `/v1/workflows/runs?workflow=${wid}&limit=1`,
    `/v1/workflows/runs?workflowIdentifier=${wid}&limit=1`,
    `/v1/runs?type=WORKFLOW&workflowIdentifier=${wid}&limit=1`,
  ];
  for (const path of paths) {
    try {
      const data = await portFetch<Record<string, unknown>>(ctx, path);
      // Endpoint responded 200 — use this result (even if empty)
      const r = extractRun(data);
      if (!r?.identifier) continue; // 200 but no parseable run — try the next candidate path
      return { identifier: r.identifier, status: normalize(r.status, r.result) };
    } catch {
      // 4xx/5xx — try next candidate path
    }
  }
  return null;
}

export function useLatestWorkflowRun(
  ctx: PortCtx | null,
  workflowId: string | null,
  fast = false,
) {
  return useQuery({
    queryKey: ["latest-wf-run", ctx?.token, workflowId],
    queryFn: () => fetchRun(ctx!, workflowId!),
    enabled: !!ctx && !!workflowId,
    staleTime: 0,
    refetchInterval: fast ? 1000 : 60000,
    retry: false,
  });
}
