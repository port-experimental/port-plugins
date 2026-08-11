export function ErrorBanner({ error }: { error: unknown }) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="error-banner" role="alert">
      <strong>Couldn't load synced entities</strong>
      <pre className="error-banner__body">{message}</pre>
    </div>
  );
}
