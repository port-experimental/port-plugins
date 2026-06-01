import { useI18n } from "../hooks/useI18n";

export function LoadingState() {
  const { t } = useI18n();

  return (
    <div className="status-panel" role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden />
      <p className="status-panel__title">{t("loading.title")}</p>
    </div>
  );
}
