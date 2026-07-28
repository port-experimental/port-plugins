import type { Campaign } from "../api/campaigns";
import type { Entity } from "../types";
import { surveyContextFromEntity } from "../utils/surveyContext";

type Props = {
  surveys: Entity[];
  campaigns: Record<string, Campaign>;
  value: string | null;
  onSelect: (identifier: string) => void;
};

function fmtDeadline(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Dashboard survey selector - clickable cards (entity-page surface uses the host entity). */
export function SurveyPicker({ surveys, campaigns, onSelect }: Props) {
  return (
    <div className="picker">
      <h2 className="picker__heading">Choose a survey</h2>
      <p className="picker__sub muted">
        Pick a survey to share your feedback.
      </p>
      <div className="picker__grid">
        {surveys.map((s) => {
          const ctx = surveyContextFromEntity(s);
          const def = ctx.definition;
          const deadline = campaigns[s.identifier]?.deadline ?? null;
          return (
            <button
              key={s.identifier}
              type="button"
              className="survey-card"
              onClick={() => onSelect(s.identifier)}
            >
              <div className="survey-card__head">
                <span className="survey-card__title">{ctx.title}</span>
                {def.framework && (
                  <span className="badge">{def.framework}</span>
                )}
              </div>
              {def.description && (
                <p className="survey-card__desc">{def.description}</p>
              )}
              <div className="survey-card__foot">
                <div className="survey-card__footleft">
                  <span className="survey-card__meta">
                    {def.questions.length} questions
                  </span>
                  {deadline && (
                    <span className="deadline-badge">Due {fmtDeadline(deadline)}</span>
                  )}
                </div>
                <span className="survey-card__cta">Start →</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
