import type { EntityGapSummary } from "../types";
import { buildEntityPageUrl } from "../utils/portalUrl";

type GapsModalProps = {
  scorecardTitle: string;
  blueprintIdentifier: string;
  entities: EntityGapSummary[];
  onClose: () => void;
};

export function GapsModal({
  scorecardTitle,
  blueprintIdentifier,
  entities,
  onClose,
}: GapsModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal gaps-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gaps-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="gaps-modal-title">Completion gaps — {scorecardTitle}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </header>

        {entities.length === 0 ? (
          <p className="gaps-modal__empty">
            All entities passed every rule on this scorecard.
          </p>
        ) : (
          <ul className="gaps-list">
            {entities.map((entity) => (
              <li key={entity.identifier} className="gaps-entity">
                <div className="gaps-entity__head">
                  <div className="gaps-entity__main">
                    <span className="entity-title">{entity.title}</span>
                    <span className="entity-id">{entity.identifier}</span>
                  </div>
                  <a
                    className="entity-link"
                    href={buildEntityPageUrl(
                      blueprintIdentifier,
                      entity.identifier
                    )}
                    target="_top"
                    rel="noopener noreferrer"
                  >
                    Open in Port
                  </a>
                </div>
                <ul className="failed-rules-list">
                  {entity.failedRules.map((rule) => (
                    <li
                      key={`${entity.identifier}-${rule.ruleIdentifier}`}
                      className="failed-rule"
                    >
                      <span className="failed-rule__name">{rule.ruleTitle}</span>
                      <span className="failed-rule__scorecard">
                        {rule.scorecardTitle}
                      </span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
