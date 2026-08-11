import "./App.css";
import { usePostMessageData } from "./hooks/usePostMessageData";
import { useSyncedEntities } from "./hooks/useSyncedEntities";
import { resolveHostSubject } from "./utils/resolveHostEntity";
import { readGithubExternalPropertyFields } from "./utils/githubExternalPropertyFields";
import { ShellMessage } from "./components/ShellMessage";
import { ErrorBanner } from "./components/ErrorBanner";
import { SyncedEntitiesTable } from "./components/SyncedEntitiesTable";

export function App() {
  const { entity, portToken, portApiBaseUrl } = usePostMessageData();
  const host = resolveHostSubject(entity);
  const fields = readGithubExternalPropertyFields(entity);

  // ALWAYS call — never behind a portToken/host guard (async host context).
  const query = useSyncedEntities(
    portToken,
    portApiBaseUrl,
    host?.identifier,
    fields
  );

  if (!portApiBaseUrl || !portToken) {
    return (
      <ShellMessage>
        Waiting for Port context… If this stays blank, check the browser
        console for errors.
      </ShellMessage>
    );
  }

  if (!host) {
    return (
      <ShellMessage>
        Place this widget on a "GitHub External Property" entity page so Port
        can provide the host entity.
      </ShellMessage>
    );
  }

  if (!fields) {
    return (
      <ShellMessage>
        This entity is missing one of <code>blueprint_name</code>,{" "}
        <code>property_name</code>, or <code>github_org</code> — this widget
        only works on <code>githubExternalCustomProperty</code> entities with
        all three set.
      </ShellMessage>
    );
  }

  const showLoading = query.isPending || query.isLoading;

  return (
    <div className="shell">
      <main className="main">
        {showLoading && (
          <p className="muted" role="status">
            Loading synced entities…
          </p>
        )}

        {query.isError && <ErrorBanner error={query.error} />}

        {query.isSuccess && query.data.rows.length === 0 && (
          <p className="muted">
            No entities of <code>{fields.blueprintName}</code> currently match
            org <code>{fields.githubOrg}</code>.
          </p>
        )}

        {query.isSuccess && query.data.rows.length > 0 && (
          <>
            <div className="org-summary">
              <span className="org-summary__title">GitHub organization filter</span>
              <p className="muted org-summary__value">
                <code>{query.data.organizationColumnPath}</code>:{" "}
                <code>{fields.githubOrg}</code>
              </p>
            </div>
            <SyncedEntitiesTable
              rows={query.data.rows}
              targetBlueprint={fields.blueprintName}
              targetBlueprintTitle={query.data.targetBlueprintTitle}
              propertyTitle={query.data.propertyTitle}
              propertyEnumColors={query.data.propertyEnumColors}
              showRunColumn={!!fields.syncWorkflowIdentifier}
            />
          </>
        )}
      </main>
    </div>
  );
}
