import { ListChecks } from "lucide-react";
import type { ScorecardComplianceRow } from "../types";
import { percentTier } from "../utils/percentTier";

type ScorecardBarProps = {
  row: ScorecardComplianceRow;
  gapCount: number;
  onShowGaps: () => void;
};

export function ScorecardBar({ row, gapCount, onShowGaps }: ScorecardBarProps) {
  const { scorecardTitle, ruleCount, passedEntities, totalEntities, passPercent } =
    row;
  const hasRules = ruleCount > 0;
  const showGapsButton = hasRules && gapCount > 0;
  const tier = hasRules ? percentTier(passPercent) : "none";
  const clampedPercent = Math.min(100, Math.max(0, passPercent));

  return (
    <article className="scorecard-card" aria-label={`${scorecardTitle} compliance`}>
      <div className="scorecard-card__header">
        <h3 className="scorecard-card__title">{scorecardTitle}</h3>
        <span
          className={`scorecard-percent scorecard-percent--${tier}`}
          aria-hidden={!hasRules}
        >
          {hasRules ? `${passPercent}%` : "—"}
        </span>
      </div>

      <div
        className="scorecard-track"
        role="progressbar"
        aria-valuenow={hasRules ? passPercent : 0}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={
          hasRules
            ? `${passPercent}% of entities passed all ${ruleCount} rules`
            : "No rules configured"
        }
      >
        <div
          className={`scorecard-fill scorecard-fill--${tier}`}
          style={{ width: hasRules ? `${clampedPercent}%` : "0%" }}
        />
      </div>

      <p className="scorecard-meta">
        {hasRules ? (
          <>
            <strong>{passedEntities}</strong> of <strong>{totalEntities}</strong>{" "}
            entities passed all <strong>{ruleCount}</strong>{" "}
            {ruleCount === 1 ? "rule" : "rules"}
          </>
        ) : (
          "No rules configured on this scorecard"
        )}
      </p>

      {showGapsButton && (
        <button
          type="button"
          className="btn-primary"
          onClick={onShowGaps}
          aria-label={`Show completion gaps for ${scorecardTitle}, ${gapCount} entities`}
        >
          <ListChecks size={14} strokeWidth={2} aria-hidden />
          Show gaps for completion
        </button>
      )}
    </article>
  );
}
