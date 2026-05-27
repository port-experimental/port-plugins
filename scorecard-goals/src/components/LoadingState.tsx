export function LoadingState() {
  return (
    <div className="status-panel" role="status" aria-live="polite">
      <div className="loading-spinner" aria-hidden />
      <p className="status-panel__title">Loading scorecard compliance…</p>
    </div>
  );
}
