export function ErrorBanner({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="error-banner" role="alert">
      <div className="error-banner__header">
        <strong>Couldn't load synced entities</strong>
        {onRetry && (
          <button
            type="button"
            className="error-banner__retry"
            onClick={onRetry}
          >
            Retry
          </button>
        )}
      </div>
      <pre className="error-banner__body">{message}</pre>
    </div>
  );
}
