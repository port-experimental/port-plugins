import React, { useEffect, useMemo, useState, useRef, type ReactNode } from "react";
import "./App.css";
import { usePostMessageData } from "./hooks/usePostMessageData";
import { useMetrics } from "./hooks/useMetrics";
import { configFromParams } from "./utils/config";
import { defaultWidgetSettings, loadView, saveView, viewKey } from "./utils/view";
import type { WidgetSettings } from "./utils/view";
import {
  acceptanceRateSeries,
  activeUsersSeries,
  breakdownTimeSeries,
  buildBreakdown,
  computeTotals,
  locSeries,
  prActivitySeries,
  prCycleTimeSeries,
  presetRange,
  suggestionsSeries,
  surfaceSeries,
} from "./utils/aggregations";
import {
  ACCEPTANCE_RATE_SERIES,
  ACTIVE_USER_SERIES,
  AGGREGATION_OPTS,
  BREAKDOWN_DIMENSIONS,
  BREAKDOWN_METRIC_LABELS,
  BREAKDOWN_METRICS,
  GRANULARITY_OPTS,
  LOC_SERIES,
  PR_ACTIVITY_SERIES,
  PR_CYCLE_TIME_SERIES,
  SUGGESTION_SERIES,
  SURFACE_SERIES,
} from "./utils/constants";
import { fmtCompact, fmtInt, fmtMinutes } from "./utils/format";
import type {
  AggregationMode,
  BreakdownDimension,
  BreakdownMetric,
  DailyMetric,
  DateRange,
  Granularity,
  OrgOption,
  TabKey,
} from "./types";

import { portFetch } from "./api/portFetch";
import { FilterBar } from "./components/FilterBar";
import { InlineSelect } from "./components/InlineSelect";
import { KpiStrip } from "./components/KpiStrip";
import { Section } from "./components/Section";
import { LineChart } from "./components/charts/LineChart";
import { GroupedBars } from "./components/charts/GroupedBars";
import { RankedBreakdown } from "./components/RankedBreakdown";
import { LoadingState } from "./components/LoadingState";
import { ErrorBanner } from "./components/ErrorBanner";
import { EmptyState } from "./components/EmptyState";
import { InsightsTab } from "./components/InsightsTab";

function ShellMessage({ children }: { children: ReactNode }) {
  return (
    <div className="shell shell--message">
      <p className="muted">{children}</p>
    </div>
  );
}

const TABS: { key: TabKey; label: string }[] = [
  { key: "adoption", label: "Adoption & Engagement" },
  { key: "usage", label: "Usage & Acceptance" },
  { key: "insights", label: "AI Insights" },
];

export function App() {
  const { params, portToken, portApiBaseUrl, page } = usePostMessageData();
  const config = configFromParams(params);

  // ── Filter state (all hooks before any early return) ─────────────────────
  // Hydrate from the last-used "view" persisted in localStorage; fall back to
  // defaults on first load or when storage is unavailable.
  const [saved] = useState(() => loadView());
  const [tab, setTab] = useState<TabKey>(saved?.tab ?? "adoption");
  const [preset, setPreset] = useState<number | null>(
    saved ? saved.preset ?? null : 30
  );
  const [range, setRange] = useState<DateRange>(
    () => saved?.range ?? presetRange(30)
  );
  const [dimension, setDimension] = useState<BreakdownDimension>(
    saved?.dimension ?? "language"
  );
  const [metric, setMetric] = useState<BreakdownMetric>(
    saved?.metric ?? "codeAcceptanceActivityCount"
  );
  const [selectedOrg, setSelectedOrg] = useState<string | null>(
    saved?.selectedOrg ?? null
  );

  // Per-widget granularity + aggregation, persisted as part of the saved view.
  const [ws, setWs] = useState<WidgetSettings>(
    () => saved?.widgetSettings ?? defaultWidgetSettings("day")
  );
  const patchWs = (patch: Partial<WidgetSettings>) =>
    setWs((prev) => ({ ...prev, ...patch }));

  // Track the "saved defaults" snapshot.
  // When nothing has been saved yet, seed with the initial defaults so the
  // button only appears after the user actually changes something.
  const [savedKey, setSavedKey] = useState<string>(() => {
    if (saved) return viewKey(saved);
    return viewKey({
      tab: "adoption",
      preset: 30,
      range: presetRange(30),
      dimension: "language",
      metric: "codeAcceptanceActivityCount",
      selectedOrg: null,
      widgetSettings: defaultWidgetSettings("day"),
    });
  });

  const currentView = useMemo(
    () => ({ tab, preset, range, dimension, metric, selectedOrg, widgetSettings: ws }),
    [tab, preset, range, dimension, metric, selectedOrg, ws]
  );
  const isDirty = useMemo(
    () => savedKey !== viewKey(currentView),
    [savedKey, currentView]
  );

  const handleSaveView = () => {
    saveView(currentView);
    setSavedKey(viewKey(currentView));
  };

  const handleResetView = () => {
    const base = saved ?? {
      tab: "adoption" as TabKey,
      preset: 30 as number | null,
      range: presetRange(30),
      dimension: "language" as BreakdownDimension,
      metric: "codeAcceptanceActivityCount" as BreakdownMetric,
      selectedOrg: null as string | null,
      widgetSettings: defaultWidgetSettings("day"),
    };
    setTab(base.tab ?? "adoption");
    setPreset(base.preset ?? 30);
    setRange(base.range ?? presetRange(30));
    setDimension(base.dimension ?? "language");
    setMetric(base.metric ?? "codeAcceptanceActivityCount");
    setSelectedOrg(base.selectedOrg ?? null);
    setWs(base.widgetSettings ?? defaultWidgetSettings("day"));
  };

  const ctx =
    portToken && portApiBaseUrl
      ? { token: portToken, baseUrl: portApiBaseUrl }
      : null;

  const [orgId, setOrgId] = useState<string | null>(null);
  const orgFetchedRef = useRef(false);
  useEffect(() => {
    if (!ctx || orgFetchedRef.current) return;
    orgFetchedRef.current = true;
    portFetch<{ organization?: { identifier?: string; id?: string } }>(ctx, "/v1/organization")
      .then((d) => setOrgId(d.organization?.identifier ?? d.organization?.id ?? null))
      .catch(() => null);
  }, [ctx]);

  const fetchArgs = config
    ? { blueprint: config.metricsBlueprint.identifier, dayProp: config.dayProp }
    : null;

  const query = useMetrics(ctx, fetchArgs, range, page);

  const rawMetrics = useMemo(() => query.data ?? [], [query.data]);

  // Derive unique orgs — keyed strictly by organizationId (never entity title).
  // OrgFilter only renders when 2+ distinct IDs exist.
  const orgOptions = useMemo<OrgOption[]>(() => {
    const seen = new Map<string, string>();
    for (const m of rawMetrics) {
      const id = m.organizationId;
      if (id && !seen.has(id)) seen.set(id, m.orgName ?? id);
    }
    return [...seen.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [rawMetrics]);

  // Filter by selected org — null means all.
  const metrics = useMemo(() => {
    if (!selectedOrg) return rawMetrics;
    return rawMetrics.filter((m) => m.organizationId === selectedOrg);
  }, [rawMetrics, selectedOrg]);

  const seats = config?.licensedSeats ?? null;
  const totals = useMemo(
    () => computeTotals(metrics, seats, "avg"),
    [metrics, seats]
  );

  const handlePreset = (days: number) => {
    setPreset(days);
    setRange(presetRange(days));
  };
  const handleRange = (r: DateRange) => {
    setPreset(null);
    setRange(r);
  };

  // ── Early exits ──────────────────────────────────────────────────────────
  if (!portApiBaseUrl || !portToken) {
    return <ShellMessage>Waiting for Port context…</ShellMessage>;
  }
  if (!config) {
    return (
      <ShellMessage>
        Configure the <strong>GitHub Copilot Org Usage blueprint</strong>{" "}
        parameter for this widget.
      </ShellMessage>
    );
  }

  const loading = query.isPending;
  const errored = query.isError;

  return (
    <div className="shell">
      <div className="tabs" role="tablist" aria-label="Dashboard view">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            className={`tab ${tab === t.key ? "tab--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "insights" ? (
        <InsightsTab
          ctx={ctx}
          blueprintId={config.copilotInsightsBlueprint?.identifier ?? null}
          workflowId={config.copilotInsightsAction}
          metricsBlueprint={config.metricsBlueprint.identifier}
          orgId={orgId}
          range={range}
          selectedOrg={selectedOrg}
          orgOptions={orgOptions}
        />
      ) : (
        <>
          <FilterBar
            preset={preset}
            range={range}
            orgOptions={orgOptions}
            selectedOrg={selectedOrg}
            isDirty={isDirty}
            onPreset={handlePreset}
            onRange={handleRange}
            onOrg={setSelectedOrg}
            onSave={handleSaveView}
            onReset={handleResetView}
          />

          {errored ? (
            <ErrorBanner
              message={(query.error as Error | null)?.message}
              onRetry={() => query.refetch()}
            />
          ) : loading ? (
            <LoadingState label="Loading usage metrics…" />
          ) : metrics.length === 0 ? (
            <EmptyState
              title="No usage data in range"
              hint={`No "${config.metricsBlueprint.identifier}" entities between ${range.from} and ${range.to}.`}
            />
          ) : (
            <>
              <KpiStrip
                current={totals}
                previous={null}
                seatsConfigured={seats != null}
              />

              {tab === "adoption" ? (
                <AdoptionTab
                  metrics={metrics}
                  compareMetrics={null}
                  ws={ws}
                  onWs={patchWs}
                />
              ) : (
                <UsageTab
                  metrics={metrics}
                  compareMetrics={null}
                  ws={ws}
                  onWs={patchWs}
                  dimension={dimension}
                  metric={metric}
                  onDimension={setDimension}
                  onMetric={setMetric}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}


// ── Tab 1: Adoption & Engagement ──────────────────────────────────────────────

function AdoptionTab({
  metrics,
  compareMetrics,
  ws,
  onWs,
}: {
  metrics: DailyMetric[];
  compareMetrics: DailyMetric[] | null;
  ws: WidgetSettings;
  onWs: (patch: Partial<WidgetSettings>) => void;
}) {
  const users = useMemo(
    () => activeUsersSeries(metrics, ws.granActiveUsers, ws.aggActiveUsers),
    [metrics, ws.granActiveUsers, ws.aggActiveUsers]
  );
  const usersCmp = useMemo(
    () => compareMetrics ? activeUsersSeries(compareMetrics, ws.granActiveUsers, ws.aggActiveUsers) : null,
    [compareMetrics, ws.granActiveUsers, ws.aggActiveUsers]
  );
  const surfaces = useMemo(
    () => surfaceSeries(metrics, ws.granActiveSurface, ws.aggActiveSurface),
    [metrics, ws.granActiveSurface, ws.aggActiveSurface]
  );
  const surfacesCmp = useMemo(
    () => compareMetrics ? surfaceSeries(compareMetrics, ws.granActiveSurface, ws.aggActiveSurface) : null,
    [compareMetrics, ws.granActiveSurface, ws.aggActiveSurface]
  );
  return (
    <div className="grid grid--2">
      <Section
        title="Active users"
        hint="DAU · WAU · MAU"
        right={
          <div className="section__inline-controls">
            <InlineSelect<Granularity> value={ws.granActiveUsers} options={GRANULARITY_OPTS} onChange={(v) => onWs({ granActiveUsers: v })} />
            {ws.granActiveUsers !== "day" && <InlineSelect<AggregationMode> value={ws.aggActiveUsers} options={AGGREGATION_OPTS} onChange={(v) => onWs({ aggActiveUsers: v })} />}
          </div>
        }
      >
        <LineChart data={users} series={ACTIVE_USER_SERIES} compareData={usersCmp} format={fmtInt} ariaLabel="Active users over time" />
      </Section>

      <Section
        title="Active users by surface"
        hint="daily active — surfaces overlap, not additive"
        right={
          <div className="section__inline-controls">
            <InlineSelect<Granularity> value={ws.granActiveSurface} options={GRANULARITY_OPTS} onChange={(v) => onWs({ granActiveSurface: v })} />
            {ws.granActiveSurface !== "day" && <InlineSelect<AggregationMode> value={ws.aggActiveSurface} options={AGGREGATION_OPTS} onChange={(v) => onWs({ aggActiveSurface: v })} />}
          </div>
        }
      >
        <LineChart data={surfaces} series={SURFACE_SERIES} compareData={surfacesCmp} format={fmtInt} ariaLabel="Active users by surface over time" />
      </Section>
    </div>
  );
}

// ── Tab 2: Usage & Acceptance ─────────────────────────────────────────────────

function UsageTab({
  metrics,
  compareMetrics,
  ws,
  onWs,
  dimension,
  metric,
  onDimension,
  onMetric,
}: {
  metrics: DailyMetric[];
  compareMetrics: DailyMetric[] | null;
  ws: WidgetSettings;
  onWs: (patch: Partial<WidgetSettings>) => void;
  dimension: BreakdownDimension;
  metric: BreakdownMetric;
  onDimension: (d: BreakdownDimension) => void;
  onMetric: (m: BreakdownMetric) => void;
}) {
  const suggestions = useMemo(
    () => suggestionsSeries(metrics, ws.granSuggestions),
    [metrics, ws.granSuggestions]
  );
  const suggestionsCmp = useMemo(
    () => (compareMetrics ? suggestionsSeries(compareMetrics, ws.granSuggestions) : null),
    [compareMetrics, ws.granSuggestions]
  );
  const acceptance = useMemo(
    () => acceptanceRateSeries(metrics, ws.granAcceptance, ws.aggAcceptance),
    [metrics, ws.granAcceptance, ws.aggAcceptance]
  );
  const acceptanceCmp = useMemo(
    () => (compareMetrics ? acceptanceRateSeries(compareMetrics, ws.granAcceptance, ws.aggAcceptance) : null),
    [compareMetrics, ws.granAcceptance, ws.aggAcceptance]
  );
  const loc = useMemo(() => locSeries(metrics, ws.granLoc), [metrics, ws.granLoc]);
  const locCmp = useMemo(
    () => (compareMetrics ? locSeries(compareMetrics, ws.granLoc) : null),
    [compareMetrics, ws.granLoc]
  );
  const prs = useMemo(() => prActivitySeries(metrics, ws.granPrActivity), [metrics, ws.granPrActivity]);
  const prsCmp = useMemo(
    () => (compareMetrics ? prActivitySeries(compareMetrics, ws.granPrActivity) : null),
    [compareMetrics, ws.granPrActivity]
  );
  const cycleTime = useMemo(
    () => prCycleTimeSeries(metrics, ws.granCycleTime, ws.aggCycleTime),
    [metrics, ws.granCycleTime, ws.aggCycleTime]
  );
  const cycleTimeCmp = useMemo(
    () => (compareMetrics ? prCycleTimeSeries(compareMetrics, ws.granCycleTime, ws.aggCycleTime) : null),
    [compareMetrics, ws.granCycleTime, ws.aggCycleTime]
  );
  const breakdown = useMemo(() => buildBreakdown(metrics, dimension), [metrics, dimension]);
  const breakdownCmp = useMemo(
    () => (compareMetrics ? buildBreakdown(compareMetrics, dimension) : null),
    [compareMetrics, dimension]
  );
  const dimTrend = useMemo(
    () => breakdownTimeSeries(metrics, ws.granDimTrend, dimension, metric),
    [metrics, ws.granDimTrend, dimension, metric]
  );
  const dimTrendCmp = useMemo(
    () => compareMetrics ? breakdownTimeSeries(compareMetrics, ws.granDimTrend, dimension, metric) : null,
    [compareMetrics, ws.granDimTrend, dimension, metric]
  );

  const dimLabel =
    dimension === "ide" ? "IDE"
    : dimension === "feature" ? "feature"
    : dimension === "language" ? "language"
    : "model";

  return (
    <>
      <div className="grid grid--2">
        <Section
          title="Suggestions vs. acceptances"
          hint="activity count"
          right={
            <InlineSelect<Granularity> value={ws.granSuggestions} options={GRANULARITY_OPTS} onChange={(v) => onWs({ granSuggestions: v })} />
          }
        >
          <GroupedBars data={suggestions} series={SUGGESTION_SERIES} compareData={suggestionsCmp} format={fmtCompact} ariaLabel="Suggestions vs acceptances over time" />
        </Section>

        <Section
          title="Acceptance rate"
          hint="% of suggestions / lines accepted"
          right={
            <div className="section__inline-controls">
              <InlineSelect<Granularity> value={ws.granAcceptance} options={GRANULARITY_OPTS} onChange={(v) => onWs({ granAcceptance: v })} />
              {ws.granAcceptance !== "day" && <InlineSelect<AggregationMode> value={ws.aggAcceptance} options={AGGREGATION_OPTS} onChange={(v) => onWs({ aggAcceptance: v })} />}
            </div>
          }
        >
          <LineChart data={acceptance} series={ACCEPTANCE_RATE_SERIES} compareData={acceptanceCmp} format={(v) => `${v}%`} maxOverride={100} ariaLabel="Acceptance rate over time" />
        </Section>
      </div>

      <Section
        title="Lines of code — suggested vs. accepted"
        hint="LOC added"
        right={
          <InlineSelect<Granularity> value={ws.granLoc} options={GRANULARITY_OPTS} onChange={(v) => onWs({ granLoc: v })} />
        }
      >
        <GroupedBars data={loc} series={LOC_SERIES} compareData={locCmp} format={fmtCompact} ariaLabel="Lines suggested vs accepted over time" />
      </Section>

      <div className="grid grid--2">
        <Section
          title="Copilot PR activity"
          hint="created + reviewed by Copilot"
          right={
            <InlineSelect<Granularity> value={ws.granPrActivity} options={GRANULARITY_OPTS} onChange={(v) => onWs({ granPrActivity: v })} />
          }
        >
          <LineChart data={prs} series={PR_ACTIVITY_SERIES} compareData={prsCmp} format={fmtInt} ariaLabel="Copilot PR activity over time" />
        </Section>

        <Section
          title="PR cycle time"
          hint="median minutes to merge (all org PRs)"
          right={
            <div className="section__inline-controls">
              <InlineSelect<Granularity> value={ws.granCycleTime} options={GRANULARITY_OPTS} onChange={(v) => onWs({ granCycleTime: v })} />
              {ws.granCycleTime !== "day" && <InlineSelect<AggregationMode> value={ws.aggCycleTime} options={AGGREGATION_OPTS} onChange={(v) => onWs({ aggCycleTime: v })} />}
            </div>
          }
        >
          <LineChart data={cycleTime} series={PR_CYCLE_TIME_SERIES} compareData={cycleTimeCmp} format={fmtMinutes} area ariaLabel="PR cycle time over time" />
        </Section>
      </div>

      {dimTrend.points.length > 0 && (
        <Section
          title={`${BREAKDOWN_METRIC_LABELS[metric]} by ${dimLabel} over time`}
          hint={`top ${dimTrend.series.length} ${dimLabel}s · ranked by total`}
          right={
            <div className="section__inline-controls">
              <InlineSelect<Granularity> value={ws.granDimTrend} options={GRANULARITY_OPTS} onChange={(v) => onWs({ granDimTrend: v })} />
              <InlineSelect<BreakdownDimension> value={dimension} options={BREAKDOWN_DIMENSIONS} onChange={onDimension} />
              <InlineSelect<BreakdownMetric> value={metric} options={BREAKDOWN_METRICS} onChange={onMetric} />
            </div>
          }
        >
          <LineChart data={dimTrend.points} series={dimTrend.series} compareData={dimTrendCmp?.points ?? null} format={fmtCompact} ariaLabel={`${metric} by ${dimLabel} over time`} />
        </Section>
      )}

      <Section
        title={`Usage by ${dimLabel}`}
        hint="summed across the range"
        right={
          <div className="section__inline-controls">
            <InlineSelect<BreakdownDimension> value={dimension} options={BREAKDOWN_DIMENSIONS} onChange={onDimension} />
            <InlineSelect<BreakdownMetric> value={metric} options={BREAKDOWN_METRICS} onChange={onMetric} />
          </div>
        }
      >
        <RankedBreakdown rows={breakdown} metric={metric} compareRows={breakdownCmp} />
      </Section>
    </>
  );
}
