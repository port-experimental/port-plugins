import { useMemo, useState } from "react";
import { SurveyForm } from "./preview/SurveyForm";
import { definitionFromDraft } from "../utils/draft";
import type { SurveyDraft } from "../types";

type Props = { draft: SurveyDraft };

/**
 * Live preview - renders the working draft through the exact same SurveyForm the
 * runner (developer-survey) uses, so authors see precisely what respondents get.
 * Interactive but throwaway: the "Reset" button clears the trial answers.
 */
export function PreviewPane({ draft }: Props) {
  const [nonce, setNonce] = useState(0);
  const definition = useMemo(
    () => definitionFromDraft(draft, draft.entityId ?? "preview"),
    [draft]
  );

  const empty = definition.questions.length === 0;

  return (
    <div className="preview">
      <div className="preview__bar">
        <span className="preview__label">Live preview</span>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => setNonce((n) => n + 1)}
          disabled={empty}
        >
          Reset answers
        </button>
      </div>
      <div className="preview__frame">
        {empty ? (
          <div className="preview__empty">
            Add a question to see the respondent’s view here.
          </div>
        ) : (
          <div className="preview__shell">
            <header className="topbar">
              <div className="topbar__info">
                <div className="topbar__titlerow">
                  <h2 className="topbar__title">{draft.title || "Untitled survey"}</h2>
                  {draft.framework && <span className="badge">{draft.framework}</span>}
                </div>
                <span className="topbar__meta">
                  {definition.questions.length} questions · {definition.dimensions.length} dimensions
                </span>
              </div>
            </header>
            <SurveyForm
              key={nonce}
              definition={definition}
              respondentLabel="Preview"
              submitting={false}
              onSubmit={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
