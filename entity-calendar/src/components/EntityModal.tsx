import { X } from "lucide-react";
import type { CalendarEntity } from "../types";
import { buildEntityPageUrl } from "../utils/portalUrl";

type EntityModalProps = {
  dateLabel: string;
  entities: CalendarEntity[];
  blueprintIdentifier: string;
  onClose: () => void;
};

export function EntityModal({
  dateLabel,
  entities,
  blueprintIdentifier,
  onClose,
}: EntityModalProps) {
  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entity-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <h2 id="entity-modal-title">{dateLabel}</h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} strokeWidth={2} aria-hidden />
          </button>
        </header>
        <ul className="entity-list">
          {entities.map((entity) => (
            <li key={entity.identifier} className="entity-row">
              <div className="entity-main">
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
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
