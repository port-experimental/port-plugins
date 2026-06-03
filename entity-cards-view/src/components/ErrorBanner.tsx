import { useI18n } from "../hooks/useI18n";

type ErrorBannerProps = {
  error: unknown;
  onRetry?: () => void;
};

function messageFromError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "";
}

export function ErrorBanner({ error, onRetry }: ErrorBannerProps) {
  const { t } = useI18n();
  const detail = messageFromError(error) || t("error.generic");

  return (
    <div className="error-banner" role="alert">
      <p className="error-banner__title">{t("error.title")}</p>
      <p className="error-banner__detail">{detail}</p>
      {onRetry && (
        <button type="button" className="btn btn--secondary" onClick={onRetry}>
          {t("error.retry")}
        </button>
      )}
    </div>
  );
}
