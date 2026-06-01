import { useI18n } from "../hooks/useI18n";
import type { ArrayDisplayMode, BlueprintPropertyMeta, StatusTone } from "../types";
import {
  booleanStatusTone,
  coerceBoolean,
  enumStatusTone,
  formatArrayCount,
  formatBooleanLabel,
  formatDefaultPropertyValue,
  formatEnumLabel,
  getArrayItemCount,
  MAX_ARRAY_ITEMS_ON_CARD,
  normalizeArrayItems,
  shouldRenderSentimentEnum,
} from "../utils/propertyFormat";

type PropertyValueProps = {
  prop: BlueprintPropertyMeta;
  value: unknown;
  arrayDisplayMode?: ArrayDisplayMode;
};

function StatusPill({ label, tone }: { label: string; tone: StatusTone }) {
  return (
    <span className={`status-pill status-pill--${tone}`}>
      <span className="status-pill__dot" aria-hidden />
      <span className="status-pill__label">{label}</span>
    </span>
  );
}

export function PropertyValue({
  prop,
  value,
  arrayDisplayMode = "count",
}: PropertyValueProps) {
  const { t } = useI18n();

  if (prop.kind === "boolean") {
    const bool = coerceBoolean(value);
    if (bool === null) {
      return <span className="prop-value prop-value--empty">—</span>;
    }
    const label = formatBooleanLabel(prop, bool);
    const tone = booleanStatusTone(bool);
    return <StatusPill label={label} tone={tone} />;
  }

  if (prop.kind === "array") {
    if (arrayDisplayMode === "count") {
      const count = getArrayItemCount(value);
      return (
        <span className="prop-value prop-value--count" title={formatArrayCount(count)}>
          {formatArrayCount(count)}
        </span>
      );
    }

    const items = normalizeArrayItems(value);
    if (items.length === 0) {
      return <span className="prop-value prop-value--empty">—</span>;
    }

    const shown = items.slice(0, MAX_ARRAY_ITEMS_ON_CARD);
    const hidden = items.length - shown.length;
    const fullText = items.join(", ");

    return (
      <span className="prop-value prop-value--items" title={fullText}>
        {shown.join(", ")}
        {hidden > 0 && (
          <span className="prop-value__more">
            {t("array.more", { count: String(hidden) })}
          </span>
        )}
      </span>
    );
  }

  if (shouldRenderSentimentEnum(prop, value)) {
    const label = formatEnumLabel(value);
    const tone = enumStatusTone(label, prop);
    return <StatusPill label={label} tone={tone} />;
  }

  const text = formatDefaultPropertyValue(value);
  return (
    <span className="prop-value" title={text}>
      {text}
    </span>
  );
}
