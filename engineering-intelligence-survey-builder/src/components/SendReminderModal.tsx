import { useState } from "react";
import { TextArea } from "./Field";
import { useNudgeNow } from "../hooks/useNudgeNow";
import { campaignIdFor } from "../api/campaigns";
import { buildSurveyShareText } from "../utils/share";
import type { PortCtx } from "../api/portFetch";
import type { ShareSurvey } from "./ShareDrawer";

type Props = {
  ctx: PortCtx;
  survey: ShareSurvey;
  dashboardUrl: string;
  /** Pre-fill the message (e.g. from the drawer textarea). Falls back to localStorage. */
  initialMessage?: string;
  /** Verb shown in the title and primary button (e.g. "Send invite" vs "Send reminder"). */
  actionLabel?: string;
  onClose: () => void;
};

export function SendReminderModal({ ctx, survey, dashboardUrl, initialMessage, actionLabel = "Send reminder", onClose }: Props) {
  const reminderKey = `survey-reminder-${survey.identifier}`;

  const [message, setMessage] = useState(() => {
    if (initialMessage) return initialMessage;
    try {
      return (
        localStorage.getItem(reminderKey) ??
        buildSurveyShareText(survey, dashboardUrl)
      );
    } catch {
      return buildSurveyShareText(survey, dashboardUrl);
    }
  });

  const nudge = useNudgeNow(ctx, survey.identifier);

  const handleSend = () => {
    try { localStorage.setItem(reminderKey, message); } catch {}
    nudge.mutate(
      {
        campaignId: campaignIdFor(survey.identifier),
        message,
        surveyTitle: survey.title,
        surveyDescription: survey.description ?? "",
        questionCount: survey.questionCount ?? 0,
        dashboardUrl,
      },
      { onSuccess: () => setTimeout(onClose, 1200) }
    );
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={actionLabel}
    >
      <div className="modal modal--sm">
        <div className="modal__head">
          <h2 className="modal__title">{actionLabel}</h2>
          <button type="button" className="iconbtn" title="Close" onClick={onClose}>
            ✕
          </button>
        </div>

        <section className="share-block">
          <p className="muted small">
            Recipients are set by your <strong>Notification configuration</strong> -
            make sure it's configured before sending.
          </p>
          <TextArea
            rows={6}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </section>

        {nudge.isError && (
          <p className="save-msg save-msg--err">
            {(nudge.error as Error)?.message ?? "Couldn't send reminder."}
          </p>
        )}

        <div className="modal__actions">
          <button
            type="button"
            className="btn btn--ghost"
            onClick={onClose}
            disabled={nudge.isPending}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn--cta"
            onClick={handleSend}
            disabled={nudge.isPending || nudge.isSuccess}
          >
            {nudge.isPending ? "Sending…" : nudge.isSuccess ? "Sent ✓" : actionLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
