import type { Params, PluginConfig } from "../types";

// No required parameters — always returns a valid config.
export function configFromParams(_params: Params): PluginConfig {
  return {} as PluginConfig;
}
