import "./App.css";
import { usePostMessageData } from "./hooks/usePostMessageData";
import type { PluginConfig, Params } from "./types";

function configFromParams(params: Params): PluginConfig {
  return {
    // Replace with actual param keys from upload-params.json:
    // exampleParam: String(params["exampleParam"]?.value ?? ""),
  };
}

export function App() {
  const { params, user, entity, portToken, portApiBaseUrl } =
    usePostMessageData();
  const config = configFromParams(params);

  // Guard: waiting for Port host to provide token and API context
  if (!portApiBaseUrl || !portToken) {
    return (
      <div className="shell">
        <p className="muted">
          Waiting for Port context… If you opened this file directly, embed it
          in a Port dashboard or entity page instead.
        </p>
      </div>
    );
  }

  // Guard: entity-scoped widgets only — remove this block for dashboard widgets
  if (!entity?.identifier) {
    return (
      <div className="shell">
        <p className="muted">Open this widget on an entity page to load data.</p>
      </div>
    );
  }

  return (
    <div className="shell">
      {/* Functional UI only — no plugin title, description, or icon; use <i> or icon lib, not emoji */}
      <pre>{JSON.stringify({ config, entity: entity.identifier }, null, 2)}</pre>
    </div>
  );
}
