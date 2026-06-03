import type { ReactNode } from "react";
import "./App.css";
import { usePostMessageData } from "./hooks/usePostMessageData";
import { configFromParams } from "./utils/config";
import { resolveHostSubject } from "./utils/resolveHostEntity";
// import { usePluginData } from "./hooks/usePluginData";

function ShellMessage({ children }: { children: ReactNode }) {
  return (
    <div className="shell shell--message">
      <p className="muted">{children}</p>
    </div>
  );
}

export function App() {
  const { params, entity, portToken, portApiBaseUrl } = usePostMessageData();
  const config = configFromParams(params);
  const host = resolveHostSubject(entity);

  // REQUIRED: call data hooks here — NEVER after early returns.
  // Port delivers portToken on a later render; conditional hooks crash React → blank iframe.
  // const { query } = usePluginData(config, portToken, portApiBaseUrl, host?.blueprint, host?.identifier);

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
        Configure required widget parameters in Port (see plugin README).
      </ShellMessage>
    );
  }

  // Remove this block for dashboard-only widgets (no PLUGIN_DATA.entity).
  if (!host) {
    return (
      <ShellMessage>
        Place this widget on an entity page so Port can provide the host entity.
      </ShellMessage>
    );
  }

  const showLoading = false; // query.isPending || query.isLoading

  return (
    <div className="shell">
      <main className="main">
        {showLoading ? (
          <p className="muted" role="status">
            Loading…
          </p>
        ) : (
          <p className="muted">
            Replace with LoadingState, EmptyState, ErrorBanner, and functional UI.
            Host: {host.blueprint} / {host.identifier}
          </p>
        )}
      </main>
    </div>
  );
}
