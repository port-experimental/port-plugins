import type { ReactNode } from "react";
import "./App.css";
import { usePostMessageData } from "./hooks/usePostMessageData";
import { useLeaderboardData } from "./hooks/useLeaderboardData";
import { configFromParams } from "./utils/config";
import { EntityAvatar } from "./components/EntityAvatar";
import { MedalIcon } from "./components/MedalIcon";
import { entityPageUrl } from "./utils/portalUrl";
import type { LeaderboardEntry } from "./types";

function ShellMessage({ children }: { children: ReactNode }) {
  return (
    <div className="shell shell--message">
      <p className="muted">{children}</p>
    </div>
  );
}

const TILE_CLASS: Record<number, string> = {
  1: "leaderboard-row--gold",
  2: "leaderboard-row--silver",
  3: "leaderboard-row--bronze",
};

function LeaderboardRow({
  entry,
  blueprintIdentifier,
}: {
  entry: LeaderboardEntry;
  blueprintIdentifier: string;
}) {
  const { entity, rank, value } = entry;
  const title = entity.title || entity.identifier;
  const tileClass = TILE_CLASS[rank];
  const href = entityPageUrl(entity.blueprint ?? blueprintIdentifier, entity.identifier);

  return (
    <li className={`leaderboard-row ${tileClass ?? ""}`}>
      <span className="leaderboard-row__icon">
        {tileClass ? <MedalIcon rank={rank as 1 | 2 | 3} /> : <EntityAvatar label={title} />}
      </span>
      <div className="leaderboard-row__info">
        <a
          className="leaderboard-row__title"
          href={href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {title}
        </a>
        {entity.team ? (
          <span className="leaderboard-row__subtitle">
            {Array.isArray(entity.team) ? entity.team.join(", ") : entity.team}
          </span>
        ) : null}
      </div>
      <span className="leaderboard-row__value">
        {value === null ? "—" : value.toLocaleString()}
      </span>
    </li>
  );
}

export function App() {
  const { params, page, portToken, portApiBaseUrl } = usePostMessageData();
  const config = configFromParams(params);

  // REQUIRED: call data hooks here, NEVER after early returns.
  const { query } = useLeaderboardData(config, portToken, portApiBaseUrl, page);

  if (!portApiBaseUrl || !portToken) {
    return (
      <ShellMessage>
        Waiting for Port context… If this stays blank, check the browser console for
        errors.
      </ShellMessage>
    );
  }

  if (!config) {
    return (
      <ShellMessage>
        Configure the blueprint and "sortProperty" widget parameters in Port (see plugin
        README).
      </ShellMessage>
    );
  }

  const showLoading = query.isPending || query.isLoading;

  return (
    <div className="shell">
      <main className="main">
        {showLoading ? (
          <p className="muted" role="status">
            Loading…
          </p>
        ) : query.isError ? (
          <div className="error-state" role="alert">
            <p className="muted">
              Couldn't load the leaderboard: {(query.error as Error)?.message ?? "unknown error"}
            </p>
            <button type="button" className="retry-button" onClick={() => query.refetch()}>
              Retry
            </button>
          </div>
        ) : !query.data || query.data.length === 0 ? (
          <p className="muted">
            No entities found for blueprint "{config.blueprint.identifier}". Check the
            dashboard filters and the "{config.sortProperty}" property.
          </p>
        ) : (
          <ol className="leaderboard-list">
            {query.data.map((entry) => (
              <LeaderboardRow
                key={entry.entity.identifier}
                entry={entry}
                blueprintIdentifier={config.blueprint.identifier}
              />
            ))}
          </ol>
        )}
      </main>
    </div>
  );
}
