type Props = { message?: string; onRetry?: () => void };

export function ErrorBanner({ message, onRetry }: Props) {
  return (
    <div className="banner banner--error" role="alert">
      <div>
        <div className="banner__title">Something went wrong</div>
        {message && <div className="banner__msg">{message}</div>}
      </div>
      {onRetry && (
        <button type="button" className="btn btn--ghost" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
