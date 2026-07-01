import { useMemo, useState } from "react";
import { MetaEditor } from "./MetaEditor";
import { DimensionsEditor } from "./DimensionsEditor";
import { QuestionsEditor } from "./QuestionsEditor";
import { PreviewPane } from "./PreviewPane";
import {
  moveItem,
  newDimension,
  newQuestion,
  validateDraft,
} from "../utils/draft";
import type {
  Dimension,
  Question,
  QuestionType,
  SurveyDraft,
} from "../types";

type Tab = "setup" | "dimensions" | "questions";

// Capitalized status labels, matching the list and overview surfaces. The raw
// status (lowercase) still drives the tag's color class.
const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  closed: "Closed",
};

type Props = {
  draft: SurveyDraft;
  setDraft: (updater: (d: SurveyDraft) => SurveyDraft) => void;
  /** Persist the draft (Create for new, Save changes for existing). */
  onSave: () => void;
  /** Open the Share drawer to launch a campaign for a published survey. */
  onShare: () => void;
  onBack: () => void;
  saving: boolean;
  /** Unsaved edits since load/save. New surveys can always be created; an
   *  unmodified existing survey has nothing to save. */
  dirty: boolean;
  /** Whether sharing is available (published and persisted). */
  canShare: boolean;
  /** Custom framework names extracted from existing surveys for reuse. */
  customFrameworks?: string[];
  saveError?: string;
  savedOk: boolean;
};

const hasChoices = (t: QuestionType) => t === "single_choice" || t === "multi_choice";

export function BuilderScreen({
  draft,
  setDraft,
  onSave,
  onShare,
  onBack,
  saving,
  dirty,
  canShare,
  customFrameworks,
  saveError,
  savedOk,
}: Props) {
  const [tab, setTab] = useState<Tab>("setup");

  const issues = useMemo(() => validateDraft(draft), [draft]);
  const busy = saving;
  // New surveys are always creatable; existing ones need unsaved edits.
  const canSave = issues.length === 0 && !busy && (draft.isNew || dirty);
  // Active surveys also expose Share (distribution) alongside the save action.
  const isPublished = draft.status === "active";

  // ── Top-level + array mutations, all funneled through setDraft ────────────
  const update = (patch: Partial<SurveyDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const updateDimension = (i: number, patch: Partial<Dimension>) =>
    setDraft((d) => ({
      ...d,
      dimensions: d.dimensions.map((dim, idx) => (idx === i ? { ...dim, ...patch } : dim)),
    }));
  const MAX_DIMENSIONS = 8;
  const addDimension = () =>
    setDraft((d) =>
      d.dimensions.length < MAX_DIMENSIONS
        ? { ...d, dimensions: [...d.dimensions, newDimension()] }
        : d
    );
  const removeDimension = (i: number) =>
    setDraft((d) => {
      const removed = d.dimensions[i];
      return {
        ...d,
        dimensions: d.dimensions.filter((_, idx) => idx !== i),
        // Detach any questions that pointed at the deleted dimension.
        questions: d.questions.map((q) =>
          q.dimension === removed?.id ? { ...q, dimension: undefined } : q
        ),
      };
    });
  const moveDimension = (i: number, dir: -1 | 1) =>
    setDraft((d) => ({ ...d, dimensions: moveItem(d.dimensions, i, i + dir) }));

  const updateQuestion = (i: number, patch: Partial<Question>) =>
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)),
    }));
  const addQuestion = (type: QuestionType): string => {
    const q = newQuestion(type);
    setDraft((d) => ({ ...d, questions: [...d.questions, q] }));
    return q.id;
  };
  const changeQuestionType = (i: number, type: QuestionType) =>
    setDraft((d) => ({
      ...d,
      questions: d.questions.map((q, idx) => {
        if (idx !== i) return q;
        const seed = newQuestion(type);
        return {
          id: q.id,
          text: q.text,
          helpText: q.helpText,
          required: q.required,
          type,
          // Keep dimension only for scoreable types; reverse only for likert.
          dimension: type === "multi_choice" || type === "nps" || type === "text" ? undefined : q.dimension,
          reverse: type === "likert" ? q.reverse : undefined,
          // Carry choices across choice-types; otherwise seed/clear.
          choices: hasChoices(type) ? q.choices ?? seed.choices : undefined,
        };
      }),
    }));
  const removeQuestion = (i: number) =>
    setDraft((d) => ({ ...d, questions: d.questions.filter((_, idx) => idx !== i) }));
  const moveQuestion = (i: number, dir: -1 | 1) =>
    setDraft((d) => ({ ...d, questions: moveItem(d.questions, i, i + dir) }));

  return (
    <div className="builder">
      <header className="builder__top">
        <button type="button" className="btn btn--ghost" onClick={onBack}>
          ← Surveys
        </button>
        <div className="builder__topinfo">
          <h2 className="builder__title">{draft.title.trim() || "New survey"}</h2>
          <span className={`tag tag--status tag--${draft.status}`}>
            {STATUS_LABEL[draft.status] ?? draft.status}
          </span>
          {!draft.isNew && <span className="tag tag--muted">{draft.entityId}</span>}
        </div>
        <div className="builder__topactions">
          {saveError && <span className="save-msg save-msg--err">{saveError}</span>}
          {savedOk && !saveError && <span className="save-msg save-msg--ok">Saved ✓</span>}
          {isPublished && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onShare}
              disabled={!canShare || busy}
              title={!canShare ? "Save the survey before sharing" : undefined}
            >
              Share…
            </button>
          )}
          {/* Authoring only saves a draft; going live (Publish) is a card action. */}
          <button
            type="button"
            className="btn btn--primary"
            onClick={onSave}
            disabled={!canSave}
            title={issues.length ? "Resolve the issues below to save" : undefined}
          >
            {saving ? "Saving…" : draft.isNew ? "Create survey" : "Save changes"}
          </button>
        </div>
      </header>

      <div className="builder__cols">
        <div className="builder__editor">
          <nav className="tabs" role="tablist">
            <TabButton current={tab} id="setup" onClick={setTab}>Setup</TabButton>
            <TabButton current={tab} id="dimensions" onClick={setTab}>
              Dimensions <span className="tabs__count">{draft.dimensions.length}</span>
            </TabButton>
            <TabButton current={tab} id="questions" onClick={setTab}>
              Questions <span className="tabs__count">{draft.questions.length}</span>
            </TabButton>
          </nav>

          {issues.length > 0 && (
            <div className="issues" role="status">
              <strong>{issues.length} thing{issues.length === 1 ? "" : "s"} to fix before saving:</strong>
              <ul>
                {issues.slice(0, 6).map((msg, i) => (
                  <li key={i}>{msg}</li>
                ))}
                {issues.length > 6 && <li>…and {issues.length - 6} more.</li>}
              </ul>
            </div>
          )}

          {tab === "setup" && <MetaEditor draft={draft} update={update} customFrameworks={customFrameworks} />}
          {tab === "dimensions" && (
            <DimensionsEditor
              dimensions={draft.dimensions}
              onUpdate={updateDimension}
              onAdd={addDimension}
              onRemove={removeDimension}
              onMove={moveDimension}
              atMax={draft.dimensions.length >= MAX_DIMENSIONS}
            />
          )}
          {tab === "questions" && (
            <QuestionsEditor
              questions={draft.questions}
              dimensions={draft.dimensions}
              scale={draft.scale}
              onUpdate={updateQuestion}
              onChangeType={changeQuestionType}
              onAdd={addQuestion}
              onRemove={removeQuestion}
              onMove={moveQuestion}
            />
          )}
        </div>

        <aside className="builder__preview">
          <PreviewPane draft={draft} />
        </aside>
      </div>
    </div>
  );
}

function TabButton({
  current,
  id,
  onClick,
  children,
}: {
  current: Tab;
  id: Tab;
  onClick: (t: Tab) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={current === id}
      className={`tab${current === id ? " tab--on" : ""}`}
      onClick={() => onClick(id)}
    >
      {children}
    </button>
  );
}
