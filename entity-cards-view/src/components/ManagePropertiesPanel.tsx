import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { Check, GripVertical, Search, X } from "lucide-react";
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
  onReorder: (activeId: string, overId: string) => void;
  onArrayDisplayChange: (propertyId: string, mode: ArrayDisplayMode) => void;
  onBooleanDisplayChange: (propertyId: string, mode: BooleanDisplayMode) => void;
  onShowAllHidden: () => void;
  onHideAllShown: () => void;
};

function propertyMatchesQuery(
  prop: BlueprintPropertyMeta,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    prop.title.toLowerCase().includes(q) ||
    prop.identifier.toLowerCase().includes(q)
  );
}

type PropertyExtrasProps = {
  prop: BlueprintPropertyMeta;
  enabled: boolean;
  arrayDisplayModes: Record<string, ArrayDisplayMode>;
  booleanDisplayModes: Record<string, BooleanDisplayMode>;
  onArrayDisplayChange: (propertyId: string, mode: ArrayDisplayMode) => void;
  onBooleanDisplayChange: (propertyId: string, mode: BooleanDisplayMode) => void;
};

function PropertyExtras({
  prop,
  enabled,
  arrayDisplayModes,
  booleanDisplayModes,
  onArrayDisplayChange,
  onBooleanDisplayChange,
}: PropertyExtrasProps) {
  const { t } = useI18n();
  const isArray = prop.kind === "array";
  const isBoolean = prop.kind === "boolean";
  if (!isArray && !isBoolean) return null;

  const arrayMode = getArrayDisplayMode(prop.identifier, arrayDisplayModes);
  const booleanMode = getBooleanDisplayMode(prop.identifier, booleanDisplayModes);

  return (
    <>
      {isArray && (
        <fieldset
          className={`manage-props__array${enabled ? "" : " manage-props__array--off"}`}
          disabled={!enabled}
          aria-label={t("manage.array.display", { property: prop.title })}
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
                onChange={() => onArrayDisplayChange(prop.identifier, "count")}
              />
              {t("manage.array.count")}
            </label>
            <label className="manage-props__array-option">
              <input
                type="radio"
                name={`array-display-${prop.identifier}`}
                checked={arrayMode === "items"}
                onChange={() => onArrayDisplayChange(prop.identifier, "items")}
              />
              {t("manage.array.items")}
            </label>
          </div>
        </fieldset>
      )}

      {isBoolean && (
        <fieldset
          className={`manage-props__array${enabled ? "" : " manage-props__array--off"}`}
          disabled={!enabled}
          aria-label={t("manage.boolean.display", { property: prop.title })}
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
    </>
  );
}

type PropertyRowProps = {
  prop: BlueprintPropertyMeta;
  checked: boolean;
  draggable?: boolean;
  dragOver?: boolean;
  onToggle: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onDragOver?: (e: DragEvent) => void;
  onDrop?: () => void;
  arrayDisplayModes: Record<string, ArrayDisplayMode>;
  booleanDisplayModes: Record<string, BooleanDisplayMode>;
  onArrayDisplayChange: (propertyId: string, mode: ArrayDisplayMode) => void;
  onBooleanDisplayChange: (propertyId: string, mode: BooleanDisplayMode) => void;
};

function PropertyRow({
  prop,
  checked,
  draggable = false,
  dragOver = false,
  onToggle,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  arrayDisplayModes,
  booleanDisplayModes,
  onArrayDisplayChange,
  onBooleanDisplayChange,
}: PropertyRowProps) {
  const { t } = useI18n();

  return (
    <li
      className={`manage-props__row${dragOver ? " manage-props__row--drag-over" : ""}`}
      onDragOver={onDragOver}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.();
      }}
    >
      <div className="manage-props__row-main">
        {draggable ? (
          <button
            type="button"
            className="manage-props__grip"
            draggable
            aria-label={t("manage.dragAria", { property: prop.title })}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              e.dataTransfer.setData("text/plain", prop.identifier);
              onDragStart?.();
            }}
            onDragEnd={() => onDragEnd?.()}
          >
            <GripVertical size={14} aria-hidden />
          </button>
        ) : (
          <span className="manage-props__grip manage-props__grip--spacer" aria-hidden />
        )}

        <label className="manage-props__item">
          <input type="checkbox" checked={checked} onChange={onToggle} />
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
      </div>

      <PropertyExtras
        prop={prop}
        enabled={checked}
        arrayDisplayModes={arrayDisplayModes}
        booleanDisplayModes={booleanDisplayModes}
        onArrayDisplayChange={onArrayDisplayChange}
        onBooleanDisplayChange={onBooleanDisplayChange}
      />
    </li>
  );
}

export function ManagePropertiesPanel({
  open,
  onClose,
  available,
  visibleIds,
  arrayDisplayModes,
  booleanDisplayModes,
  onToggle,
  onReorder,
  onArrayDisplayChange,
  onBooleanDisplayChange,
  onShowAllHidden,
  onHideAllShown,
}: ManagePropertiesPanelProps) {
  const { t } = useI18n();
  const panelRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const byId = useMemo(
    () => new Map(available.map((p) => [p.identifier, p])),
    [available]
  );

  const shownProperties = useMemo(() => {
    return visibleIds
      .map((id) => byId.get(id))
      .filter((p): p is BlueprintPropertyMeta => !!p)
      .filter((p) => propertyMatchesQuery(p, searchQuery));
  }, [visibleIds, byId, searchQuery]);

  const hiddenProperties = useMemo(() => {
    const visible = new Set(visibleIds);
    return available
      .filter((p) => !visible.has(p.identifier))
      .filter((p) => propertyMatchesQuery(p, searchQuery));
  }, [available, visibleIds, searchQuery]);

  const hasHidden = available.some((p) => !visibleIds.includes(p.identifier));
  const hasShown = visibleIds.length > 0;

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

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setDraggingId(null);
      setDropTargetId(null);
    }
  }, [open]);

  if (!open) return null;

  const sharedRowProps = {
    arrayDisplayModes,
    booleanDisplayModes,
    onArrayDisplayChange,
    onBooleanDisplayChange,
  };

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

      <div className="manage-props__search">
        <Search size={14} className="manage-props__search-icon" aria-hidden />
        <input
          type="search"
          className="manage-props__search-input"
          placeholder={t("manage.search")}
          aria-label={t("manage.searchAria")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="manage-props__sections scroll-area">
        <section className="manage-props__section">
          <div className="manage-props__section-head">
            <h3 className="manage-props__section-title">{t("manage.shown")}</h3>
            {hasShown && (
              <button
                type="button"
                className="manage-props__section-action"
                onClick={onHideAllShown}
              >
                {t("manage.hideAll")}
              </button>
            )}
          </div>
          <ul className="manage-props__list">
            {available.length === 0 ? (
              <li className="manage-props__empty">{t("manage.empty")}</li>
            ) : shownProperties.length === 0 ? (
              <li className="manage-props__empty">{t("manage.emptyShown")}</li>
            ) : (
              shownProperties.map((prop) => (
                <PropertyRow
                  key={prop.identifier}
                  prop={prop}
                  checked
                  draggable
                  dragOver={dropTargetId === prop.identifier}
                  onToggle={() => onToggle(prop.identifier)}
                  onDragStart={() => setDraggingId(prop.identifier)}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDropTargetId(null);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggingId && draggingId !== prop.identifier) {
                      setDropTargetId(prop.identifier);
                    }
                  }}
                  onDrop={() => {
                    if (draggingId && draggingId !== prop.identifier) {
                      onReorder(draggingId, prop.identifier);
                    }
                    setDraggingId(null);
                    setDropTargetId(null);
                  }}
                  {...sharedRowProps}
                />
              ))
            )}
          </ul>
        </section>

        <section className="manage-props__section">
          <div className="manage-props__section-head">
            <h3 className="manage-props__section-title">{t("manage.hidden")}</h3>
            {hasHidden && (
              <button
                type="button"
                className="manage-props__section-action"
                onClick={onShowAllHidden}
              >
                {t("manage.showAll")}
              </button>
            )}
          </div>
          <ul className="manage-props__list">
            {available.length === 0 ? null : hiddenProperties.length === 0 ? (
              <li className="manage-props__empty">{t("manage.emptyHidden")}</li>
            ) : (
              hiddenProperties.map((prop) => (
                <PropertyRow
                  key={prop.identifier}
                  prop={prop}
                  checked={false}
                  onToggle={() => onToggle(prop.identifier)}
                  {...sharedRowProps}
                />
              ))
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
