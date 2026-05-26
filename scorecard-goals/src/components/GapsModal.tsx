import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import VerifiedIcon from "@mui/icons-material/Verified";
import {
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { EntityGapSummary } from "../types";
import { buildEntityPageUrl } from "../utils/portalUrl";
import { FailedRuleChip } from "./FailedRuleChip";

type GapsModalProps = {
  scorecardTitle: string;
  blueprintIdentifier: string;
  entities: EntityGapSummary[];
  onClose: () => void;
};

export function GapsModal({
  scorecardTitle,
  blueprintIdentifier,
  entities,
  onClose,
}: GapsModalProps) {
  const gapCount = entities.length;
  const ruleCount = entities.reduce((n, e) => n + e.failedRules.length, 0);

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      scroll="paper"
      aria-labelledby="gaps-modal-title"
    >
      <DialogTitle id="gaps-modal-title" sx={{ pr: 6 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
          <Box sx={{ minWidth: 0, pr: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              component="p"
              sx={{ fontWeight: 500, letterSpacing: 0.5 }}
            >
              Completion gaps
            </Typography>
            <Typography variant="h5" component="p" sx={{ mt: 0.5 }}>
              {scorecardTitle}
            </Typography>
            {gapCount > 0 && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                {gapCount} {gapCount === 1 ? "entity" : "entities"} · {ruleCount}{" "}
                failed {ruleCount === 1 ? "rule" : "rules"}
              </Typography>
            )}
          </Box>
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexShrink: 0 }}>
            {gapCount > 0 && (
              <Chip label={gapCount} color="error" size="small" aria-hidden />
            )}
            <IconButton onClick={onClose} aria-label="Close" edge="end">
              <CloseIcon />
            </IconButton>
          </Stack>
        </Stack>
      </DialogTitle>

      <DialogContent dividers={gapCount > 0}>
        {gapCount === 0 ? (
          <Stack alignItems="center" spacing={1} sx={{ py: 4, textAlign: "center" }}>
            <VerifiedIcon color="success" sx={{ fontSize: 48 }} />
            <Typography variant="subtitle1">Fully compliant</Typography>
            <Typography variant="body1" color="text.secondary">
              Every entity passed all rules on this scorecard.
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2} divider={<Divider flexItem />}>
            {entities.map((entity, index) => (
              <Paper key={entity.identifier} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    alignItems={{ xs: "stretch", sm: "flex-start" }}
                    justifyContent="space-between"
                    gap={1.5}
                  >
                    <Stack direction="row" spacing={1.5} sx={{ minWidth: 0, flex: 1 }}>
                      <Avatar
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          fontSize: 14,
                          fontWeight: 600,
                        }}
                        aria-hidden
                      >
                        {index + 1}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography variant="subtitle1" noWrap>
                          {entity.title}
                        </Typography>
                        <Typography
                          variant="caption"
                          component="p"
                          color="text.secondary"
                          sx={{
                            fontFamily: "monospace",
                            mt: 0.25,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {entity.identifier}
                        </Typography>
                      </Box>
                    </Stack>
                    <Button
                      variant="text"
                      size="small"
                      endIcon={<OpenInNewIcon fontSize="small" />}
                      href={buildEntityPageUrl(
                        blueprintIdentifier,
                        entity.identifier
                      )}
                      target="_top"
                      rel="noopener noreferrer"
                      component="a"
                      sx={{ alignSelf: { xs: "flex-start", sm: "center" }, flexShrink: 0 }}
                    >
                      Open in Port
                    </Button>
                  </Stack>

                  <Box>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      component="p"
                      sx={{ mb: 1, fontWeight: 600, letterSpacing: 0.5 }}
                    >
                      {entity.failedRules.length === 1
                        ? "Rule to fix"
                        : "Rules to fix"}
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1} useFlexGap>
                      {entity.failedRules.map((rule) => (
                        <FailedRuleChip
                          key={`${entity.identifier}-${rule.ruleIdentifier}`}
                          rule={rule}
                          entityKey={entity.identifier}
                        />
                      ))}
                    </Stack>
                  </Box>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
}
