import type { ScorecardComplianceRow } from "../types";

type ScorecardBarProps = {
  row: ScorecardComplianceRow;
  gapCount: number;
  onShowGaps: () => void;
};

function barTone(percent: number): string {
  if (percent >= 80) return "bar-fill--high";
  if (percent >= 50) return "bar-fill--mid";
  return "bar-fill--low";
}

export function ScorecardBar({ row, gapCount, onShowGaps }: ScorecardBarProps) {
  const { scorecardTitle, ruleCount, passedEntities, totalEntities, passPercent } =
    row;
  const width = Math.min(100, Math.max(0, passPercent));
  const hasRules = ruleCount > 0;
  const showGapsButton = hasRules && gapCount > 0;

  return (
    <article className="scorecard-row" aria-label={`${scorecardTitle} compliance`}>
      <div className="scorecard-row__header">
        <h3 className="scorecard-row__title">{scorecardTitle}</h3>
        <span className="scorecard-row__percent" aria-hidden>
          {hasRules ? `${passPercent}%` : "—"}
        </span>
      </div>
      <div
        className="scorecard-row__track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={hasRules ? passPercent : 0}
        aria-label={`${passPercent}% of entities passed all ${ruleCount} rules`}
      >
        <div
          className={`scorecard-row__fill ${hasRules ? barTone(passPercent) : "bar-fill--empty"}`}
          style={{ width: hasRules ? `${width}%` : "0%" }}
        />
      </div>
      <p className="scorecard-row__meta">
        {hasRules ? (
          <>
            <strong>{passedEntities}</strong> of <strong>{totalEntities}</strong>{" "}
            entities passed all <strong>{ruleCount}</strong>{" "}
            {ruleCount === 1 ? "rule" : "rules"}
          </>
        ) : (
          <>No rules configured on this scorecard</>
        )}
      </p>
      {showGapsButton && (
        <button
          type="button"
          className="gaps-btn"
          onClick={onShowGaps}
          aria-label={`Show completion gaps for ${scorecardTitle}, ${gapCount} entities`}
        >
          Show gaps for completion
        </button>
      )}
    </article>
  );
}
