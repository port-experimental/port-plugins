import { DEV_MOCK } from "../hooks/usePostMessageData";
import { delay, portFetch, type PortCtx } from "./portFetch";
import type { CopilotInsight, InsightFinding, Entity } from "../types";

// ── Property helpers ──────────────────────────────────────────────────────────

function strProp(props: Record<string, unknown> | undefined, key: string): string | undefined {
  const v = props?.[key];
  return typeof v === "string" ? v : undefined;
}

function arrProp(props: Record<string, unknown> | undefined, key: string): string[] {
  const v = props?.[key];
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string" && v.trim()) {
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed.filter((x): x is string => typeof x === "string");
    } catch {
      /* not JSON */
    }
    return v.split("\n").map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function strArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  return [];
}

type ParsedResponse = {
  summary?: string;
  findings?: unknown[];
  key_findings?: unknown[];
  recommendations?: unknown[];
  risk_signals?: unknown[];
  confidence_note?: string;
};

function toFinding(f: unknown): InsightFinding | null {
  if (!f || typeof f !== "object") return null;
  const obj = f as Record<string, unknown>;
  const insight =
    typeof obj.insight === "string" ? obj.insight :
    typeof obj.text === "string" ? obj.text : null;
  if (!insight) return null;
  const sev = obj.severity;
  const conf = obj.confidence;
  return {
    insight,
    category: typeof obj.category === "string" ? obj.category : undefined,
    impact: typeof obj.impact === "string" ? obj.impact : undefined,
    evidence: typeof obj.evidence === "string" ? obj.evidence : undefined,
    severity: (sev === "High" || sev === "Medium" || sev === "Low") ? sev : undefined,
    confidence: (conf === "High" || conf === "Medium" || conf === "Low") ? conf : undefined,
    recommendedAction: typeof obj.recommended_action === "string" ? obj.recommended_action : undefined,
  };
}

function toInsight(e: Entity): CopilotInsight {
  const p = e.properties ?? {};

  let parsed: ParsedResponse = {};
  const raw = strProp(p, "raw_response");
  if (raw) {
    try { parsed = JSON.parse(raw) as ParsedResponse; } catch { /* ignore */ }
  }

  let findings: InsightFinding[] = [];
  if (Array.isArray(parsed.findings)) {
    // Use new format unconditionally — an empty array means no findings, not "try legacy".
    findings = parsed.findings.map(toFinding).filter((f): f is InsightFinding => f !== null);
  } else {
    // Backwards compat: old format with separate string arrays
    const kf = strArr(parsed.key_findings);
    const recs = strArr(parsed.recommendations);
    findings = [
      ...kf.map(s => ({ insight: s, severity: "Medium" as const, confidence: "Medium" as const })),
      ...recs.map(s => ({ insight: s, severity: "Low" as const, confidence: "Medium" as const, recommendedAction: s })),
    ];
    if (findings.length === 0) {
      findings = [
        ...arrProp(p, "key_findings").map(s => ({ insight: s, severity: "Medium" as const, confidence: "Medium" as const })),
        ...arrProp(p, "recommendations").map(s => ({ insight: s, severity: "Low" as const, confidence: "Medium" as const, recommendedAction: s })),
      ];
    }
  }

  return {
    identifier: e.identifier,
    title: e.title,
    period: strProp(p, "period"),
    generatedAt: strProp(p, "generated_at") ?? e.updatedAt,
    runId: strProp(p, "run_id"),
    org: strProp(p, "org") ?? "",
    summary: parsed.summary ?? strProp(p, "summary"),
    findings,
    riskSignals: Array.isArray(parsed.risk_signals) ? strArr(parsed.risk_signals) : arrProp(p, "risk_signals"),
    confidenceNote: parsed.confidence_note ?? strProp(p, "confidence_note"),
  };
}

// ── API calls ─────────────────────────────────────────────────────────────────

/**
 * Fetch all entities from the Copilot insights blueprint, sorted newest-first.
 */
export async function fetchAllInsights(
  ctx: PortCtx,
  blueprintId: string,
  orgFilter: string | null = null
): Promise<CopilotInsight[]> {
  if (DEV_MOCK) {
    await delay();
    return [];
  }

  const data = await portFetch<{ entities: Entity[] }>(
    ctx,
    `/v1/blueprints/${encodeURIComponent(blueprintId)}/entities/search`,
    {
      method: "POST",
      body: JSON.stringify({ query: { combinator: "and", rules: [] }, limit: 50 }),
    }
  );

  const entities = data.entities ?? [];
  if (entities.length === 0) return [];

  const sorted = [...entities].sort((a, b) => {
    const ga = strProp(a.properties, "generated_at") ?? a.updatedAt ?? "";
    const gb = strProp(b.properties, "generated_at") ?? b.updatedAt ?? "";
    return gb.localeCompare(ga);
  });

  const insights = sorted.map(toInsight);

  if (!orgFilter) return insights;
  // Empty org means the insight was generated for all orgs — always include it.
  return insights.filter((i) => !i.org || i.org === orgFilter);
}

/** Trigger a workflow run directly without the Port dialog.
 *  Self-serve workflows are registered as actions in Port's API.
 *  Tries the actions endpoint first, falls back to the workflow runs endpoint. */
export async function triggerWorkflow(
  ctx: PortCtx,
  workflowId: string,
  inputs: Record<string, string>
): Promise<void> {
  if (DEV_MOCK) { await delay(); return; }
  const wid = encodeURIComponent(workflowId);
  const attempts: Array<[string, object]> = [
    [`/v1/actions/${wid}/runs`, { properties: inputs }],
    [`/v1/workflows/${wid}/runs`, { inputs }],
    [`/v1/workflows/${wid}/runs`, { userInputs: inputs }],
  ];
  for (const [path, body] of attempts) {
    try {
      await portFetch(ctx, path, { method: "POST", body: JSON.stringify(body) });
      return;
    } catch {
      // try next format
    }
  }
  throw new Error("Could not trigger workflow — no endpoint responded successfully.");
}
