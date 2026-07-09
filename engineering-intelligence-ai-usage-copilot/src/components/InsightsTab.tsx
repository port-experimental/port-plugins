import React, { useEffect, useRef, useState } from "react";
import { openAiChat } from "@port-labs/plugins-sdk";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import { useInsights } from "../hooks/useInsights";
import { useRunStatus } from "../hooks/useRunStatus";
import { useLatestWorkflowRun } from "../hooks/useLatestWorkflowRun";
import { LoadingState } from "./LoadingState";
import { portFetch, type PortCtx } from "../api/portFetch";
import { triggerWorkflow } from "../api/insights";
import { DateRangePicker } from "./DateRangePicker";
import { presetRange } from "../utils/aggregations";
import type { CopilotInsight, InsightFinding, DateRange, OrgOption } from "../types";
import type { NormalizedRunStatus } from "../hooks/useRunStatus";

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatShortDate(iso: string | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const sameYear = d.getFullYear() === new Date().getFullYear();
    return new Intl.DateTimeFormat("en-US", {
      month: "short", day: "numeric",
      ...(sameYear ? {} : { year: "numeric" }),
      hour: "2-digit", minute: "2-digit",
    }).format(d);
  } catch {
    return "";
  }
}

function formatPeriod(period: string | undefined): string {
  if (!period) return "Unknown period";
  const parts = period.split(" to ");
  if (parts.length !== 2) return period;
  try {
    const from = new Date(parts[0]);
    const to = new Date(parts[1]);
    const fmt = (d: Date, includeYear: boolean) =>
      new Intl.DateTimeFormat("en-US", {
        month: "short", day: "numeric",
        ...(includeYear ? { year: "numeric" } : {}),
      }).format(d);
    const sameYear = from.getFullYear() === to.getFullYear();
    return sameYear
      ? `${fmt(from, false)} – ${fmt(to, true)}`
      : `${fmt(from, true)} – ${fmt(to, true)}`;
  } catch {
    return period;
  }
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function SparkleIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path d="M8 0c-.3 3.4-2.4 5.6-8 8 5.6 2.4 7.7 4.6 8 8 .3-3.4 2.4-5.6 8-8-5.6-2.4-7.7-4.6-8-8z" />
    </svg>
  );
}

// ── Act on finding ───────────────────────────────────────────────────────────

function buildActPrompt(f: InsightFinding): string {
  const context = [
    f.insight  && `**Finding:** ${f.insight}`,
    f.category && `**Category:** ${f.category}`,
    f.severity && `**Severity:** ${f.severity}`,
    f.evidence && `**Evidence:** ${f.evidence}`,
  ].filter(Boolean).join("\n\n");

  const action = f.recommendedAction ?? "Please help me implement this recommendation in Port.";

  return `## I want to act on this GitHub Copilot adoption finding\n\n${context}\n\n---\n\n${action}`;
}

function ActButton({ finding }: { finding: InsightFinding }) {
  const [ack, setAck] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const handleClick = () => {
    const prompt = buildActPrompt(finding);
    if (DEV_MOCK) {
      void navigator.clipboard?.writeText(prompt).catch(() => null);
    } else {
      openAiChat(prompt, { chatMode: "build" });
    }
    setAck(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setAck(false), 2000);
  };

  return (
    <button
      type="button"
      className={`btn-act${ack ? " btn-act--ack" : ""}`}
      onClick={handleClick}
      title="Open this recommendation in Port AI to build a remediation"
    >
      {ack ? "✓ Opened" : <><SparkleIcon className="btn-act__icon" /> Build with AI</>}
    </button>
  );
}

// ── Badges ────────────────────────────────────────────────────────────────────

function normLevel(level?: string): "High" | "Medium" | "Low" | undefined {
  if (!level) return undefined;
  const l = level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
  if (l === "High" || l === "Medium" || l === "Low") return l;
  return undefined;
}

function SeverityBadge({ level }: { level?: string }) {
  const l = normLevel(level);
  if (!l) return <span className="badge badge--neutral">—</span>;
  const cls = l === "High" ? "badge--sev-high" : l === "Medium" ? "badge--sev-medium" : "badge--sev-low";
  return <span className={`badge ${cls}`}>{l}</span>;
}

function ConfidenceBadge({ level }: { level?: string }) {
  const l = normLevel(level);
  if (!l) return <span className="badge badge--neutral">—</span>;
  const cls = l === "High" ? "badge--conf-high" : l === "Medium" ? "badge--conf-medium" : "badge--conf-low";
  return <span className={`badge ${cls}`}>{l}</span>;
}

// ── Run status badge ─────────────────────────────────────────────────────────

const RUN_STATUS_LABEL: Record<NormalizedRunStatus, string> = {
  success: "Completed",
  failure: "Failed",
  cancelled: "Cancelled",
  in_progress: "In Progress",
  waiting: "Waiting",
};

function RunStatusBadge({ status }: { status: NormalizedRunStatus }) {
  const cls =
    status === "success" ? "badge--run-success"
    : status === "failure" ? "badge--run-failure"
    : status === "cancelled" ? "badge--run-cancelled"
    : "badge--run-active";
  return <span className={`badge ${cls}`}>{RUN_STATUS_LABEL[status]}</span>;
}

// ── FindingsTable ─────────────────────────────────────────────────────────────

type SortKey = "severity" | "confidence" | "category" | null;
type SortDir = "asc" | "desc";

const LEVEL_ORDER: Record<string, number> = { High: 0, Medium: 1, Low: 2 };

function sortFindings(findings: InsightFinding[], key: SortKey, dir: SortDir): InsightFinding[] {
  if (!key) return findings;
  return [...findings].sort((a, b) => {
    let va: string | undefined;
    let vb: string | undefined;
    if (key === "severity") { va = a.severity; vb = b.severity; }
    else if (key === "confidence") { va = a.confidence; vb = b.confidence; }
    else { va = a.category ?? ""; vb = b.category ?? ""; }

    let cmp: number;
    if (key === "severity" || key === "confidence") {
      cmp = (LEVEL_ORDER[va ?? ""] ?? 99) - (LEVEL_ORDER[vb ?? ""] ?? 99);
    } else {
      cmp = (va ?? "").localeCompare(vb ?? "");
    }
    return dir === "asc" ? cmp : -cmp;
  });
}

function FindingsTable({ findings }: { findings: InsightFinding[] }) {
  const [sortKey, setSortKey] = useState<SortKey>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      if (sortDir === "asc") setSortDir("desc");
      else { setSortKey(null); setSortDir("asc"); }
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sorted = sortFindings(findings, sortKey, sortDir);

  const thProps = (key: SortKey) => ({
    className: `ft-sortable${sortKey === key ? " ft-sorted" : ""}`,
    onClick: () => handleSort(key),
    "aria-sort": sortKey === key ? (sortDir === "asc" ? ("ascending" as const) : ("descending" as const)) : undefined,
  });

  const arrow = (key: SortKey) => {
    if (sortKey !== key) return <span className="ft-sort-icon">⇅</span>;
    return <span className="ft-sort-icon ft-sort-icon--active">{sortDir === "asc" ? "↑" : "↓"}</span>;
  };

  return (
    <div className="findings-wrap">
      <table className="findings-table">
        <thead>
          <tr>
            <th>Insight</th>
            <th {...thProps("category")}>Category {arrow("category")}</th>
            <th>Impact</th>
            <th>Evidence</th>
            <th {...thProps("severity")}>Severity {arrow("severity")}</th>
            <th {...thProps("confidence")}>Confidence {arrow("confidence")}</th>
            <th>Recommended Action</th>
            <th className="ft-col-act-head"></th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((f, i) => (
            <tr key={f.insight?.slice(0, 40) ?? String(i)}>
              <td className="ft-col-insight">{f.insight}</td>
              <td className="ft-col-chip">
                {f.category ? <span className="badge badge--category">{f.category}</span> : <span className="muted">—</span>}
              </td>
              <td className="ft-col-mid">{f.impact || <span className="muted">—</span>}</td>
              <td className="ft-col-mid">{f.evidence || <span className="muted">—</span>}</td>
              <td className="ft-col-chip"><SeverityBadge level={f.severity} /></td>
              <td className="ft-col-chip"><ConfidenceBadge level={f.confidence} /></td>
              <td className="ft-col-action">{f.recommendedAction || <span className="muted">—</span>}</td>
              <td className="ft-col-act"><ActButton finding={f} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── GeneratingBanner ──────────────────────────────────────────────────────────

function GeneratingBanner({ onRefresh }: { onRefresh: () => void }) {
  const [dots, setDots] = useState(".");
  useEffect(() => {
    const t = setInterval(() => setDots((d) => (d.length >= 3 ? "." : d + ".")), 600);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="insights__generating">
      <span className="insights__generating-spinner" aria-hidden="true" />
      <span className="insights__generating-text">Generating insights{dots}</span>
      <button type="button" className="btn btn--ghost btn--sm" onClick={onRefresh}>
        ↻ Check now
      </button>
    </div>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

function InsightsEmptyState({ onGenerate }: { onGenerate?: () => void }) {
  return (
    <div className="state state--empty insights__empty">
      <div className="insights__empty-icon"><SparkleIcon /></div>
      <div className="state__title">No insights generated yet</div>
      <p className="muted">
        Trigger the insights workflow to generate an AI-powered summary of your Copilot adoption.
      </p>
      {onGenerate && (
        <button type="button" className="btn btn--ghost" onClick={onGenerate}>
          Generate Insights
        </button>
      )}
    </div>
  );
}

// ── GeneratePanel ─────────────────────────────────────────────────────────────

function GeneratePanel({
  orgOptions,
  defaultOrg,
  defaultFrom,
  defaultTo,
  onCancel,
  onGenerate,
}: {
  orgOptions: OrgOption[];
  defaultOrg: string;
  defaultFrom: string;
  defaultTo: string;
  onCancel: () => void;
  onGenerate: (org: string, from: string, to: string) => void;
}) {
  const [org, setOrg] = useState(defaultOrg);
  const [preset, setPreset] = useState<number | null>(30);
  const [range, setRange] = useState({ from: defaultFrom, to: defaultTo });

  const handlePreset = (days: number) => {
    setPreset(days);
    setRange(presetRange(days));
  };
  const handleRange = (r: { from: string; to: string }) => {
    setPreset(null);
    setRange(r);
  };

  return (
    <div className="gen-panel">
      {orgOptions.length > 0 && (
        <select className="gen-panel__select" value={org} onChange={(e) => setOrg(e.target.value)} title="GitHub Org">
          <option value="">All orgs</option>
          {orgOptions.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      )}

      <DateRangePicker preset={preset} range={range} onPreset={handlePreset} onRange={handleRange} />

      <div className="gen-panel__actions">
        <button type="button" className="btn btn--primary btn--sm" onClick={() => onGenerate(org, range.from, range.to)}>Generate</button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function InsightsTab({
  ctx,
  blueprintId,
  workflowId,
  copilotOrgUsageBlueprint,
  orgId,
  range,
  selectedOrg,
  orgOptions,
}: {
  ctx: PortCtx | null;
  blueprintId: string | null;
  workflowId: string | null;
  copilotOrgUsageBlueprint: string | null;
  orgId: string | null;
  range: DateRange;
  selectedOrg: string | null;
  orgOptions: OrgOption[];
}) {
  const [generating, setGenerating] = useState(false);
  const [showPanel, setShowPanel] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [periodFrom, setPeriodFrom] = useState(range.from);
  const [periodTo, setPeriodTo] = useState(range.to);
  // prevGenAt: detect when a new insight entity lands; prevRunId: ignore the old terminal
  // run that existed before we triggered so it doesn't immediately reset generating.
  const triggeredRef = useRef<{ prevGenAt: string | null; prevRunId: string | null } | null>(null);

  // Keep period pre-fill in sync with the filter bar range.
  useEffect(() => {
    setPeriodFrom(range.from);
    setPeriodTo(range.to);
  }, [range.from, range.to]);

  const insightsQuery = useInsights(ctx, blueprintId, generating, false, selectedOrg);
  const allInsights = insightsQuery.data ?? [];
  const safeIdx = allInsights.length > 0 ? Math.min(selectedIdx, allInsights.length - 1) : 0;
  const insight: CopilotInsight | null = allInsights[safeIdx] ?? null;

  // Track the previous render's active-run state in a ref so we can pass it as the
  // `fast` flag to the next render of useLatestWorkflowRun — fixing the page-refresh
  // case where `generating` is false but a run is actually in-flight.
  const wasActiveRunRef = useRef(false);
  const latestRunQuery = useLatestWorkflowRun(ctx, workflowId, generating || wasActiveRunRef.current);
  const latestRun = latestRunQuery.data ?? null;
  const isActiveRun = latestRun?.status === "in_progress" || latestRun?.status === "waiting";
  wasActiveRunRef.current = isActiveRun;

  // Poll the run that created the currently-displayed insight (stops automatically when terminal).
  const insightRunStatus = useRunStatus(ctx, insight?.runId).data ?? null;
  // If the insight has run_id → use its precise polled status.
  // If no run_id but an insight entity exists → it was created by a successful run
  //   (a failed run never produces an insight entity), so "success" is always correct.
  // If there is no insight at all → no badge.
  const metaRunStatus: NormalizedRunStatus | null = insightRunStatus ?? (insight ? "success" : null);

  // ── Effects ───────────────────────────────────────────────────────────────────

  // Auto-navigate to new insight and clear generating whenever a new period appears.
  // triggeredRef is NOT cleared by the run-terminal effect so this detector stays
  // active even after the run status resolves — ensuring the Period selector always
  // jumps to the new entry when it lands.
  useEffect(() => {
    if (!triggeredRef.current) return;
    const curGenAt = allInsights[0]?.generatedAt ?? null;
    if (curGenAt !== triggeredRef.current.prevGenAt) {
      setGenerating(false);
      setSelectedIdx(0);
      triggeredRef.current = null;
    }
  }, [allInsights]);

  // Clear generating only on failure/cancelled — NOT on success.
  // On success, generating stays true so useInsights keeps polling at 8s and the
  // new-insight detector above is guaranteed to catch the new entry within one poll cycle.
  // Clearing on success here would drop the interval to 30s, causing a ~15s visible delay.
  useEffect(() => {
    if (!generating || !triggeredRef.current) return;
    const status = latestRun?.status;
    if (status !== "failure" && status !== "cancelled") return;
    if (latestRun?.identifier && latestRun.identifier !== triggeredRef.current.prevRunId) {
      setGenerating(false);
      triggeredRef.current = null;
    }
  }, [generating, latestRun?.status, latestRun?.identifier]);

  // 3-minute failsafe for workflows that hang without producing an insight or terminal status.
  useEffect(() => {
    if (!generating) return;
    const t = setTimeout(() => {
      setGenerating(false);
      triggeredRef.current = null;
    }, 3 * 60 * 1000);
    return () => clearTimeout(t);
  }, [generating]);

  const handlePanelGenerate = async (org: string, from: string, to: string) => {
    if (!ctx || !workflowId) return;
    if (isActiveRun || generating) return; // only one run at a time — check before closing panel
    setShowPanel(false);
    triggeredRef.current = { prevGenAt: allInsights[0]?.generatedAt ?? null, prevRunId: latestRun?.identifier ?? null };
    setGenerating(true);
    try {
      await triggerWorkflow(ctx, workflowId, {
        period_from: from,
        period_to: to,
        ...(copilotOrgUsageBlueprint ? { metrics_blueprint: copilotOrgUsageBlueprint } : {}),
        ...(org ? { org_filter: org } : {}),
      });
    } catch {
      setGenerating(false);
      triggeredRef.current = null;
    }
  };

  const handleCancel = () => {
    if (!ctx) return;
    // latestRun is already fresh — polled every 1s while generating.
    // Cancel before clearing state so the identifier is still in scope.
    const id = latestRun?.identifier;
    if (id) {
      portFetch(ctx, `/v1/workflows/runs/${encodeURIComponent(id)}/cancel?force=true`, {
        method: "POST",
      }).catch(() => null);
    }
    setGenerating(false);
    triggeredRef.current = null;
  };

  const handleRefresh = () => {
    setGenerating(false);
    triggeredRef.current = null;
    void insightsQuery.refetch();
  };

  const portalOrigin = (() => {
    try { return new URL(document.referrer).origin; } catch { return "https://app.getport.io"; }
  })();

  const workflowUrl = workflowId
    ? orgId
      ? `${portalOrigin}/${orgId}/settings/workflows/${encodeURIComponent(workflowId)}`
      : `${portalOrigin}/settings/workflows/${encodeURIComponent(workflowId)}`
    : `${portalOrigin}/settings/workflows`;

  const runUrl = latestRun?.identifier && orgId
    ? `${portalOrigin}/${orgId}/organization/workflow-run?runId=${latestRun.identifier}`
    : null;

  if (!blueprintId) {
    return (
      <div className="state state--empty insights__setup">
        <div className="insights__empty-icon"><SparkleIcon /></div>
        <div className="state__title">Insights not configured</div>
        <p className="muted">
          Set the <strong>Copilot Insights Blueprint</strong> widget parameter to enable
          AI-generated adoption summaries.
        </p>
      </div>
    );
  }

  const hasFindings = (insight?.findings?.length ?? 0) > 0;
  const hasRisks = (insight?.riskSignals?.length ?? 0) > 0;

  return (
    <div className="insights">

      {/* Header */}
      <div className={`insights__header${showPanel ? " insights__header--open" : ""}`}>
        <span className="insights__icon"><SparkleIcon /></span>
        <span className="insights__heading">Copilot Insights</span>
        <a
          href={workflowUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn--ghost btn--sm"
        >
          ↗ View workflow
        </a>
        {(generating || isActiveRun) && runUrl && (
          <a
            href={runUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn--ghost btn--sm"
          >
            ↗ View run
          </a>
        )}
        {workflowId && (
          <button
            type="button"
            className="btn btn--primary btn--sm"
            onClick={() => setShowPanel((v) => !v)}
            disabled={generating || isActiveRun || insightsQuery.isPending || insightsQuery.isFetching}
          >
            {generating || isActiveRun
              ? <><span className="btn-spinner" aria-hidden="true" /> Generating…</>
              : showPanel ? "Cancel" : "Generate"}
          </button>
        )}
      </div>

      {showPanel && (
        <GeneratePanel
          orgOptions={orgOptions}
          defaultOrg={selectedOrg ?? ""}
          defaultFrom={periodFrom}
          defaultTo={periodTo}
          onCancel={() => setShowPanel(false)}
          onGenerate={handlePanelGenerate}
        />
      )}

      {/* Period / history selector — always shown when at least one insight exists */}
      {allInsights.length > 0 && (() => {
        const MAX_SHOWN = 10;
        const visible = allInsights.slice(0, MAX_SHOWN);
        const capped = allInsights.length > MAX_SHOWN;
        return (
          <div className="insights__period-bar">
            <span className="insights__period-label">Period</span>
            {visible.length === 1 ? (
              <span className="insights__period-value">
                {formatPeriod(visible[0].period)}
                {visible[0].org && <span className="muted"> · {visible[0].org}</span>}
                {visible[0].generatedAt && (
                  <span className="insights__period-gendate muted">
                    {" "}· Generated {formatShortDate(visible[0].generatedAt)}
                  </span>
                )}
              </span>
            ) : (
              <select
                className="insights__period-select"
                value={selectedIdx}
                onChange={(e) => setSelectedIdx(+e.target.value)}
              >
                {visible.map((ins, i) => (
                  <option key={ins.identifier} value={i}>
                    {formatPeriod(ins.period)}
                    {ins.org ? ` · ${ins.org}` : ""}
                    {ins.generatedAt ? ` · Generated ${formatShortDate(ins.generatedAt)}` : ""}
                    {i === 0 ? " (latest)" : ""}
                  </option>
                ))}
              </select>
            )}
            <span className="insights__period-hint muted">
              {capped ? `${MAX_SHOWN} most recent completed` : `${visible.length} completed`}
            </span>
          </div>
        );
      })()}

      {/* Meta row */}
      {insight?.generatedAt && (
        <div className="insights__meta muted">
          <span>Generated {formatDate(insight.generatedAt)}</span>
          <span className="insights__meta-sep">·</span>
          <span>{formatRelativeTime(insight.generatedAt)}</span>
          {insight.period && !insight.period.startsWith(".") && (
            <>
              <span className="insights__meta-sep">·</span>
              <span>{formatPeriod(insight.period)}</span>
            </>
          )}
          {insight.org && (
            <>
              <span className="insights__meta-sep">·</span>
              <span>{insight.org}</span>
            </>
          )}
          {runUrl && (
            <>
              <span className="insights__meta-sep">·</span>
              <a
                href={runUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="insights__meta-link"
              >
                ↗ View run
              </a>
            </>
          )}
          {metaRunStatus && (
            <>
              <span className="insights__meta-sep">·</span>
              <RunStatusBadge status={metaRunStatus} />
            </>
          )}
        </div>
      )}

      {/* Error */}
      {insightsQuery.isError && (
        <div className="insights__error">
          <strong>Could not load insights</strong>
          <span className="muted">
            {(insightsQuery.error as Error)?.message ?? "Unknown error"}
          </span>
          <button type="button" className="btn btn--ghost btn--sm" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      )}

      {/* Generating banner — only when there's no existing insight to show */}
      {generating && !insight && <GeneratingBanner onRefresh={handleRefresh} />}

      {/* Content */}
      {insightsQuery.isLoading ? (
        <LoadingState label="Loading insights…" />
      ) : !insight ? (
        !generating && (
          <InsightsEmptyState onGenerate={workflowId ? () => setShowPanel(true) : undefined} />
        )
      ) : (
        <div className="insights__content">

          {insight.summary && (
            <div className="insight-summary">
              <div className="insight-summary__label">Executive Summary</div>
              <p className="insight-summary__body">{insight.summary}</p>
              {insight.confidenceNote && (
                <p className="insight-summary__note">{insight.confidenceNote}</p>
              )}
            </div>
          )}

          {hasFindings && (
            <div className="insight-card">
              <div className="insight-card__header">
                <span className="insight-card__title">Findings &amp; Recommendations</span>
                <span className="insight-card__count">{Math.min(insight.findings!.length, 10)} findings</span>
              </div>
              <FindingsTable findings={insight.findings!.slice(0, 10)} />
            </div>
          )}

          {hasRisks && (
            <div className="insight-card insight-card--risks">
              <div className="insight-card__header">
                <span className="insight-card__title">Watch Points</span>
              </div>
              <ul className="insight-card__list">
                {insight.riskSignals!.slice(0, 3).map((r, i) => (
                  <li key={i} className="insight-card__item insight-card__item--risk">
                    <span className="insight-card__item-icon">!</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
