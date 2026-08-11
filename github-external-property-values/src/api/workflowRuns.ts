import type {
  WorkflowRunDetail,
  WorkflowRunListItem,
  WorkflowRunSummary,
} from "../types";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_WORKFLOW_RUN_DETAILS, MOCK_WORKFLOW_RUNS } from "../dev/mockData";

/**
 * GET /v1/workflows/runs?workflowIdentifiers=... — server-side scoped to one
 * workflow (confirmed working filter; entity-level filtering is not
 * supported by this endpoint, so resolving "which entity triggered this run"
 * still requires fetchWorkflowRunDetail per candidate run). Newest-first.
 */
export async function fetchWorkflowRuns(
  token: string,
  portApiBaseUrl: string | null,
  workflowIdentifier: string
): Promise<WorkflowRunListItem[]> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    return MOCK_WORKFLOW_RUNS[workflowIdentifier] ?? [];
  }

  const url = new URL(`${portApiBaseUrl}/v1/workflows/runs`);
  url.searchParams.set("workflowIdentifiers", workflowIdentifier);
  url.searchParams.set("limit", "1000");

  const res = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Port API ${res.status}:\n${body}`);
  }
  const data = await res.json();
  return (data.workflowRuns ?? []) as WorkflowRunListItem[];
}

/**
 * GET /v1/workflows/runs/:identifier — only this single-run endpoint
 * returns the trigger node's full `diff`, which reveals which entity
 * triggered the run.
 */
export async function fetchWorkflowRunDetail(
  token: string,
  portApiBaseUrl: string | null,
  runId: string
): Promise<WorkflowRunDetail> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 80));
    const mock = MOCK_WORKFLOW_RUN_DETAILS[runId];
    if (!mock) throw new Error(`Port API 404:\nWorkflow run not found: ${runId}`);
    return mock;
  }

  const res = await fetch(
    `${portApiBaseUrl}/v1/workflows/runs/${encodeURIComponent(runId)}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Port API ${res.status}:\n${body}`);
  }
  const data = await res.json();
  return data.workflowRun as WorkflowRunDetail;
}

/** The triggering entity's identifier, from whichever node ran the event trigger. */
export function extractTriggerEntityIdentifier(
  detail: WorkflowRunDetail
): string | undefined {
  for (const nodeRun of detail.nodeRuns) {
    const diff = nodeRun.output?.diff;
    if (diff) {
      return diff.after?.identifier ?? diff.before?.identifier ?? undefined;
    }
  }
  return undefined;
}

const DETAIL_FETCH_CONCURRENCY = 5;

/**
 * Resolves, for each of `targetIdentifiers`, the latest run of
 * `workflowIdentifier` that was triggered by that entity. There's no
 * entity-level filter on the runs-list endpoint, so this walks the
 * workflow's own run history newest-first, fetching run detail in small
 * batches, stopping once every target is resolved or the history is
 * exhausted. Entities with no matching run are simply absent from the
 * returned map ("no recent run found").
 */
export async function resolveLatestRunsForEntities(
  token: string,
  portApiBaseUrl: string | null,
  workflowIdentifier: string,
  targetIdentifiers: string[]
): Promise<Map<string, WorkflowRunSummary>> {
  const runs = await fetchWorkflowRuns(token, portApiBaseUrl, workflowIdentifier);
  const remaining = new Set(targetIdentifiers);
  const resolved = new Map<string, WorkflowRunSummary>();

  for (
    let i = 0;
    i < runs.length && remaining.size > 0;
    i += DETAIL_FETCH_CONCURRENCY
  ) {
    const batch = runs.slice(i, i + DETAIL_FETCH_CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (run) => {
        try {
          const detail = await fetchWorkflowRunDetail(
            token,
            portApiBaseUrl,
            run.identifier
          );
          return { run, entityId: extractTriggerEntityIdentifier(detail) };
        } catch {
          return { run, entityId: undefined };
        }
      })
    );
    for (const { run, entityId } of results) {
      if (entityId && remaining.has(entityId)) {
        resolved.set(entityId, {
          runId: run.identifier,
          status: run.status,
          result: run.result,
          createdAt: run.createdAt,
        });
        remaining.delete(entityId);
      }
    }
  }

  return resolved;
}
