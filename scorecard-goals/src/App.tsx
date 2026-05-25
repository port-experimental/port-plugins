import { useState } from "react";
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
      <div className="shell">
        <p className="muted">
          Waiting for Port context… If you opened this file directly, embed it
          in a Port dashboard instead.
        </p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="shell">
        <p className="muted">
          Configure the <strong>Blueprint</strong> parameter for this widget.
        </p>
      </div>
    );
  }

  const hasRows = rows.length > 0;
  const gapsModalRow = gapsModalScorecardId
    ? rows.find((r) => r.scorecardIdentifier === gapsModalScorecardId)
    : undefined;

  return (
    <div className="shell">
      <p className="scope-label">
        Blueprint: <strong>{config.blueprint.title}</strong>
        {!isLoading && !isError && (
          <span className="scope-label__count">
            {" "}
            · {entityCount} {entityCount === 1 ? "entity" : "entities"}
          </span>
        )}
      </p>

      {isLoading && <LoadingState />}
      {isError && <ErrorBanner error={error} />}

      {!isLoading && !isError && !hasRows && (
        <EmptyState
          blueprintTitle={config.blueprint.title}
          hasEntities={entityCount > 0}
        />
      )}

      {!isLoading && !isError && hasRows && (
        <ul className="scorecard-list">
          {rows.map((row) => (
            <li key={row.scorecardIdentifier}>
              <ScorecardBar
                row={row}
                gapCount={
                  gapsByScorecard[row.scorecardIdentifier]?.length ?? 0
                }
                onShowGaps={() =>
                  setGapsModalScorecardId(row.scorecardIdentifier)
                }
              />
            </li>
          ))}
        </ul>
      )}

      {gapsModalRow && config && (
        <GapsModal
          scorecardTitle={gapsModalRow.scorecardTitle}
          blueprintIdentifier={config.blueprint.identifier}
          entities={gapsByScorecard[gapsModalRow.scorecardIdentifier] ?? []}
          onClose={() => setGapsModalScorecardId(null)}
        />
      )}
    </div>
  );
}
