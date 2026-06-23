import { PreviewPane } from "./PreviewPane";
import type { Campaign } from "../api/campaigns";
import type { SurveyDraft } from "../types";

type Props = {
  draft: SurveyDraft;
  /** Entity timestamps + current campaign, supplied by App from its queries. */
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
  campaign?: Campaign | null;
  teamTitle: (id: string) => string;
  onBack: () => void;
  onEdit: () => void;
  /** Open the Share drawer for this survey (only when published + persisted). */
  onShare?: () => void;
  /** Open this survey's results in analytics (shown once it's past draft). */
  onViewResponses?: () => void;
};

const PRESET_FRAMEWORKS = new Set(["SPACE", "AI Adoption", "DORA", "DX Core 4"]);

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  closed: "Closed",
};
/** Compact absolute date, or null for missing/invalid input. */
function fmtDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** "in 5 days" / "2 days ago" relative to now (whole days). */
function relativeDays(iso: string): string {
  const ms = new Date(iso).getTime() - Date.now();
  const days = Math.round(ms / 86_400_000);
  if (days === 0) return "today";
  if (days > 0) return `in ${days} day${days === 1 ? "" : "s"}`;
  return `${-days} day${days === -1 ? "" : "s"} ago`;
}

/**
 * Closing line for the Lifecycle section, derived from the campaign deadline and
 * the survey status. Read-only - the deadline is edited in the Share drawer.
 */
function closingLine(status: string, campaign?: Campaign | null): string {
  if (status === "closed") return "Closed";
  const deadline = campaign?.deadline ?? null;
  if (!campaign) return "Not shared - nothing scheduled";
  if (!deadline) return "Open-ended - no automatic close";
  const abs = fmtDate(deadline);
  const past = new Date(deadline).getTime() < Date.now();
  return past ? `Closing soon - deadline passed (${abs})` : `Closes ${abs} · ${relativeDays(deadline)}`;
}

/** Summarize a campaign audience as "All teams" or named teams. */
function audienceText(campaign: Campaign, teamTitle: (id: string) => string): string {
  if (campaign.audience === "all") return "All teams";
  const names = campaign.teams.map(teamTitle);
  return names.length ? names.join(", ") : "No teams";
}

/**
 * Read-only overview of a survey - the destination when you click a survey card.
 * Shows what it is (About, Composition), where it stands (Lifecycle, incl. when
 * it closes), and who it reaches (Sharing), plus the exact respondent form via
 * PreviewPane. Acting on it (Edit / Share) is a deliberate click away.
 */
export function ViewerScreen({
  draft,
  createdAt,
  updatedAt,
  publishedAt,
  campaign,
  teamTitle,
  onBack,
  onEdit,
  onShare,
  onViewResponses,
}: Props) {
  const created = fmtDate(createdAt);
  const updated = fmtDate(updatedAt);
  const published = fmtDate(publishedAt);
  const isCustomFramework = !PRESET_FRAMEWORKS.has(draft.framework);
  const frameworkDisplay = draft.framework === "custom" ? "-" : draft.framework.trim() || "-";
  const canShare = draft.status === "active" && !!draft.entityId && !draft.isNew;
  // Results are relevant once a survey is live or finished - not for drafts.
  const canViewResponses = draft.status !== "draft" && !!draft.entityId && !!onViewResponses;

  return (
    <div className="builder">
      <header className="builder__top">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← Surveys
        </button>
        <div className="builder__topinfo">
          <h2 className="builder__title">{draft.title.trim() || "Survey"}</h2>
          <span className={`tag tag--status tag--${draft.status}`}>
            {STATUS_LABEL[draft.status] ?? draft.status}
          </span>
          <span className="tag tag--muted">Overview</span>
        </div>
        <div className="builder__topactions">
          {canViewResponses && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={onViewResponses}>
              View responses
            </button>
          )}
          {canShare && onShare && (
            <button type="button" className="btn btn--ghost btn--sm" onClick={onShare}>
              {campaign ? "Manage sharing" : "Share"}
            </button>
          )}
          <button type="button" className="btn btn--ghost btn--sm" onClick={onEdit}>
            Edit
          </button>
        </div>
      </header>

      <div className="overview">
        {draft.description.trim() && (
          <p className="overview__desc muted">{draft.description}</p>
        )}

        <div className="overview__info">
          <section className="overview__section">
            <span className="overview__label">Composition</span>
            <dl className="overview__kv">
              <div className="overview__row">
                <dt>Framework name</dt>
                <dd>{frameworkDisplay}</dd>
              </div>
              {isCustomFramework && (
                <div className="overview__row">
                  <dt>Framework type</dt>
                  <dd>Custom</dd>
                </div>
              )}
              <div className="overview__row">
                <dt>Questions</dt>
                <dd>{draft.questions.length}</dd>
              </div>
              <div className="overview__row">
                <dt>Dimensions</dt>
                <dd>
                  {draft.dimensions.length === 0
                    ? "None"
                    : (() => {
                        const names = draft.dimensions.map((d) => d.name);
                        const preview = names.slice(0, 3).join(", ");
                        return names.length > 3
                          ? `${names.length} · ${preview}…`
                          : `${names.length} · ${preview}`;
                      })()}
                </dd>
              </div>
              <div className="overview__row">
                <dt>Responses</dt>
                <dd>{draft.anonymous ? "Anonymous" : "Identified"}</dd>
              </div>
            </dl>
          </section>

          <section className="overview__section">
            <span className="overview__label">Lifecycle</span>
            <dl className="overview__kv">
              <div className="overview__row">
                <dt>Status</dt>
                <dd>{STATUS_LABEL[draft.status] ?? draft.status}</dd>
              </div>
              {created && (
                <div className="overview__row">
                  <dt>Created</dt>
                  <dd>{created}</dd>
                </div>
              )}
              {published && draft.status !== "draft" && (
                <div className="overview__row">
                  <dt>Published</dt>
                  <dd>{published}</dd>
                </div>
              )}
              {updated && updated !== created && (
                <div className="overview__row">
                  <dt>Updated</dt>
                  <dd>{updated}</dd>
                </div>
              )}
              {campaign?.createdAt && (
                <div className="overview__row">
                  <dt>Shared</dt>
                  <dd>{fmtDate(campaign.createdAt)}</dd>
                </div>
              )}
              <div className="overview__row">
                <dt>Closing</dt>
                <dd>{closingLine(draft.status, campaign)}</dd>
              </div>
            </dl>
          </section>

          <section className="overview__section">
            <span className="overview__label">Sharing</span>
            {campaign ? (
              <dl className="overview__kv">
                <div className="overview__row">
                  <dt>Shared with</dt>
                  <dd>{audienceText(campaign, teamTitle)}</dd>
                </div>
              </dl>
            ) : (
              <p className="muted small" style={{ margin: 0 }}>
                Not shared yet.
              </p>
            )}
          </section>
        </div>

        <section className="overview__section">
          <span className="overview__label">Respondent form</span>
          <PreviewPane draft={draft} />
        </section>
      </div>
    </div>
  );
}
