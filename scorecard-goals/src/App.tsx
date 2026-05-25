import { useState } from "react";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import { Box, Chip, Stack, Typography } from "@mui/material";
import "./App.css";
import { EmptyState } from "./components/EmptyState";
import { ErrorBanner } from "./components/ErrorBanner";
import { GapsModal } from "./components/GapsModal";
import { LoadingState } from "./components/LoadingState";
import { ScorecardBar } from "./components/ScorecardBar";
import { usePostMessageData } from "./hooks/usePostMessageData";
import { useScorecardGoals } from "./hooks/useScorecardGoals";
import { configFromParams } from "./utils/config";

export function App() {
  const { params, portToken, portApiBaseUrl } = usePostMessageData();
  const config = configFromParams(params);
  const [gapsModalScorecardId, setGapsModalScorecardId] = useState<
    string | null
  >(null);

  const { rows, gapsByScorecard, entityCount, isLoading, isError, error } =
    useScorecardGoals(config, portToken, portApiBaseUrl);

  if (!portApiBaseUrl || !portToken) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Waiting for Port context… If you opened this file directly, embed it in
          a Port dashboard instead.
        </Typography>
      </Box>
    );
  }

  if (!config) {
    return (
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          p: 3,
        }}
      >
        <Typography variant="body1" color="text.secondary" textAlign="center">
          Configure the <strong>Blueprint</strong> parameter for this widget.
        </Typography>
      </Box>
    );
  }

  const hasRows = rows.length > 0;
  const gapsModalRow = gapsModalScorecardId
    ? rows.find((r) => r.scorecardIdentifier === gapsModalScorecardId)
    : undefined;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        p: 2,
        gap: 2,
        bgcolor: "background.default",
      }}
    >
      <Chip
        icon={<CategoryOutlinedIcon />}
        label={
          !isLoading && !isError
            ? `${config.blueprint.title} · ${entityCount} ${entityCount === 1 ? "entity" : "entities"}`
            : config.blueprint.title
        }
        variant="outlined"
        sx={{ alignSelf: "flex-start" }}
      />

      {isLoading && <LoadingState />}
      {isError && <ErrorBanner error={error} />}

      {!isLoading && !isError && !hasRows && (
        <EmptyState
          blueprintTitle={config.blueprint.title}
          hasEntities={entityCount > 0}
        />
      )}

      {!isLoading && !isError && hasRows && (
        <Stack
          component="ul"
          spacing={1.5}
          sx={{
            listStyle: "none",
            m: 0,
            p: 0,
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
          }}
        >
          {rows.map((row) => (
            <Box component="li" key={row.scorecardIdentifier}>
              <ScorecardBar
                row={row}
                gapCount={gapsByScorecard[row.scorecardIdentifier]?.length ?? 0}
                onShowGaps={() =>
                  setGapsModalScorecardId(row.scorecardIdentifier)
                }
              />
            </Box>
          ))}
        </Stack>
      )}

      {gapsModalRow && config && (
        <GapsModal
          scorecardTitle={gapsModalRow.scorecardTitle}
          blueprintIdentifier={config.blueprint.identifier}
          entities={gapsByScorecard[gapsModalRow.scorecardIdentifier] ?? []}
          onClose={() => setGapsModalScorecardId(null)}
        />
      )}
    </Box>
  );
}
