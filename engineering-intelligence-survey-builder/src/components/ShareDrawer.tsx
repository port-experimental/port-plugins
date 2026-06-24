import { useEffect, useMemo, useRef, useState } from "react";
import { Field, TextArea, TextInput } from "./Field";
import { useTeams } from "../hooks/useTeams";
import { useCampaign } from "../hooks/useCampaign";
import { useLaunchCampaign } from "../hooks/useLaunchCampaign";
import { useUnshareCampaign } from "../hooks/useUnshareCampaign";
import { buildSurveyShareText } from "../utils/share";
import { SendReminderModal } from "./SendReminderModal";
import type { PortCtx } from "../api/portFetch";
import type { Campaign } from "../api/campaigns";
import { type ShareConfig } from "../types";

/** The minimal survey shape the drawer needs (id + invite-text fields). */
export type ShareSurvey = {
  identifier: string;
  title: string;
  description?: string;
  questionCount?: number;
};

type Props = {
  ctx: PortCtx;
  survey: ShareSurvey;
  /** Dashboard URL embedded in the copyable invite. */
  dashboardUrl: string;
  onClose: () => void;
};

/** Format an ISO timestamp as a short, locale-aware date (no time). */
function shortDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}


/**
 * One window for sharing a published survey. Three stacked sections:
 *  1. **Shared with** - reads the survey's current `surveyCampaign` and shows
 *     the real audience and deadline (or "Not shared yet" when none exists).
 *  2. **Copy invite** - a ready-to-paste message + dashboard link.
 *  3. **Audience editor** - pre-filled from the current campaign; launching
 *     (re)creates the campaign via the `share_survey` action.
 */
export function ShareDrawer({ ctx, survey, dashboardUrl, onClose }: Props) {
  const teamsQuery = useTeams(ctx);
  const campaignQuery = useCampaign(ctx, survey.identifier);
  const launch = useLaunchCampaign(ctx);
  const unshare = useUnshareCampaign(ctx);

  const reminderConfigUrl = useMemo(() => {
    try {
      const base = new URL(dashboardUrl).origin;
      return `${base}/org_sTqtYJRkdFA380xp/settings/workflows/survey-nudge-now`;
    } catch {
      return null;
    }
  }, [dashboardUrl]);

  const campaign = campaignQuery.data ?? null;
  const isReshare = !!campaign;
  const isShared = campaign?.status === "active";
  // The send button only appears once the survey is shared, so it's always a
  // reminder - "invite" would be misleading on an already-shared survey.
  const sendLabel = "Send reminder";
  const [confirmUnshare, setConfirmUnshare] = useState(false);
  const [showSendReminder, setShowSendReminder] = useState(false);

  // Surveys are always shared with all teams.
  const [deadline, setDeadline] = useState("");
  // Last-saved deadline, so we can disable "Save" when nothing has changed.
  const [initialDeadline, setInitialDeadline] = useState<string | null>(null);
  const reminderKey = `survey-reminder-${survey.identifier}`;
  const [inviteText, setInviteText] = useState(() => {
    try {
      return (
        localStorage.getItem(reminderKey) ??
        buildSurveyShareText(
          {
            identifier: survey.identifier,
            title: survey.title,
            description: survey.description,
            questionCount: survey.questionCount,
          },
          dashboardUrl
        )
      );
    } catch {
      return buildSurveyShareText(
        {
          identifier: survey.identifier,
          title: survey.title,
          description: survey.description,
          questionCount: survey.questionCount,
        },
        dashboardUrl
      );
    }
  });
  // Baseline for the message so editing it (not just the audience/deadline)
  // enables Save and gets persisted.
  const [savedMessage, setSavedMessage] = useState(inviteText);
  const messageDirty = inviteText !== savedMessage;

  const teams = teamsQuery.data ?? [];
  const teamTitle = useMemo(() => {
    const byId = new Map(teams.map((t) => [t.identifier, t.title]));
    return (id: string) => byId.get(id) ?? id;
  }, [teams]);

  // Pre-fill the editor from the loaded campaign - once, so a background refetch
  // never clobbers edits the user has started.
  const seeded = useRef(false);
  useEffect(() => {
    if (seeded.current || !campaign) return;
    seeded.current = true;
    const dl = campaign.deadline ? campaign.deadline.slice(0, 10) : "";
    setDeadline(dl);
    setInitialDeadline(dl);
  }, [campaign]);

  const config: ShareConfig = useMemo(
    () => ({
      // Surveys are always shared with every team.
      audience: "all",
      teams: [],
      deadline: deadline || null,
      reminderCadence: "off",
    }),
    [deadline]
  );

  // Whether the form differs from the last-saved campaign. First-time shares
  // have no saved state, so always allow saving.
  const isDirty = useMemo(() => {
    if (!isReshare) return true;
    if (initialDeadline == null) return false; // campaign still loading
    return deadline !== initialDeadline;
  }, [isReshare, initialDeadline, deadline]);

  const canLaunch = !launch.isPending && (isDirty || messageDirty);

  const handleLaunch = () => {
    // The message is a local preference (used for reminders); persist it on save.
    try { localStorage.setItem(reminderKey, inviteText); } catch {}
    setSavedMessage(inviteText);
    launch.mutate({ surveyId: survey.identifier, config }, {
      onSuccess: () => {
        setInitialDeadline(deadline);
      },
    });
  };

  return (
    <>
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={`Share ${survey.title}`}
    >
      <div className="modal modal--share">
        <div className="modal__head">
          <h2 className="modal__title">Share "{survey.title}"</h2>
          <button type="button" className="iconbtn" title="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* ── 1. Shared with ──────────────────────────────────────────────── */}
        <section className="share-block">
          <span className="share-block__label">Shared with</span>
          <SharedWith
            loading={campaignQuery.isPending}
            error={campaignQuery.isError}
            campaign={campaign}
            teamTitle={teamTitle}
          />
          {campaign && (
            <div className="share-unshare">
              {confirmUnshare ? (
                <>
                  <span className="muted small">
                    Stop sharing? It disappears from everyone's survey list (you can re-share later).
                  </span>
                  <div className="share-unshare__actions">
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => setConfirmUnshare(false)}
                      disabled={unshare.isPending}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn btn--danger btn--sm"
                      onClick={() =>
                        unshare.mutate(survey.identifier, {
                          onSuccess: () => setConfirmUnshare(false),
                        })
                      }
                      disabled={unshare.isPending}
                    >
                      {unshare.isPending ? "Unsharing…" : "Unshare"}
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  className="btn btn--ghost btn--sm share-unshare__trigger"
                  onClick={() => setConfirmUnshare(true)}
                >
                  Stop sharing
                </button>
              )}
            </div>
          )}
          {unshare.isError && (
            <p className="save-msg save-msg--err">
              {(unshare.error as Error)?.message ?? "Couldn't stop sharing."}
            </p>
          )}
        </section>

        {/* ── 2. Deadline ─────────────────────────────────────────────────── */}
        <section className="share-block">
          <span className="share-block__label">Sharing</span>
          <p className="muted small" style={{ margin: "0 0 18px" }}>
            This survey is shared with all teams.
          </p>

          <Field label="Deadline">
            <TextInput
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </Field>

        </section>

        {/* ── 3. Message ──────────────────────────────────────────────────── */}
        <section className="share-block">
          <span className="share-block__label">Message</span>
          <TextArea
            rows={5}
            value={inviteText}
            onChange={(e) => setInviteText(e.target.value)}
          />
          <div className="share-copy__foot">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={() => setShowSendReminder(true)}
              disabled={!isShared}
              title={isShared ? undefined : "Share the survey first to send a reminder"}
            >
              {sendLabel}
            </button>
            {reminderConfigUrl && (
              <a
                href={reminderConfigUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--ghost btn--sm"
                style={{ textDecoration: "none" }}
              >
                Notification config ↗
              </a>
            )}
          </div>
          {!isShared && (
            <p className="muted small" style={{ marginTop: 10 }}>
              Users won't get an automatic notification, but they'll have access
              once the survey is shared. After sharing, you can send a reminder
              based on your Notification configuration.
            </p>
          )}
        </section>

        {launch.isError && (
          <p className="save-msg save-msg--err">
            {(launch.error as Error)?.message ?? "Couldn't launch the campaign."}
          </p>
        )}
        {launch.isSuccess && !launch.isPending && (
          <p className="save-msg save-msg--ok">
            {isReshare ? "Saved ✓" : "Survey shared ✓"}
          </p>
        )}

        <div className="modal__actions">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleLaunch}
            disabled={!canLaunch}
            title={
              !canLaunch && isReshare && !isDirty && !messageDirty
                ? "No changes to save"
                : undefined
            }
          >
            {launch.isPending
              ? isReshare ? "Saving…" : "Sharing…"
              : isReshare
              ? "Save"
              : "Share survey"}
          </button>
        </div>
      </div>
    </div>

    {showSendReminder && campaign && (
      <SendReminderModal
        ctx={ctx}
        survey={survey}
        dashboardUrl={dashboardUrl}
        initialMessage={inviteText}
        actionLabel={sendLabel}
        onClose={() => setShowSendReminder(false)}
      />
    )}
    </>
  );
}

/** Renders the current campaign audience + schedule, or an empty state. */
function SharedWith({
  loading,
  error,
  campaign,
  teamTitle,
}: {
  loading: boolean;
  error: boolean;
  campaign: Campaign | null;
  teamTitle: (id: string) => string;
}) {
  if (loading) return <span className="muted small">Loading…</span>;
  if (error) return <span className="muted small">Couldn't load sharing status.</span>;
  if (!campaign) {
    return <p className="muted small">Not shared yet.</p>;
  }

  const deadline = shortDate(campaign.deadline);

  return (
    <dl className="share-summary">
      <div className="share-summary__row">
        <dt>Audience</dt>
        <dd>
          {campaign.audience === "all" ? (
            "All teams"
          ) : campaign.teams.length === 0 ? (
            <span className="muted">No teams</span>
          ) : (
            <span className="chips chips--static">
              {campaign.teams.map((id) => (
                <span key={id} className="chip chip--static">
                  {teamTitle(id)}
                </span>
              ))}
            </span>
          )}
        </dd>
      </div>
      {deadline && (
        <div className="share-summary__row">
          <dt>Deadline</dt>
          <dd>{deadline}</dd>
        </div>
      )}
    </dl>
  );
}
