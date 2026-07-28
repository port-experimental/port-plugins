import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import "./App.css";
import { usePostMessageData } from "./hooks/usePostMessageData";
import { useAllSurveys } from "./hooks/useAllSurveys";
import { useResponsesForSurveys } from "./hooks/useResponsesForSurveys";
import { useCampaignTeams } from "./hooks/useCampaignTeams";
import {
  buildBenchmarkComparison,
  hasResolvableBenchmark,
} from "./benchmarks/compare";
import { configFromParams } from "./utils/config";
import {
  aggregateDimensions,
  aggregateMultiChoice,
  aggregateOverall,
  buildTrend,
  extractTeams,
  teamsResponded as computeTeamsResponded,
} from "./utils/aggregations";
import { FilterBar } from "./components/FilterBar";
import { SummaryStrip } from "./components/SummaryStrip";
import { DimensionBars } from "./components/DimensionBars";
import { TeamHeatmap } from "./components/TeamHeatmap";
import { TrendLine } from "./components/TrendLine";
import { ParticipationTable } from "./components/ParticipationTable";
import { QuestionRanking } from "./components/QuestionRanking";
import { ResponsesTable } from "./components/ResponsesTable";
import { BenchmarkView } from "./components/BenchmarkView";
import { MultiChoiceView } from "./components/MultiChoiceView";
import { LoadingState } from "./components/LoadingState";
import { ErrorBanner } from "./components/ErrorBanner";
import { EmptyState } from "./components/EmptyState";

function ShellMessage({ children }: { children: ReactNode }) {
  return (
    <div className="shell shell--message">
      <p className="muted">{children}</p>
    </div>
  );
}

/** Read a `?survey=<id>` deep link from the embedding page's referrer. */
function surveyFromReferrer(): string | null {
  try {
    const ref = document.referrer;
    return ref ? new URL(ref).searchParams.get("survey") : null;
  } catch {
    return null;
  }
}

export function App() {
  const { params, portToken, portApiBaseUrl } = usePostMessageData();
  const config = configFromParams(params);

  const ctx =
    portToken && portApiBaseUrl
      ? { token: portToken, baseUrl: portApiBaseUrl }
      : null;

  const [primaryId, setPrimaryId] = useState<string | null>(null);
  const [compareId, setCompareId] = useState<string | null>(null);
  const [teamFilter, setTeamFilter] = useState<string>("");
  const [frameworkFilter, setFrameworkFilter] = useState<string>("");
  const [view, setView] = useState<"overview" | "benchmark">("overview");

  const surveysQuery = useAllSurveys(ctx, config?.surveyBlueprint.identifier);
  // Only show published (active or closed) surveys - drafts have no responses.
  const surveys = useMemo(
    () =>
      (surveysQuery.data ?? []).filter(
        (s) => s.status === "active" || s.status === "closed"
      ),
    [surveysQuery.data]
  );

  // Deep link from the builder's "View responses". Primary path: builder writes
  // the survey id to localStorage before navigating; analytics reads it here
  // or via a storage event (handles Port's pre-loaded-iframe SPA pattern where
  // document.referrer is already stale). Fallback: referrer query param.
  const [deepLinkId, setDeepLinkId] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem("__port_analytics_survey");
      if (stored) {
        localStorage.removeItem("__port_analytics_survey");
        return stored;
      }
    } catch {}
    return surveyFromReferrer();
  });

  const appliedDeepLink = useRef(false);

  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key !== "__port_analytics_survey" || !e.newValue) return;
      try { localStorage.removeItem("__port_analytics_survey"); } catch {}
      appliedDeepLink.current = false;
      setDeepLinkId(e.newValue);
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  useEffect(() => {
    if (appliedDeepLink.current || !deepLinkId) return;
    if (surveys.some((s) => s.identifier === deepLinkId)) {
      setPrimaryId(deepLinkId);
      appliedDeepLink.current = true;
    }
  }, [deepLinkId, surveys]);

  // Distinct frameworks present in the published surveys (for the framework filter).
  const frameworks = useMemo(
    () =>
      [...new Set(surveys.map((s) => s.framework).filter((f): f is string => !!f))].sort(),
    [surveys]
  );

  // Surveys visible in the dropdowns, scoped to the selected framework.
  const surveysForDropdown = useMemo(
    () =>
      frameworkFilter
        ? surveys.filter((s) => s.framework === frameworkFilter)
        : surveys,
    [surveys, frameworkFilter]
  );

  // When the framework filter changes, clear primary/compare if they're from a
  // different framework so the dropdowns stay consistent.
  const handleFrameworkChange = (fw: string) => {
    setFrameworkFilter(fw);
    if (fw) {
      if (primaryId && surveys.find((s) => s.identifier === primaryId)?.framework !== fw) {
        setPrimaryId(null);
      }
      if (compareId && surveys.find((s) => s.identifier === compareId)?.framework !== fw) {
        setCompareId(null);
      }
    }
  };

  const sortedForDropdown = useMemo(
    () =>
      [...surveysForDropdown].sort(
        (a, b) =>
          new Date(b.publishedAt ?? b.createdAt ?? 0).getTime() -
          new Date(a.publishedAt ?? a.createdAt ?? 0).getTime()
      ),
    [surveysForDropdown]
  );

  // Auto-select the most recent survey (within selected framework) until user picks one.
  const effectivePrimary = primaryId ?? sortedForDropdown[0]?.identifier ?? null;

  const campaignTeamsQuery = useCampaignTeams(ctx, effectivePrimary);

  // Load responses for ALL surveys (powers the over-time trend).
  const allSurveyIds = useMemo(
    () => surveys.map((s) => s.identifier),
    [surveys]
  );
  const responses = useResponsesForSurveys(
    ctx,
    config
      ? {
          responseBlueprint: config.responseBlueprint.identifier,
          surveyBlueprint: config.surveyBlueprint.identifier,
        }
      : null,
    allSurveyIds
  );

  const primaryMeta = useMemo(
    () => surveys.find((s) => s.identifier === effectivePrimary) ?? null,
    [surveys, effectivePrimary]
  );
  const compareMeta = useMemo(
    () => (compareId ? surveys.find((s) => s.identifier === compareId) ?? null : null),
    [surveys, compareId]
  );

  const primaryAll = effectivePrimary ? responses.byId[effectivePrimary] ?? [] : [];
  const compareAll = compareId ? responses.byId[compareId] ?? [] : [];

  const filteredPrimary = useMemo(
    () => (teamFilter ? primaryAll.filter((r) => r.team === teamFilter) : primaryAll),
    [primaryAll, teamFilter]
  );
  const filteredCompare = useMemo(
    () => (teamFilter ? compareAll.filter((r) => r.team === teamFilter) : compareAll),
    [compareAll, teamFilter]
  );

  // Team dropdown options are scoped to the selected survey(s): a team only
  // appears if it actually has responses here, so you can't filter into an
  // empty view. (When comparing, include teams from the compare survey too.)
  const allTeams = useMemo(
    () => extractTeams([...primaryAll, ...compareAll]),
    [primaryAll, compareAll]
  );

  // If the active team filter has no responses in the current survey, clear it
  // so switching surveys never strands you on a filter that yields nothing.
  useEffect(() => {
    if (teamFilter && !allTeams.includes(teamFilter)) setTeamFilter("");
  }, [teamFilter, allTeams]);

  // ── Early exits ──────────────────────────────────────────────────────────
  if (!portApiBaseUrl || !portToken) {
    return <ShellMessage>Waiting for Port context…</ShellMessage>;
  }
  if (!config) {
    return (
      <ShellMessage>
        Configure both the <strong>Survey blueprint</strong> and{" "}
        <strong>Response blueprint</strong> parameters for this widget.
      </ShellMessage>
    );
  }

  const loading = surveysQuery.isPending || (surveys.length > 0 && responses.isPending);
  const errored = surveysQuery.isError || responses.isError;
  const errorMessage =
    (surveysQuery.error as Error | null)?.message ?? responses.error?.message;

  const primaryDef = primaryMeta?.definition;
  const compareDef = compareMeta?.definition;
  const targets = primaryMeta?.targetRespondents;

  // Benchmark tab - only when the primary survey has questions whose benchmark
  // resolves (bundled or org override). `effectiveView` falls back to overview
  // for non-benchmark surveys without needing an effect to reset `view`.
  const showBenchmarkTab = !!primaryDef && hasResolvableBenchmark(primaryDef);
  const effectiveView = showBenchmarkTab ? view : "overview";
  const benchmarkComparisons =
    effectiveView === "benchmark" && primaryDef
      ? buildBenchmarkComparison(primaryDef, filteredPrimary)
      : [];
  // Multi-select questions carry no score, so they live on the Overview as their
  // own breakdown section (sibling of "Questions ranked by score"). The compare
  // survey is aggregated against the primary definition so options join by value.
  const multiChoiceDetails =
    effectiveView === "overview" && primaryDef
      ? aggregateMultiChoice(primaryDef, filteredPrimary)
      : [];
  const compareMultiChoiceDetails =
    effectiveView === "overview" && primaryDef && compareMeta
      ? aggregateMultiChoice(primaryDef, filteredCompare)
      : undefined;

  const primaryDims = primaryDef ? aggregateDimensions(primaryDef, filteredPrimary) : [];
  const compareDims = compareDef ? aggregateDimensions(compareDef, filteredCompare) : [];

  const overall = aggregateOverall(filteredPrimary);
  const compareOverall = compareMeta ? aggregateOverall(filteredCompare) : undefined;

  // Campaign teams = teams explicitly invited (empty when "all teams" or not shared).
  const campaignTeams = campaignTeamsQuery.data ?? [];
  const campaignTargets: Record<string, number> | undefined =
    campaignTeams.length > 0
      ? Object.fromEntries(campaignTeams.map((t) => [t, 0]))
      : targets;

  const teamsResp = !teamFilter
    ? computeTeamsResponded(primaryAll, campaignTargets ?? targets)
    : undefined;

  const avgPerTeam =
    allTeams.length > 0 ? filteredPrimary.length / allTeams.length : null;

  const weakestDim = (() => {
    const scored = primaryDims.filter((d) => d.score != null) as (typeof primaryDims[0] & { score: number })[];
    if (scored.length === 0) return null;
    return scored.reduce((min, d) => (d.score < min.score ? d : min));
  })();

  // Trend is only meaningful across surveys that share a framework (same
  // dimensions). With more than one survey type present (e.g. SPACE + AI
  // Adoption), scope the over-time trend to the primary survey's framework.
  const primaryFramework = primaryMeta?.framework ?? primaryDef?.framework;
  const trendSurveys = primaryFramework
    ? surveys.filter(
        (s) => (s.framework ?? s.definition.framework) === primaryFramework
      )
    : surveys;

  const trend = primaryDef
    ? buildTrend(
        trendSurveys,
        responses.byId,
        primaryDef.dimensions.map((d) => d.id),
        teamFilter || undefined
      )
    : [];

  const showTeamViews = allTeams.length >= 1 && !teamFilter;
  const showHeatmap = allTeams.length >= 1;

  return (
    <div className="shell">
      <FilterBar
        surveys={surveysForDropdown}
        frameworks={frameworks}
        frameworkFilter={frameworkFilter}
        primaryId={effectivePrimary}
        compareId={compareId}
        teamFilter={teamFilter}
        allTeams={allTeams}
        onFramework={handleFrameworkChange}
        onPrimary={setPrimaryId}
        onCompare={setCompareId}
        onTeam={setTeamFilter}
      />

      {errored ? (
        <ErrorBanner
          message={errorMessage}
          onRetry={() => {
            surveysQuery.refetch();
            responses.refetchAll();
          }}
        />
      ) : loading ? (
        <LoadingState
          label={surveysQuery.isPending ? "Loading surveys…" : "Loading responses…"}
        />
      ) : surveys.length === 0 ? (
        <EmptyState
          title="No surveys found"
          hint={`No entities in the "${config.surveyBlueprint.identifier}" blueprint.`}
        />
      ) : !effectivePrimary ? (
        <EmptyState title="Select a survey" hint="Choose a survey above to see analytics." />
      ) : (
        <>
          {showBenchmarkTab && (
            <div className="tabs" role="tablist" aria-label="Analytics view">
              <button
                type="button"
                role="tab"
                aria-selected={effectiveView === "overview"}
                className={`tab ${effectiveView === "overview" ? "tab--active" : ""}`}
                onClick={() => setView("overview")}
              >
                Overview
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={effectiveView === "benchmark"}
                className={`tab ${effectiveView === "benchmark" ? "tab--active" : ""}`}
                onClick={() => setView("benchmark")}
              >
                Benchmark
              </button>
            </div>
          )}

          {effectiveView === "benchmark" ? (
            <BenchmarkView
              comparisons={benchmarkComparisons}
              teamLabel={teamFilter || undefined}
            />
          ) : filteredPrimary.length === 0 ? (
            <EmptyState
              title="No responses yet"
              hint={
                teamFilter
                  ? `No responses from "${teamFilter}" for this survey.`
                  : "This survey has no responses yet."
              }
            />
          ) : (
            <>
          <SummaryStrip
            count={filteredPrimary.length}
            overall={overall}
            avgPerTeam={avgPerTeam}
            teamsResponded={teamsResp?.responded}
            teamsTotal={teamsResp?.total}
            weakestDim={weakestDim}
            compareOverall={compareOverall}
            compareLabel={compareMeta?.title}
          />

          {primaryDims.length > 0 && (
            <DimensionBars
              dims={primaryDims}
              compareDims={compareMeta ? compareDims : undefined}
              compareLabel={compareMeta?.title}
            />
          )}

          {primaryDef && trend.length >= 1 && (
            <TrendLine
              trend={trend}
              dimensions={primaryDef.dimensions}
              framework={primaryFramework}
              teamLabel={teamFilter || undefined}
            />
          )}

          {showHeatmap && primaryDef && (
            <TeamHeatmap
              def={primaryDef}
              responses={primaryAll}
              compareResponses={compareMeta ? compareAll : undefined}
              compareLabel={compareMeta?.title}
            />
          )}

          {showTeamViews && (campaignTargets ?? targets ?? allTeams.length >= 1) && (
            <ParticipationTable
              responses={primaryAll}
              targets={campaignTargets ?? targets}
            />
          )}

          {primaryDef && (
            <QuestionRanking
              def={primaryDef}
              responses={filteredPrimary}
              compareResponses={compareMeta ? filteredCompare : undefined}
            />
          )}

          {multiChoiceDetails.length > 0 && (
            <MultiChoiceView
              details={multiChoiceDetails}
              compareDetails={compareMeta ? compareMultiChoiceDetails : undefined}
              compareLabel={compareMeta?.title}
              teamLabel={teamFilter || undefined}
            />
          )}

          {primaryDef && (
            <ResponsesTable responses={filteredPrimary} def={primaryDef} />
          )}
            </>
          )}
        </>
      )}
    </div>
  );
}
