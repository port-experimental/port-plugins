import { ExternalLink, RefreshCw } from "lucide-react";
import { useI18n } from "../hooks/useI18n";
import type { ArrayDisplayMode, BlueprintPropertyMeta, BooleanDisplayMode, PortEntity } from "../types";
import { buildEntityPageUrl } from "../utils/portalUrl";
import {
  getEntityPropertyValue,
  splitPropertiesByKind,
} from "../utils/propertyFormat";
import { PropertyValue } from "./PropertyValue";
import { TruncatedText } from "./TruncatedText";

type EntityCardProps = {
  entity: PortEntity;
  blueprintIdentifier: string;
  visibleProperties: BlueprintPropertyMeta[];
  getArrayDisplayMode: (propertyId: string) => ArrayDisplayMode;
  getBooleanDisplayMode: (propertyId: string) => BooleanDisplayMode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function EntityCard({
  entity,
  blueprintIdentifier,
  visibleProperties,
  getArrayDisplayMode,
  getBooleanDisplayMode,
  onRefresh,
  isRefreshing,
}: EntityCardProps) {
  const { t } = useI18n();
  const title = entity.title?.trim() || entity.identifier;
  const href = buildEntityPageUrl(blueprintIdentifier, entity.identifier);
  const { body, status } = splitPropertiesByKind(
    visibleProperties,
    getBooleanDisplayMode
  );

  return (
    <article className="entity-card">
      <header className="entity-card__header">
        <div className="entity-card__heading">
          <a
            href={href}
            className="entity-card__title"
            target="_top"
            rel="noopener noreferrer"
          >
            <TruncatedText text={title} />
          </a>
          <p className="entity-card__path">/{entity.identifier}</p>
        </div>
        <div className="entity-card__actions">
          {onRefresh && (
            <button
              type="button"
              className="entity-card__refresh"
              onClick={onRefresh}
              disabled={isRefreshing}
              aria-label={t("card.refreshAria", { title })}
            >
              <RefreshCw
                size={14}
                strokeWidth={2}
                className={isRefreshing ? "spin" : undefined}
                aria-hidden
              />
            </button>
          )}
          <a
            href={href}
            className="entity-card__open"
            target="_top"
            rel="noopener noreferrer"
            aria-label={t("card.openAria", { title })}
          >
            <ExternalLink size={14} strokeWidth={2} aria-hidden />
          </a>
        </div>
      </header>

      {body.length > 0 && (
        <dl className="entity-card__props">
          {body.map((prop) => {
            const raw = getEntityPropertyValue(entity, prop.identifier);
            return (
              <div key={prop.identifier} className="entity-card__row">
                <dt>
                  <TruncatedText
                    text={prop.title}
                    className="entity-card__label"
                  />
                </dt>
                <dd>
                  <PropertyValue
                    prop={prop}
                    value={raw}
                    arrayDisplayMode={
                      prop.kind === "array"
                        ? getArrayDisplayMode(prop.identifier)
                        : undefined
                    }
                  />
                </dd>
              </div>
            );
          })}
        </dl>
      )}

      {status.length > 0 && (
        <footer className="entity-card__footer">
          {status.map((prop) => {
            const raw = getEntityPropertyValue(entity, prop.identifier);
            return (
              <PropertyValue key={prop.identifier} prop={prop} value={raw} />
            );
          })}
        </footer>
      )}
    </article>
  );
}
