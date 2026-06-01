import { useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import { useI18n } from "../hooks/useI18n";
import type { ArrayDisplayMode, BlueprintPropertyMeta, BooleanDisplayMode } from "../types";
import { getArrayDisplayMode } from "../utils/arrayDisplayStorage";
import { getBooleanDisplayMode } from "../utils/booleanDisplayStorage";

type ManagePropertiesPanelProps = {
  open: boolean;
  onClose: () => void;
  available: BlueprintPropertyMeta[];
  visibleIds: string[];
  arrayDisplayModes: Record<string, ArrayDisplayMode>;
  booleanDisplayModes: Record<string, BooleanDisplayMode>;
  onToggle: (propertyId: string) => void;
  onArrayDisplayChange: (propertyId: string, mode: ArrayDisplayMode) => void;
  onBooleanDisplayChange: (propertyId: string, mode: BooleanDisplayMode) => void;
  onSelectAll: () => void;
  onClearAll: () => void;
};

export function ManagePropertiesPanel({
  open,
  onClose,
  available,
  visibleIds,
  arrayDisplayModes,
  booleanDisplayModes,
  onToggle,
  onArrayDisplayChange,
  onBooleanDisplayChange,
  onSelectAll,
  onClearAll,
}: ManagePropertiesPanelProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest("[data-manage-properties-trigger]")
      ) {
        onClose();
      }
    };
    window.addEventListener("mousedown", onPointer);
    return () => window.removeEventListener("mousedown", onPointer);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="manage-props"
      ref={panelRef}
      role="dialog"
      aria-label={t("manage.title")}
    >
      <div className="manage-props__header">
        <h2 className="manage-props__title">{t("manage.title")}</h2>
        <button
          type="button"
          className="btn btn--icon btn--ghost"
          onClick={onClose}
          aria-label={t("manage.closeAria")}
        >
          <X size={16} aria-hidden />
        </button>
      </div>
      <p className="manage-props__hint">{t("manage.hint")}</p>
      <div className="manage-props__actions">
        <button type="button" className="btn btn--ghost btn--sm" onClick={onSelectAll}>
          {t("manage.selectAll")}
        </button>
        <button type="button" className="btn btn--ghost btn--sm" onClick={onClearAll}>
          {t("manage.clearAll")}
        </button>
      </div>
      <ul className="manage-props__list scroll-area">
        {available.length === 0 ? (
          <li className="manage-props__empty">{t("manage.empty")}</li>
        ) : (
          available.map((prop) => {
            const checked = visibleIds.includes(prop.identifier);
            const isArray = prop.kind === "array";
            const isBoolean = prop.kind === "boolean";
            const arrayMode = getArrayDisplayMode(
              prop.identifier,
              arrayDisplayModes
            );
            const booleanMode = getBooleanDisplayMode(
              prop.identifier,
              booleanDisplayModes
            );

            return (
              <li key={prop.identifier} className="manage-props__row">
                <label className="manage-props__item">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggle(prop.identifier)}
                  />
                  <span
                    className={`manage-props__check${checked ? " manage-props__check--on" : ""}`}
                    aria-hidden
                  >
                    {checked && <Check size={12} strokeWidth={3} />}
                  </span>
                  <span className="manage-props__label">
                    <span className="manage-props__name">{prop.title}</span>
                    <span className="manage-props__id">{prop.identifier}</span>
                  </span>
                </label>

                {isArray && (
                  <fieldset
                    className={`manage-props__array${checked ? "" : " manage-props__array--off"}`}
                    disabled={!checked}
                    aria-label={t("manage.array.display", {
                      property: prop.title,
                    })}
                  >
                    <legend className="manage-props__array-legend">
                      {t("manage.array.showAs")}
                    </legend>
                    <div className="manage-props__array-toggle" role="radiogroup">
                      <label className="manage-props__array-option">
                        <input
                          type="radio"
                          name={`array-display-${prop.identifier}`}
                          checked={arrayMode === "count"}
                          onChange={() =>
                            onArrayDisplayChange(prop.identifier, "count")
                          }
                        />
                        {t("manage.array.count")}
                      </label>
                      <label className="manage-props__array-option">
                        <input
                          type="radio"
                          name={`array-display-${prop.identifier}`}
                          checked={arrayMode === "items"}
                          onChange={() =>
                            onArrayDisplayChange(prop.identifier, "items")
                          }
                        />
                        {t("manage.array.items")}
                      </label>
                    </div>
                  </fieldset>
                )}

                {isBoolean && (
                  <fieldset
                    className={`manage-props__array${checked ? "" : " manage-props__array--off"}`}
                    disabled={!checked}
                    aria-label={t("manage.boolean.display", {
                      property: prop.title,
                    })}
                  >
                    <legend className="manage-props__array-legend">
                      {t("manage.boolean.showAs")}
                    </legend>
                    <div className="manage-props__array-toggle" role="radiogroup">
                      <label className="manage-props__array-option">
                        <input
                          type="radio"
                          name={`boolean-display-${prop.identifier}`}
                          checked={booleanMode === "pill"}
                          onChange={() =>
                            onBooleanDisplayChange(prop.identifier, "pill")
                          }
                        />
                        {t("manage.boolean.pill")}
                      </label>
                      <label className="manage-props__array-option">
                        <input
                          type="radio"
                          name={`boolean-display-${prop.identifier}`}
                          checked={booleanMode === "labeled"}
                          onChange={() =>
                            onBooleanDisplayChange(prop.identifier, "labeled")
                          }
                        />
                        {t("manage.boolean.labeled")}
                      </label>
                    </div>
                  </fieldset>
                )}
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
