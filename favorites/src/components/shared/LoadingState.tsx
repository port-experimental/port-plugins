type Props = {
  message?: string;
};

export function LoadingState({ message = "Loading…" }: Props) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden="true" />
      <span className="muted">{message}</span>
    </div>
  );
}

export function LoadingDots() {
  return (
    <span className="loading-dots" aria-label="Loading">
      <span />
      <span />
      <span />
    </span>
  );
}
