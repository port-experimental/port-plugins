type ErrorBannerProps = {
  error: unknown;
};

export function ErrorBanner({ error }: ErrorBannerProps) {
  const message =
    error instanceof Error ? error.message : "Failed to load scorecard data";

  return (
    <pre className="error" role="alert">
      {message}
    </pre>
  );
}
