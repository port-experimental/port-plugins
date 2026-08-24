import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";

type Props = {
  message: string;
  error?: unknown;
  onRetry?: () => void;
};

export function ErrorBanner({ message, error, onRetry }: Props) {
  const detail =
    error instanceof Error ? error.message : String(error ?? "");
  return (
    <div className="error-banner" role="alert">
      <AlertCircleIcon size={16} className="error-icon" aria-hidden />
      <div className="error-body">
        <p className="error-message">{message}</p>
        {detail && <p className="error-detail">{detail}</p>}
      </div>
      {onRetry && (
        <button
          type="button"
          className="fav-icon-btn error-retry"
          aria-label="Retry"
          onClick={onRetry}
        >
          <RefreshCwIcon size={14} />
        </button>
      )}
    </div>
  );
}
