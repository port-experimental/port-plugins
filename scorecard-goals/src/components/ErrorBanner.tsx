import { Alert } from "@mui/material";

type ErrorBannerProps = {
  error: unknown;
};

export function ErrorBanner({ error }: ErrorBannerProps) {
  const message =
    error instanceof Error ? error.message : "Failed to load scorecard data";

  return (
    <Alert severity="error" sx={{ whiteSpace: "pre-wrap" }}>
      {message}
    </Alert>
  );
}
