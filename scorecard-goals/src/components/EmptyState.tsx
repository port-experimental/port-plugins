import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LeaderboardOutlinedIcon from "@mui/icons-material/LeaderboardOutlined";
import { Stack, Typography } from "@mui/material";

type EmptyStateProps = {
  blueprintTitle: string;
  hasEntities: boolean;
};

export function EmptyState({ blueprintTitle, hasEntities }: EmptyStateProps) {
  const Icon = hasEntities ? LeaderboardOutlinedIcon : Inventory2OutlinedIcon;
  const title = hasEntities ? "No scorecards yet" : "No entities found";
  const text = hasEntities
    ? `No scorecards are defined for ${blueprintTitle}. Create scorecards in Port to see compliance bars here.`
    : `No entities found for ${blueprintTitle}.`;

  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      spacing={1.5}
      sx={{ py: 6, px: 2, textAlign: "center", flex: 1 }}
    >
      <Icon sx={{ fontSize: 48, color: "text.secondary", opacity: 0.7 }} />
      <Typography variant="subtitle1">{title}</Typography>
      <Typography variant="body1" color="text.secondary" maxWidth={360}>
        {text}
      </Typography>
    </Stack>
  );
}
