import { useEffect, useMemo, useState, type ReactNode } from "react";
import { LoadingState } from "./LoadingState";
import { ErrorBanner } from "./ErrorBanner";
import { EmptyState } from "./EmptyState";
import { Select, TextInput } from "./Field";
import { groupByFramework, partition } from "../utils/surveyGrouping";
import { ShareBadge } from "./ShareBadge";
import { CardMenu, type MenuItem } from "./CardMenu";
import type { Campaign } from "../api/campaigns";
import type { SurveyRow } from "../types";

type Props = {
  surveys: SurveyRow[];
  loading: boolean;
  error?: string;
  /** Each survey's current campaign, keyed by survey id, for the share chip. */
  campaigns: Record<string, Campaign>;
  /** Resolve a team identifier to its display title (for the share chip). */
  teamTitle: (id: string) => string;
  onRetry: () => void;
  onNew: () => void;
  onEdit: (identifier: string) => void;
  onView: (identifier: string) => void;
  /** Open the survey's results in the analytics dashboard. */
  onViewResponses: (identifier: string) => void;
  /** Open the Share drawer for a survey (audience + invite + sharing status). */
  onShare: (identifier: string) => void;
  /** Open the Send-reminder modal for a shared survey. */
  onSendReminder: (identifier: string) => void;
  /** Lifecycle transitions, run straight from the list (draft→active→closed). */
  onPublish: (identifier: string) => void;
  onClose: (identifier: string) => void;
  onSwitchToDraft: (identifier: string) => void;
  onReopen: (identifier: string) => void;
  onClone: (identifier: string) => void;
  onDelete: (identifier: string, cascade?: boolean) => void;
  deletingId: string | null;
  /** Survey id whose lifecycle change (publish/close/reopen) is in flight. */
  busyId: string | null;
  /** Message + the survey it belongs to, shown inline when a delete fails. */
  deleteError?: string;
  deleteErrorId?: string | null;
};

function PeopleIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  closed: "Closed",
};

const STATUS_FILTERS = [
  { value: "all", label: "All statuses" },
  { value: "draft", label: "Draft" },
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
];
const SHARING_FILTERS = [
  { value: "all", label: "All sharing statuses" },
  { value: "shared", label: "Shared" },
  { value: "unshared", label: "Not shared" },
];

export function SurveyListScreen({
  surveys,
  loading,
  error,
  campaigns,
  teamTitle,
  onRetry,
  onNew,
  onEdit,
  onView,
  onViewResponses,
  onShare,
  onSendReminder,
  onPublish,
  onClose,
  onSwitchToDraft,
  onReopen,
  onClone,
  onDelete,
  deletingId,
  busyId,
  deleteError,
  deleteErrorId,
}: Props) {
  // Card awaiting delete confirmation. Native window.confirm() is swallowed by
  // Port's sandboxed iframe, so we confirm inline instead.
  const [confirmId, setConfirmId] = useState<string | null>(null);
  // Frameworks whose collapsed history is currently expanded.
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  // List filters - initialised from saved defaults (localStorage), falling back
  // to "show everything" so nothing is hidden on a fresh install.
  const [savedDefaults, setSavedDefaults] = useState<{
    status: string;
    sharing: string;
    framework: string;
  }>(() => {
    try {
      const raw = localStorage.getItem("survey-builder:filter-defaults");
      if (raw) return JSON.parse(raw) as { status: string; sharing: string; framework: string };
    } catch {}
    return { status: "all", sharing: "all", framework: "all" };
  });

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(savedDefaults.status);
  const [sharingFilter, setSharingFilter] = useState(savedDefaults.sharing);
  const [frameworkFilter, setFrameworkFilter] = useState(savedDefaults.framework);

  const currentMatchesSaved =
    statusFilter === savedDefaults.status &&
    sharingFilter === savedDefaults.sharing &&
    frameworkFilter === savedDefaults.framework;

  // Build framework filter options from what's actually in the list.
  const frameworkOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const s of surveys) {
      const key = s.framework || "custom";
      if (!seen.has(key)) seen.set(key, key === "custom" ? "Custom" : key);
    }
    const opts = Array.from(seen.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([value, label]) => ({ value, label }));
    return [{ value: "all", label: "All frameworks" }, ...opts];
  }, [surveys]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return surveys.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (sharingFilter !== "all") {
        const shared = !!campaigns[s.identifier];
        if (sharingFilter === "shared" ? !shared : shared) return false;
      }
      if (frameworkFilter !== "all") {
        const fw = s.framework || "custom";
        if (fw !== frameworkFilter) return false;
      }
      if (q && !`${s.title} ${s.description ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [surveys, campaigns, query, statusFilter, sharingFilter, frameworkFilter]);

  const filtersActive = !!query.trim() || !currentMatchesSaved;

  // Once the survey disappears from the list, the delete succeeded - close the modal.
  useEffect(() => {
    if (confirmId && !surveys.some((s) => s.identifier === confirmId)) {
      setConfirmId(null);
    }
  }, [surveys, confirmId]);

  const card = (s: SurveyRow, history: boolean) => (
    <article
      key={s.identifier}
      className={`survey-card${history ? " survey-card--history" : ""}`}
    >
      <button
        type="button"
        className="survey-card__open"
        title="Open overview"
        onClick={() => onView(s.identifier)}
      >
        <span className="survey-card__head">
          <span className="survey-card__title" title={s.title}>{s.title}</span>
          {s.status && (
            <span className={`tag tag--status tag--${s.status}`}>
              {STATUS_LABEL[s.status] ?? s.status}
            </span>
          )}
          {s.framework && (
            <span className="tag tag--muted">
              {s.framework === "custom" ? "Custom" : s.framework}
            </span>
          )}
          <ShareBadge
            campaign={campaigns[s.identifier]}
            status={s.status}
            teamTitle={teamTitle}
          />
        </span>
        {s.description && <span className="survey-card__desc">{s.description}</span>}
        <span className="survey-card__meta">
          {[
            typeof s.questionCount === "number" ? `${s.questionCount} questions` : null,
            typeof s.dimensionCount === "number" ? `${s.dimensionCount} dimensions` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </button>
      <div className="survey-card__actions">{renderActions(s, history)}</div>
    </article>
  );

  // Status-contextual primary action + a "⋯" overflow for the rest. Keeps the
  // one action you'd most likely take a single click, without a row of buttons.
  function renderActions(s: SurveyRow, history: boolean) {
    const busy = busyId === s.identifier;
    const deleting = deletingId === s.identifier;
    const isShared = !!campaigns[s.identifier];

    const view: MenuItem = { label: "Open overview", onClick: () => onView(s.identifier) };
    const viewResponses: MenuItem = {
      label: "View responses",
      onClick: () => onViewResponses(s.identifier),
    };
    const clone: MenuItem = { label: "Clone", onClick: () => onClone(s.identifier) };
    // Send a reminder straight from the card. Disabled until the survey is shared
    // (there's no campaign to notify yet) - share it first via the primary action.
    const sendReminder: MenuItem = {
      label: isShared ? "Send reminder" : "Send reminder (share first)",
      disabled: !isShared,
      onClick: () => onSendReminder(s.identifier),
    };
    const del: MenuItem = {
      label: deleting ? "Deleting…" : "Delete",
      danger: true,
      disabled: deleting,
      onClick: () => setConfirmId(s.identifier),
    };
    const close: MenuItem = {
      label: busy ? "Closing…" : "Close survey",
      disabled: busy,
      onClick: () => onClose(s.identifier),
    };
    const switchToDraft: MenuItem = {
      label: busy ? "Switching…" : "Switch to draft",
      disabled: busy,
      onClick: () => onSwitchToDraft(s.identifier),
    };
    const reopen: MenuItem = {
      label: busy ? "Reopening…" : "Reopen survey",
      disabled: busy,
      onClick: () => onReopen(s.identifier),
    };

    let primary: ReactNode;
    let menu: MenuItem[];

    if (!history && s.status === "draft") {
      primary = (
        <button
          type="button"
          className="btn btn--ghost btn--sm survey-card__primary"
          disabled={busy}
          onClick={() => onPublish(s.identifier)}
        >
          {busy ? "Publishing…" : "Publish"}
        </button>
      );
      menu = [clone, del];
    } else if (!history && s.status === "active") {
      primary = (
        <button
          type="button"
          className="btn btn--ghost btn--sm survey-card__share survey-card__primary"
          title="See who it's shared with, copy an invite, or change the audience"
          onClick={() => onShare(s.identifier)}
        >
          <PeopleIcon />
          {isShared ? "Manage sharing" : "Share"}
        </button>
      );
      menu = [sendReminder, viewResponses, close, switchToDraft, clone, del];
    } else if (!history && s.status === "closed") {
      // A finished survey's headline action is its results, not the form.
      primary = (
        <button
          type="button"
          className="btn btn--ghost btn--sm survey-card__primary"
          onClick={() => onViewResponses(s.identifier)}
        >
          View responses
        </button>
      );
      menu = [view, reopen, switchToDraft, clone, del];
    } else {
      // History (archived/closed): results are the point; overview + reopen in the menu.
      primary = (
        <button
          type="button"
          className="btn btn--ghost btn--sm survey-card__primary"
          onClick={() => onViewResponses(s.identifier)}
        >
          View responses
        </button>
      );
      menu = [view, reopen, switchToDraft, clone, del];
    }

    return (
      <>
        {primary}
        {/* Edit is frequent enough to stay a visible button, not buried in ⋯. */}
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => onEdit(s.identifier)}
        >
          Edit
        </button>
        <CardMenu items={menu} />
      </>
    );
  }

  return (
    <div className="shell">
      <header className="topbar topbar--list">
        <div className="topbar__info">
          <h1 className="topbar__title">Survey builder</h1>
          <span className="topbar__meta">
            Build, publish, and share surveys with your teams.
          </span>
        </div>
        <button type="button" className="btn btn--cta" onClick={onNew}>
          + New survey
        </button>
      </header>

      <main className="main">
        {loading ? (
          <LoadingState label="Loading surveys…" />
        ) : error ? (
          <ErrorBanner message={error} onRetry={onRetry} />
        ) : surveys.length === 0 ? (
          <EmptyState
            title="No surveys yet"
            hint="Create your first survey from a template or a blank canvas."
          />
        ) : (
          <>
            <div className="filterbar">
              <div className="filterbar__search">
                <TextInput
                  type="search"
                  placeholder="Search surveys…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onChange={setStatusFilter} options={STATUS_FILTERS} />
              <Select value={sharingFilter} onChange={setSharingFilter} options={SHARING_FILTERS} />
              {frameworkOptions.length > 1 && (
                <Select value={frameworkFilter} onChange={setFrameworkFilter} options={frameworkOptions} />
              )}
              {!currentMatchesSaved && (
                <>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      setQuery("");
                      setStatusFilter(savedDefaults.status);
                      setSharingFilter(savedDefaults.sharing);
                      setFrameworkFilter(savedDefaults.framework);
                    }}
                  >
                    Clear
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => {
                      const next = { status: statusFilter, sharing: sharingFilter, framework: frameworkFilter };
                      try { localStorage.setItem("survey-builder:filter-defaults", JSON.stringify(next)); } catch {}
                      setSavedDefaults(next);
                    }}
                  >
                    Save as default view
                  </button>
                </>
              )}
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                title="No surveys match"
                hint="Try clearing or changing the filters."
              />
            ) : (
              <div className="survey-groups">
                {groupByFramework(filtered).map((g) => {
                  const { primary, history } = partition(g.items);
                  const isOpen = !!expanded[g.framework];
                  const activeCount = g.items.filter((s) => s.status === "active").length;
                  // When "All statuses" or "Closed" is selected, closed surveys
                  // are expected - show them inline instead of behind a toggle.
                  const inlineAll = statusFilter === "all" || statusFilter === "closed";
                  return (
                    <section key={g.framework} className="survey-group">
                      <header className="survey-group__head">
                        <span className="survey-group__name">{g.framework}</span>
                        <span className="survey-group__count">{g.items.length}</span>
                        {activeCount > 0 && (
                          <span className="survey-group__active">{activeCount} active</span>
                        )}
                      </header>

                  {inlineAll ? (
                    <div className="survey-grid">
                      {primary.map((s) => card(s, false))}
                      {history.map((s) => card(s, true))}
                    </div>
                  ) : (
                    <>
                      <div className="survey-grid">
                        {primary.map((s) => card(s, false))}
                      </div>
                      {history.length > 0 && (
                        <>
                          <button
                            type="button"
                            className="survey-group__more"
                            aria-expanded={isOpen}
                            onClick={() =>
                              setExpanded((e) => ({ ...e, [g.framework]: !isOpen }))
                            }
                          >
                            {isOpen
                              ? "Hide closed surveys"
                              : `Show ${history.length} closed survey${history.length === 1 ? "" : "s"}`}
                          </button>
                          {isOpen && (
                            <div className="survey-grid">{history.map((s) => card(s, true))}</div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </section>
              );
            })}
              </div>
            )}
          </>
        )}
      </main>

      {confirmId && (() => {
        const target = surveys.find((s) => s.identifier === confirmId);
        const title = target?.title;
        const isDeleting = deletingId === confirmId;
        const errMsg = deleteErrorId === confirmId ? deleteError : undefined;
        // Port returns has_dependents when the survey still has responses; that
        // needs an explicit cascade (which also deletes those responses).
        const needsCascade = !!errMsg && /dependent/i.test(errMsg);
        const close = () => !isDeleting && setConfirmId(null);

        return (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Delete survey"
            onClick={close}
          >
            <div className="modal modal--confirm" onClick={(e) => e.stopPropagation()}>
              <div className="modal__head">
                <h2 className="modal__title">
                  {needsCascade ? "Delete survey and its responses?" : "Delete survey?"}
                </h2>
                <button
                  type="button"
                  className="iconbtn"
                  title="Close"
                  disabled={isDeleting}
                  onClick={close}
                >
                  ✕
                </button>
              </div>

              <p className="muted">
                {needsCascade
                  ? `${title ? `"${title}"` : "This survey"} still has responses collected for it. Deleting the survey will permanently delete those responses too. This cannot be undone.`
                  : `${title ? `"${title}"` : "This survey"} will be permanently deleted. This cannot be undone.`}
              </p>

              {errMsg && !needsCascade && (
                <p className="survey-card__error" role="alert">{errMsg}</p>
              )}

              <div className="modal__actions">
                <button
                  type="button"
                  className="btn btn--ghost"
                  disabled={isDeleting}
                  onClick={close}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  disabled={isDeleting}
                  onClick={() => onDelete(confirmId, needsCascade)}
                >
                  {isDeleting
                    ? "Deleting…"
                    : needsCascade
                    ? "Delete survey and responses"
                    : "Delete"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
