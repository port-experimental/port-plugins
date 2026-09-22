import type { EntitiesQuery, PageQuery } from "@port-labs/plugins-sdk";

export type Page = {
  identifier?: string;
  pageFilters?: PageQuery[];
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
  team?: string | string[];
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

export type SortDirection = "asc" | "desc";

/** Derived from upload-params.json. */
export type PluginConfig = {
  blueprint: BlueprintParam;
  sortProperty: string;
  sortDirection: SortDirection;
  limit: number;
  filter: EntitiesQuery | null;
};

export type LeaderboardEntry = {
  entity: Entity;
  rank: number;
  value: number | null;
};
