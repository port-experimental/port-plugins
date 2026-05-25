import ChecklistIcon from "@mui/icons-material/Checklist";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import type { ScorecardComplianceRow } from "../types";

type ScorecardBarProps = {
  row: ScorecardComplianceRow;
  gapCount: number;
  onShowGaps: () => void;
};

function progressColor(
  percent: number
): "success" | "warning" | "error" | "inherit" {
  if (percent >= 80) return "success";
  if (percent >= 50) return "warning";
  return "error";
}

export function ScorecardBar({ row, gapCount, onShowGaps }: ScorecardBarProps) {
  const { scorecardTitle, ruleCount, passedEntities, totalEntities, passPercent } =
    row;
  const hasRules = ruleCount > 0;
  const showGapsButton = hasRules && gapCount > 0;
  const clampedPercent = Math.min(100, Math.max(0, passPercent));

  return (
    <Card variant="outlined" aria-label={`${scorecardTitle} compliance`}>
      <CardContent>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1}
          >
            <Typography variant="subtitle1" noWrap sx={{ flex: 1, minWidth: 0 }}>
              {scorecardTitle}
            </Typography>
            <Chip
              label={hasRules ? `${passPercent}%` : "—"}
              size="small"
              color="primary"
              variant="filled"
              aria-hidden
            />
          </Stack>

          <LinearProgress
            variant="determinate"
            value={hasRules ? clampedPercent : 0}
            color={hasRules ? progressColor(passPercent) : "inherit"}
            aria-label={`${passPercent}% of entities passed all ${ruleCount} rules`}
            sx={{ height: 6, borderRadius: 3 }}
          />

          <Typography variant="body2" color="text.secondary">
            {hasRules ? (
              <>
                <strong>{passedEntities}</strong> of <strong>{totalEntities}</strong>{" "}
                entities passed all <strong>{ruleCount}</strong>{" "}
                {ruleCount === 1 ? "rule" : "rules"}
              </>
            ) : (
              "No rules configured on this scorecard"
            )}
          </Typography>

          {showGapsButton && (
            <Box>
              <Button
                variant="contained"
                color="primary"
                size="small"
                startIcon={<ChecklistIcon />}
                onClick={onShowGaps}
                aria-label={`Show completion gaps for ${scorecardTitle}, ${gapCount} entities`}
              >
                Show gaps for completion
              </Button>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
