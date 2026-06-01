import { useI18n } from "../hooks/useI18n";

type EmptyStateProps = {
  blueprintTitle: string;
  hasSearch: boolean;
};

export function EmptyState({ blueprintTitle, hasSearch }: EmptyStateProps) {
  const { t } = useI18n();

  const title = hasSearch
    ? t("empty.noMatch.title")
    : t("empty.none.title");
  const detail = hasSearch
    ? t("empty.noMatch.detail")
    : t("empty.none.detail", { blueprint: blueprintTitle });

  return (
    <div className="status-panel">
      <p className="status-panel__title">{title}</p>
      <p className="status-panel__detail">{detail}</p>
    </div>
  );
}
