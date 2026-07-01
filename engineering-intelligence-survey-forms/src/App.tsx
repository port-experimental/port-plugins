import { useMemo, useState, type ReactNode } from "react";
import "./App.css";
import { usePostMessageData } from "./hooks/usePostMessageData";
import { useActiveSurveys } from "./hooks/useActiveSurveys";
import { useCampaigns } from "./hooks/useCampaigns";
import { useSubmitResponse } from "./hooks/useSubmitResponse";
import { useUserTeams } from "./hooks/useUserTeams";
import { configFromParams } from "./utils/config";
import { filterSharedSurveys } from "./utils/audience";
import { resolveHostSubject } from "./utils/resolveHostEntity";
import { surveyContextFromEntity } from "./utils/surveyContext";
import { SurveyForm } from "./components/SurveyForm";
import { SurveyPicker } from "./components/SurveyPicker";
import { LoadingState } from "./components/LoadingState";
import { ErrorBanner } from "./components/ErrorBanner";
import { EmptyState } from "./components/EmptyState";
import type { Answers } from "./types";

function ShellMessage({ children }: { children: ReactNode }) {
  return (
    <div className="shell shell--message">
      <p className="muted">{children}</p>
    </div>
  );
}

export function App() {
  const { params, entity, user, portToken, portApiBaseUrl } =
    usePostMessageData();
  const config = configFromParams(params);
  const surveyBlueprintId = config?.surveyBlueprint?.identifier ?? null;

  const ctx =
    portToken && portApiBaseUrl
      ? { token: portToken, baseUrl: portApiBaseUrl }
      : null;

  // Look up the current user's teams from Port's user directory. The first is
  // used to tag a response's owning team; all of them drive picker visibility.
  const teamsQuery = useUserTeams(ctx, user?.email);
  const userTeams = teamsQuery.data ?? [];
  const userTeam = userTeams[0] ?? null;

  // Entity-page surface: the host entity is the survey itself.
  const hostSurvey = useMemo(() => {
    const h = resolveHostSubject(entity);
    if (!h || !entity) return null;
    // When a survey blueprint is configured, only treat the host as a survey if
    // its blueprint matches - otherwise the widget was placed on an unrelated
    // entity page and must not render a form from that entity's properties.
    if (surveyBlueprintId && h.blueprint !== surveyBlueprintId) return null;
    return surveyContextFromEntity({ ...entity, blueprint: h.blueprint });
  }, [entity, surveyBlueprintId]);
  const isEntityPage = !!hostSurvey;

  // Which survey the respondent has picked from the dashboard list.
  const [selectedSurveyId, setSelectedSurveyId] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  // Dashboard surface: list active surveys, then filter to those shared with
  // the user's team. Campaigns are only needed off the entity-page surface.
  const surveysQuery = useActiveSurveys(
    ctx,
    config?.surveyBlueprint?.identifier,
    !isEntityPage
  );
  const campaignsQuery = useCampaigns(ctx, !!ctx);

  // Safety valve: if we can't determine the user (no email) or load campaigns,
  // show everything rather than leave the picker empty on an infra hiccup.
  const degradeOpen =
    !user?.email || teamsQuery.isError || campaignsQuery.isError;

  const visibleSurveys = useMemo(
    () =>
      filterSharedSurveys(
        surveysQuery.data ?? [],
        campaignsQuery.data ?? {},
        userTeams,
        degradeOpen
      ),
    [surveysQuery.data, campaignsQuery.data, userTeams, degradeOpen]
  );

  const dashboardSurvey = useMemo(() => {
    if (isEntityPage) return null;
    const chosen = visibleSurveys.find((s) => s.identifier === selectedSurveyId);
    return chosen ? surveyContextFromEntity(chosen) : null;
  }, [isEntityPage, visibleSurveys, selectedSurveyId]);

  const activeSurvey = hostSurvey ?? dashboardSurvey;

  const submit = useSubmitResponse(ctx, config?.responseBlueprint.identifier);

  // ── Early returns - after every hook ────────────────────────────────────
  if (!portApiBaseUrl || !portToken) {
    return <ShellMessage>Waiting for Port context…</ShellMessage>;
  }
  if (!config) {
    return (
      <ShellMessage>
        Configure the <strong>Response blueprint</strong> parameter for this
        widget (see the plugin README).
      </ShellMessage>
    );
  }
  if (!isEntityPage && !config.surveyBlueprint) {
    return (
      <ShellMessage>
        Place this widget on a <strong>survey</strong> entity page, or set the{" "}
        <strong>Survey blueprint</strong> parameter to use it on a dashboard.
      </ShellMessage>
    );
  }

  // ── Dashboard: no survey chosen yet ─────────────────────────────────────
  if (!activeSurvey) {
    // Wait for surveys, and - unless we're going to show everything anyway -
    // for the campaign + team data that filtering depends on, so the picker
    // never flashes unfiltered before filtering settles. In degrade mode
    // (no email, or a campaign/team lookup failed) there's nothing to wait for,
    // which also avoids blocking on teamsQuery when it's disabled (no email).
    const discovering =
      surveysQuery.isPending ||
      (!degradeOpen && (campaignsQuery.isPending || teamsQuery.isPending));
    const hasActive = (surveysQuery.data ?? []).length > 0;

    return (
      <div className="shell">
        <main className="main">
          {discovering ? (
            <LoadingState label="Loading surveys…" />
          ) : surveysQuery.isError ? (
            <ErrorBanner
              message={(surveysQuery.error as Error)?.message}
              onRetry={() => surveysQuery.refetch()}
            />
          ) : visibleSurveys.length === 0 ? (
            hasActive ? (
              <EmptyState
                title="No surveys shared with you yet"
                hint="Active surveys exist, but none have been shared with your team. Ask the survey owner to share one with you."
              />
            ) : (
              <EmptyState
                title="No active surveys"
                hint='Create a survey entity with status "active", or open this widget on a survey entity page.'
              />
            )
          ) : (
            <SurveyPicker
              surveys={visibleSurveys}
              campaigns={campaignsQuery.data ?? {}}
              value={selectedSurveyId}
              onSelect={setSelectedSurveyId}
            />
          )}
        </main>
      </div>
    );
  }

  // ── Survey closed ────────────────────────────────────────────────────────
  if (activeSurvey.status === "closed") {
    return (
      <div className="shell">
        <main className="main">
          <EmptyState
            title="This survey is closed"
            hint="Responses are no longer accepted. Check the analytics plugin to see the results."
          />
        </main>
      </div>
    );
  }

  // ── Success screen ───────────────────────────────────────────────────────
  if (submitted && submit.isSuccess) {
    const resetForm = () => {
      submit.reset();
      setFormKey((k) => k + 1);
      setSubmitted(false);
    };

    return (
      <div className="shell">
        <main className="main">
          <div className="success-screen">
            <div className="success-screen__icon" aria-hidden="true">✓</div>
            <h2 className="success-screen__title">Thanks for your response!</h2>
            <p className="success-screen__msg muted">
              Your answers have been recorded
              {userTeam ? ` for the ${userTeam} team` : ""}.
            </p>
            {!isEntityPage && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  resetForm();
                  setSelectedSurveyId(null);
                }}
              >
                Back to surveys
              </button>
            )}
            {isEntityPage && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={resetForm}
              >
                Submit another response
              </button>
            )}
          </div>
        </main>
      </div>
    );
  }

  // ── Form ─────────────────────────────────────────────────────────────────
  const activeCampaign = campaignsQuery.data?.[activeSurvey.surveyId] ?? null;
  const def = activeSurvey.definition;
  const anonymous = def.anonymous === true;
  const respondent = anonymous ? "anonymous" : user?.email || "anonymous";
  const respondentLabel = anonymous
    ? "Submitting anonymously"
    : user?.email
    ? `as ${user.email}`
    : "Submitting";

  const handleSubmit = (answers: Answers) => {
    submit.mutate(
      {
        surveyId: activeSurvey.surveyId,
        definition: def,
        answers,
        respondent,
        team: userTeam,
      },
      { onSuccess: () => setSubmitted(true) }
    );
  };

  return (
    <div className="shell">
      {selectedSurveyId && !isEntityPage && (
        <div>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setSelectedSurveyId(null)}
          >
            ← Surveys
          </button>
        </div>
      )}
      <header className="topbar">
        <div className="topbar__info">
          <div className="topbar__titlerow">
            <h2 className="topbar__title">{activeSurvey.title}</h2>
            {def.framework && <span className="badge">{def.framework}</span>}
          </div>
          <span className="topbar__meta">
            {def.questions.length} questions · {def.dimensions.length} dimensions
          </span>
          {activeCampaign?.deadline && (
            <span className="topbar__meta">
              <span className="deadline-badge">Due {new Date(activeCampaign.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
            </span>
          )}
        </div>
      </header>

      <main className="main">
        {submit.isError && (
          <ErrorBanner
            message={(submit.error as Error)?.message}
            onRetry={submit.reset}
          />
        )}
        <SurveyForm
          key={formKey}
          definition={def}
          respondentLabel={respondentLabel}
          submitting={submit.isPending}
          errorMessage={undefined}
          onSubmit={handleSubmit}
        />
      </main>
    </div>
  );
}
