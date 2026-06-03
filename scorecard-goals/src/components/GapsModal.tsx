import { CheckCircle2, ExternalLink, X } from "lucide-react";
import type { EntityGapSummary } from "../types";
import { buildEntityPageUrl } from "../utils/portalUrl";
import { FailedRuleChip } from "./FailedRuleChip";

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
  const gapCount = entities.length;
  const ruleCount = entities.reduce((n, e) => n + e.failedRules.length, 0);

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gaps-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div className="modal-header__text">
            <p className="modal-eyebrow">Completion gaps</p>
            <h2 id="gaps-modal-title" className="modal-title">
              {scorecardTitle}
            </h2>
            {gapCount > 0 && (
              <p className="modal-subtitle">
                {gapCount} {gapCount === 1 ? "entity" : "entities"} · {ruleCount}{" "}
                failed {ruleCount === 1 ? "rule" : "rules"}
              </p>
            )}
          </div>
          <div className="modal-header__actions">
            {gapCount > 0 && (
              <span className="gap-count-badge" aria-hidden>
                {gapCount}
              </span>
            )}
            <button
              type="button"
              className="modal-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={18} strokeWidth={2} aria-hidden />
            </button>
          </div>
        </header>

        {gapCount === 0 ? (
          <div className="modal-body modal-body--empty">
            <CheckCircle2 size={48} strokeWidth={1.5} aria-hidden />
            <p className="status-panel__title">Fully compliant</p>
            <p className="status-panel__text">
              Every entity passed all rules on this scorecard.
            </p>
          </div>
        ) : (
          <div className="modal-body scroll-area">
            <ul className="gap-list">
              {entities.map((entity) => (
                <li key={entity.identifier} className="gap-card">
                  <div className="gap-card__top">
                    <div className="gap-card__entity">
                      <div className="gap-card__names">
                        <p className="gap-card__title">{entity.title}</p>
                        <p className="gap-card__id">{entity.identifier}</p>
                      </div>
                    </div>
                    <a
                      className="port-link"
                      href={buildEntityPageUrl(
                        blueprintIdentifier,
                        entity.identifier
                      )}
                      target="_top"
                      rel="noopener noreferrer"
                    >
                      Open in Port
                      <ExternalLink size={12} strokeWidth={2} aria-hidden />
                    </a>
                  </div>
                  <div>
                    <p className="gap-rules-label">
                      {entity.failedRules.length === 1
                        ? "Rule to fix"
                        : "Rules to fix"}
                    </p>
                    <div className="rule-chips">
                      {entity.failedRules.map((rule) => (
                        <FailedRuleChip
                          key={`${entity.identifier}-${rule.ruleIdentifier}`}
                          rule={rule}
                        />
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
