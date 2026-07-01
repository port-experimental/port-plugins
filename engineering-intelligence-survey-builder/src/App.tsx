import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import "./App.css";
import { usePostMessageData } from "./hooks/usePostMessageData";
import { useSurveys } from "./hooks/useSurveys";
import { useCampaigns } from "./hooks/useCampaigns";
import { useTeams } from "./hooks/useTeams";
import { useSaveSurvey, useDeleteSurvey } from "./hooks/useSurveyMutations";
import { configFromParams } from "./utils/config";
import { buildRespondentDashboardUrl, buildAnalyticsResultsUrl } from "./utils/portalUrl";
import { resolveHostSubject } from "./utils/resolveHostEntity";
import {
  blankDefinition,
  cloneDefinition,
  normalizeDefinition,
  TEMPLATES,
} from "./surveys/registry";
import {
  draftFromDefinition,
  draftFromEntity,
  validateDraft,
} from "./utils/draft";
import { getSurvey } from "./api/entities";
import { SurveyListScreen } from "./components/SurveyListScreen";
import { BuilderScreen } from "./components/BuilderScreen";
import { ViewerScreen } from "./components/ViewerScreen";
import { TemplatePicker } from "./components/TemplatePicker";
import { ShareDrawer } from "./components/ShareDrawer";
import { SendReminderModal } from "./components/SendReminderModal";
import type { PortCtx } from "./api/portFetch";
import type { Entity, SurveyDefinition, SurveyDraft } from "./types";

const PRESET_FW = new Set(["SPACE", "AI Adoption", "DORA", "DX Core 4"]);

function ShellMessage({ children }: { children: ReactNode }) {
  return (
    <div className="shell shell--message">
      <p className="muted">{children}</p>
    </div>
  );
}

/** Pick the definition for an entity: inline first, then template, then blank. */
function definitionForEntity(properties?: Record<string, unknown>): SurveyDefinition {
  const p = properties ?? {};
  const inline = normalizeDefinition(p.definition);
  if (inline) return cloneDefinition(inline);
  const fw = typeof p.framework === "string" ? p.framework : undefined;
  const tpl = TEMPLATES.find((t) => t.framework === fw);
  return cloneDefinition(tpl?.definition ?? blankDefinition());
}

function entityToDraft(e: Entity): SurveyDraft {
  return draftFromEntity({
    identifier: e.identifier,
    title: e.title,
    properties: e.properties,
    definition: definitionForEntity(e.properties),
  });
}

export function App() {
  const { params, entity, portToken, portApiBaseUrl } = usePostMessageData();
  const config = configFromParams(params);
  const surveyBlueprint = config?.surveyBlueprint.identifier;
  // URL shared in Slack invites: explicit param wins, else derive from the portal
  // (org comes from the token, origin from the referrer).
  const respondentDashboardUrl =
    config?.respondentUrl ?? buildRespondentDashboardUrl(portToken);

  const ctx: PortCtx | null =
    portToken && portApiBaseUrl ? { token: portToken, baseUrl: portApiBaseUrl } : null;

  const surveysQuery = useSurveys(ctx, surveyBlueprint);
  const campaignsQuery = useCampaigns(ctx);
  const teamsQuery = useTeams(ctx);
  const save = useSaveSurvey(ctx, surveyBlueprint);
  const del = useDeleteSurvey(ctx, surveyBlueprint);

  // Resolve team ids → titles for the list's "shared with" chips.
  const teamTitle = useCallback(
    (id: string) =>
      (teamsQuery.data ?? []).find((t) => t.identifier === id)?.title ?? id,
    [teamsQuery.data]
  );

  // "View responses" opens the survey's results in the analytics dashboard. The
  // SDK's open-in-parent bridge turns window.open into a parent-frame open.
  // We also write the id to localStorage so the analytics plugin can deep-link
  // to the correct survey even when Port pre-loads its iframe before navigation.
  const viewResponses = (identifier: string) => {
    try { localStorage.setItem("__port_analytics_survey", identifier); } catch {}
    window.open(
      buildAnalyticsResultsUrl(identifier, config?.analyticsUrl, portToken),
      "_blank",
      "noopener"
    );
  };

  const [view, setView] = useState<"list" | "builder" | "viewer">("list");
  const [draft, setDraftState] = useState<SurveyDraft | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [showShare, setShowShare] = useState(false);
  // Identifier of the list survey whose Share drawer is open (list surface).
  const [shareId, setShareId] = useState<string | null>(null);
  // Identifier of the list survey whose Send-reminder modal is open.
  const [reminderId, setReminderId] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  // Tracks unsaved edits since the draft was loaded/saved - drives the
  // "Save changes" button so an unmodified existing survey can't be re-saved.
  const [dirty, setDirty] = useState(false);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [titleConflict, setTitleConflict] = useState<string | undefined>();

  // Wrapper so any edit marks the draft dirty and clears the "Saved ✓" flag and
  // stale save errors.
  const setDraft = useCallback((updater: (d: SurveyDraft) => SurveyDraft) => {
    setJustSaved(false);
    setDirty(true);
    setTitleConflict(undefined);
    save.reset();
    setDraftState((d) => (d ? updater(d) : d));
  }, [save]);

  const openNew = (def: SurveyDefinition | null) => {
    setShowPicker(false);
    setJustSaved(false);
    setDirty(false);
    save.reset();
    setDraftState(draftFromDefinition(def ?? blankDefinition()));
    setView("builder");
  };

  const openExisting = useCallback(
    async (identifier: string) => {
      if (!ctx || !surveyBlueprint) return;
      setLoadError(undefined);
      setJustSaved(false);
      setDirty(false);
      save.reset();
      try {
        const e = await getSurvey(ctx, surveyBlueprint, identifier);
        if (!e) throw new Error(`Survey "${identifier}" was not found.`);
        setDraftState(entityToDraft(e));
        setView("builder");
      } catch (err) {
        setLoadError((err as Error).message);
      }
    },
    [ctx, surveyBlueprint, save]
  );

  // Entity-page surface: if the widget is placed on a survey entity, open it.
  const autoOpened = useRef(false);
  useEffect(() => {
    if (autoOpened.current || !ctx || !surveyBlueprint) return;
    const host = resolveHostSubject(entity);
    if (host && host.blueprint === surveyBlueprint) {
      autoOpened.current = true;
      void openExisting(host.identifier);
    }
  }, [ctx, surveyBlueprint, entity, openExisting]);

  // Open a survey read-only (used for older/closed quarters from the history list).
  const openView = useCallback(
    async (identifier: string) => {
      if (!ctx || !surveyBlueprint) return;
      setLoadError(undefined);
      setJustSaved(false);
      setDirty(false);
      save.reset();
      try {
        const e = await getSurvey(ctx, surveyBlueprint, identifier);
        if (!e) throw new Error(`Survey "${identifier}" was not found.`);
        setDraftState(entityToDraft(e));
        setView("viewer");
      } catch (err) {
        setLoadError((err as Error).message);
      }
    },
    [ctx, surveyBlueprint, save]
  );

  // Clone an existing survey into a brand-new draft: fresh id on save, draft
  // status, and a copy title, so two same-framework surveys never go live at once.
  const openClone = useCallback(
    async (identifier: string) => {
      if (!ctx || !surveyBlueprint) return;
      setShowPicker(false);
      setLoadError(undefined);
      setJustSaved(false);
      setDirty(false);
      save.reset();
      try {
        const e = await getSurvey(ctx, surveyBlueprint, identifier);
        if (!e) throw new Error(`Survey "${identifier}" was not found.`);
        const base = entityToDraft(e);
        setDraftState({
          ...base,
          entityId: null,
          isNew: true,
          status: "draft",
          title: `${base.title} (copy)`,
          publishedAt: null, // clones haven't been published yet
        });
        setView("builder");
      } catch (err) {
        setLoadError((err as Error).message);
      }
    },
    [ctx, surveyBlueprint, save]
  );

  // Lifecycle transitions run straight from the list: load the survey, flip its
  // status, and persist (the list refetches on save success).
  const changeStatus = useCallback(
    async (identifier: string, status: string) => {
      if (!ctx || !surveyBlueprint) return;
      setLoadError(undefined);
      try {
        const e = await getSurvey(ctx, surveyBlueprint, identifier);
        if (!e) throw new Error(`Survey "${identifier}" was not found.`);
        save.mutate({ ...entityToDraft(e), status });
      } catch (err) {
        setLoadError((err as Error).message);
      }
    },
    [ctx, surveyBlueprint, save]
  );

  // Publish validates first: a survey that isn't complete shouldn't go live, so
  // we open the editor (which lists the issues) instead of publishing it.
  const publishFromList = useCallback(
    async (identifier: string) => {
      if (!ctx || !surveyBlueprint) return;
      setLoadError(undefined);
      try {
        const e = await getSurvey(ctx, surveyBlueprint, identifier);
        if (!e) throw new Error(`Survey "${identifier}" was not found.`);
        const draft = entityToDraft(e);
        if (validateDraft(draft).length > 0) {
          setJustSaved(false);
          setDirty(false);
          save.reset();
          setDraftState(draft);
          setView("builder");
          return;
        }
        save.mutate({ ...draft, status: "active" });
      } catch (err) {
        setLoadError((err as Error).message);
      }
    },
    [ctx, surveyBlueprint, save]
  );

  const backToList = () => {
    setView("list");
    setDraftState(null);
    setShowShare(false);
    setJustSaved(false);
    save.reset();
  };

  // Persist the working draft. The editor only ever saves (as a draft or, for an
  // already-active survey, keeping its status); going live is a card action.
  const handleSave = () => {
    if (!draft) return;
    if (draft.isNew) {
      const titleLower = draft.title.trim().toLowerCase();
      const conflict = (surveysQuery.data ?? []).find(
        (r) => r.title.trim().toLowerCase() === titleLower
      );
      if (conflict) {
        setTitleConflict(`A survey named "${conflict.title}" already exists. Use a different title.`);
        return;
      }
    }
    setTitleConflict(undefined);
    setJustSaved(false);
    save.mutate(draft, {
      onSuccess: (saved) => {
        setDraftState((d) =>
          d ? { ...d, entityId: saved.identifier, isNew: false } : d
        );
        setJustSaved(true);
        setDirty(false);
      },
    });
  };

  // ── Early returns - after every hook ──────────────────────────────────────
  if (!portApiBaseUrl || !portToken) {
    return <ShellMessage>Waiting for Port context…</ShellMessage>;
  }
  if (!config) {
    return (
      <ShellMessage>
        Configure the <strong>Survey blueprint</strong> parameter for this widget
        (see the plugin README).
      </ShellMessage>
    );
  }

  // ── Builder ───────────────────────────────────────────────────────────────
  if (view === "builder" && draft) {
    // Share is available only once the survey is published and persisted.
    const canShare = draft.status === "active" && !!draft.entityId && !draft.isNew;

    // Collect custom framework names from existing surveys so users can reuse them.
    const customFrameworks = [
      ...new Set(
        (surveysQuery.data ?? [])
          .map((r) => r.framework)
          .filter((fw): fw is string => !!fw && !PRESET_FW.has(fw) && fw !== "custom")
      ),
    ].sort();

    return (
      <>
        <BuilderScreen
          draft={draft}
          setDraft={setDraft}
          onSave={handleSave}
          onShare={() => setShowShare(true)}
          onBack={backToList}
          saving={save.isPending}
          dirty={dirty}
          canShare={canShare}
          customFrameworks={customFrameworks}
          saveError={titleConflict ?? (save.isError ? (save.error as Error)?.message : undefined)}
          savedOk={justSaved}
        />
        {showShare && ctx && draft.entityId && (
          <ShareDrawer
            ctx={ctx}
            survey={{
              identifier: draft.entityId,
              title: draft.title,
              description: draft.description || undefined,
              questionCount: draft.questions.length,
            }}
            dashboardUrl={respondentDashboardUrl}
            onClose={() => setShowShare(false)}
          />
        )}
      </>
    );
  }

  // ── Viewer (read-only overview) ─────────────────────────────────────────────
  if (view === "viewer" && draft) {
    const row = (surveysQuery.data ?? []).find((r) => r.identifier === draft.entityId);
    const campaign = draft.entityId
      ? (campaignsQuery.data ?? {})[draft.entityId] ?? null
      : null;
    return (
      <>
        <ViewerScreen
          draft={draft}
          createdAt={row?.createdAt}
          updatedAt={row?.updatedAt}
          publishedAt={row?.publishedAt ?? draft.publishedAt ?? undefined}
          campaign={campaign}
          teamTitle={teamTitle}
          onBack={backToList}
          onEdit={() => setView("builder")}
          onShare={() => draft.entityId && setShareId(draft.entityId)}
          onViewResponses={() => draft.entityId && viewResponses(draft.entityId)}
        />
        {shareId && ctx && draft.entityId && (
          <ShareDrawer
            ctx={ctx}
            survey={{
              identifier: draft.entityId,
              title: draft.title,
              description: draft.description || undefined,
              questionCount: draft.questions.length,
            }}
            dashboardUrl={respondentDashboardUrl}
            onClose={() => setShareId(null)}
          />
        )}
      </>
    );
  }

  // ── List ──────────────────────────────────────────────────────────────────
  return (
    <>
      <SurveyListScreen
        surveys={surveysQuery.data ?? []}
        loading={surveysQuery.isPending || surveysQuery.isLoading}
        campaigns={campaignsQuery.data ?? {}}
        teamTitle={teamTitle}
        error={
          loadError ??
          (surveysQuery.isError ? (surveysQuery.error as Error)?.message : undefined)
        }
        onRetry={() => surveysQuery.refetch()}
        onNew={() => setShowPicker(true)}
        onEdit={(id) => void openExisting(id)}
        onView={(id) => void openView(id)}
        onViewResponses={viewResponses}
        onShare={(id) => setShareId(id)}
        onSendReminder={(id) => setReminderId(id)}
        onPublish={(id) => void publishFromList(id)}
        onClose={(id) => void changeStatus(id, "closed")}
        onSwitchToDraft={(id) => void changeStatus(id, "draft")}
        onReopen={(id) => void changeStatus(id, "active")}
        onClone={(id) => void openClone(id)}
        onDelete={(id, cascade) => del.mutate({ identifier: id, cascade })}
        deletingId={del.isPending ? del.variables?.identifier ?? null : null}
        busyId={save.isPending ? save.variables?.entityId ?? null : null}
        deleteError={
          del.isError ? ((del.error as Error)?.message ?? "Delete failed") : undefined
        }
        deleteErrorId={del.isError ? del.variables?.identifier ?? null : null}
      />
      {showPicker && (
        <TemplatePicker
          onPick={openNew}
          onCancel={() => setShowPicker(false)}
          surveys={surveysQuery.data ?? []}
          onClone={(id) => void openClone(id)}
        />
      )}
      {shareId && ctx && (() => {
        const row = (surveysQuery.data ?? []).find((s) => s.identifier === shareId);
        if (!row) return null;
        return (
          <ShareDrawer
            ctx={ctx}
            survey={{
              identifier: row.identifier,
              title: row.title,
              description: row.description,
              questionCount: row.questionCount,
            }}
            dashboardUrl={respondentDashboardUrl}
            onClose={() => setShareId(null)}
          />
        );
      })()}
      {reminderId && ctx && (() => {
        const row = (surveysQuery.data ?? []).find((s) => s.identifier === reminderId);
        if (!row) return null;
        return (
          <SendReminderModal
            ctx={ctx}
            survey={{
              identifier: row.identifier,
              title: row.title,
              description: row.description,
              questionCount: row.questionCount,
            }}
            dashboardUrl={respondentDashboardUrl}
            onClose={() => setReminderId(null)}
          />
        );
      })()}
    </>
  );
}
