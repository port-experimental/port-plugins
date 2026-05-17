import type { CalendarEntity } from "../types";
import { formatDisplayDate } from "../utils/dates";
import { buildEntityPageUrl } from "../utils/portalUrl";

type Props = {
  date: Date;
  blueprintIdentifier: string;
  entities: CalendarEntity[];
  onClose: () => void;
};

export function EntityModal({
  date,
  blueprintIdentifier,
  entities,
  onClose,
}: Props) {
  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="entity-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="modal-header">
          <div>
            <h2 id="entity-modal-title" className="modal-title">
              {formatDisplayDate(date)}
            </h2>
            <p className="modal-subtitle">
              {entities.length} entit{entities.length === 1 ? "y" : "ies"}
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
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
                target="_blank"
                rel="noopener noreferrer"
              >
                Open
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
