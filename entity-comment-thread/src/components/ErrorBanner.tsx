import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="error-banner" role="alert">
      <AlertCircle size={16} aria-hidden />
      <span className="error-banner__msg">{message}</span>
      {onRetry && (
        <button
          type="button"
          className="error-banner__retry"
          onClick={onRetry}
          aria-label="Retry"
        >
          <RefreshCw size={14} aria-hidden />
          Retry
        </button>
      )}
    </div>
  );
}
