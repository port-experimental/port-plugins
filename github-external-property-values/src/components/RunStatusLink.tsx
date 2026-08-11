import type { WorkflowRunSummary } from "../types";
import { buildWorkflowRunUrl } from "../utils/portalUrl";

const RESULT_DOT_CLASS: Record<string, string> = {
  SUCCESS: "run-dot--success",
  FAILED: "run-dot--failed",
  CANCELLED: "run-dot--cancelled",
};

function formatRunDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function RunStatusLink({ run }: { run?: WorkflowRunSummary }) {
  if (!run) {
    return <span className="muted">No recent run found</span>;
  }

  const dotClass =
    run.status === "COMPLETED"
      ? RESULT_DOT_CLASS[run.result ?? ""] ?? "run-dot--unknown"
      : "run-dot--in-progress";

  return (
    <a
      className="synced-table__link run-status-link"
      href={buildWorkflowRunUrl(run.runId)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className={`run-dot ${dotClass}`} aria-hidden="true" />
      {formatRunDate(run.createdAt)}
    </a>
  );
}
