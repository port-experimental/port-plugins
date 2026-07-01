type Props = {
  title?: string;
  message?: string;
  onRetry?: () => void;
};

export function ErrorBanner({ title = "Something went wrong", message, onRetry }: Props) {
  return (
    <div className="banner banner--error" role="alert">
      <div className="banner__body">
        <strong className="banner__title">{title}</strong>
        {message && <p className="banner__msg">{message}</p>}
      </div>
      {onRetry && (
        <button type="button" className="btn btn--ghost" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}
