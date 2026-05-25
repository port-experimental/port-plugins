import { CircularProgress, Stack, Typography } from "@mui/material";

export function LoadingState() {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={2}
      sx={{ py: 6, flex: 1 }}
      role="status"
      aria-live="polite"
    >
      <CircularProgress size={40} />
      <Typography variant="body1" color="text.secondary">
        Loading scorecard compliance…
      </Typography>
    </Stack>
  );
}
