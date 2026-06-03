export type Page = {
  identifier?: string;
  pageFilters?: unknown;
};

export type User = {
  firstName?: string;
  lastName?: string;
  email?: string;
  picture?: string;
};

import type { mergePageFilters } from "@port-labs/plugins-sdk";

export type BlueprintParam = NonNullable<
  Parameters<typeof mergePageFilters>[2]
> & { title?: string };

export type Entity = {
  identifier: string;
  title?: string;
  icon?: string;
  team?: string;
  blueprint?: string;
  createdAt?: string;
  updatedAt?: string;
  properties?: Record<string, unknown>;
  relations?: Record<string, unknown>;
};

export type ParamValue = {
  type?: string;
  value?: unknown;
};

export type Params = Record<string, ParamValue>;

/**
 * Derived from upload-params.json.
 * Add one field per parameter key defined in upload-params.json.
 */
export type PluginConfig = {
  blueprint: BlueprintParam;
  // Add optional string overrides per upload-params.json
};
