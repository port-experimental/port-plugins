import { Box, Chip, Tooltip } from "@mui/material";
import type { FailedRuleInfo } from "../types";

type FailedRuleChipProps = {
  rule: FailedRuleInfo;
  entityKey: string;
};

export function FailedRuleChip({ rule, entityKey }: FailedRuleChipProps) {
  const tooltipId = `rule-failure-${entityKey}-${rule.ruleIdentifier}`;

  return (
    <Chip
      size="small"
      color="error"
      variant="outlined"
      label={
        <Box
          component="span"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            maxWidth: "100%",
          }}
        >
          <Box
            component="span"
            sx={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {rule.ruleTitle}
          </Box>
          <Tooltip
            id={tooltipId}
            title={rule.failureReason}
            arrow
            placement="top"
            describeChild
          >
            <Box
              component="span"
              tabIndex={0}
              aria-label={`Why ${rule.ruleTitle} did not pass`}
              aria-describedby={tooltipId}
              sx={{
                flexShrink: 0,
                fontSize: "0.75rem",
                fontWeight: 700,
                fontStyle: "italic",
                fontFamily: "Georgia, serif",
                lineHeight: 1,
                color: "text.secondary",
                cursor: "help",
              }}
            >
              i
            </Box>
          </Tooltip>
        </Box>
      }
    />
  );
}
