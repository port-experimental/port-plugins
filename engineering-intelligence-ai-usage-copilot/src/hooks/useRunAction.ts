import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { portFetch, type PortCtx as _PortCtx } from "../api/portFetch";

async function triggerInsightsAction(ctx: _PortCtx, actionId: string, inputs: Record<string, unknown>): Promise<string> {
  const data = await portFetch<{ run?: { id: string } }>(ctx, `/v1/actions/${encodeURIComponent(actionId)}/runs`, { method: "POST", body: JSON.stringify({ properties: inputs }) });
  return data.run?.id ?? "";
}
async function getActionRun(ctx: _PortCtx, runId: string) {
  return portFetch<{ run?: { status: string } }>(ctx, `/v1/actions/runs/${encodeURIComponent(runId)}`).then(d => d.run ?? { status: "IN_PROGRESS" });
}
import type { PortCtx } from "../api/portFetch";

export type RunState = "idle" | "running" | "success" | "failure";

export function useRunAction(ctx: PortCtx | null, actionId: string | null) {
  const queryClient = useQueryClient();
  const [runId, setRunId] = useState<string | null>(null);
  const [runState, setRunState] = useState<RunState>("idle");
  const [runError, setRunError] = useState<string | null>(null);

  const pollQuery = useQuery({
    queryKey: ["action-run", runId],
    queryFn: () => getActionRun(ctx!, runId!),
    enabled: !!ctx && !!runId,
    refetchInterval: 3000,
  });

  useEffect(() => {
    const data = pollQuery.data;
    if (!data) return;
    const s = data.status;
    if (s === "SUCCESS") {
      setRunState("success");
      setRunId(null);
      void queryClient.invalidateQueries({ queryKey: ["copilot-insights"] });
    } else if (s === "FAILURE" || s === "CANCELLED") {
      setRunState("failure");
      setRunError("Insight generation failed. Check the action run logs in Port.");
      setRunId(null);
    }
  }, [pollQuery.data, queryClient]);

  const trigger = useCallback(
    async (inputs: Record<string, unknown> = {}) => {
      if (!ctx || !actionId || runState === "running") return;
      setRunState("running");
      setRunError(null);
      try {
        const id = await triggerInsightsAction(ctx, actionId, inputs);
        setRunId(id);
      } catch (e) {
        setRunState("failure");
        setRunError((e as Error).message);
      }
    },
    [ctx, actionId, runState]
  );

  const clearError = useCallback(() => {
    setRunState("idle");
    setRunError(null);
  }, []);

  return {
    trigger,
    runState,
    isRunning: runState === "running",
    runError,
    clearError,
  };
}
