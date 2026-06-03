import type { mergePageFilters } from "@port-labs/plugins-sdk";

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

export type PortEntity = {
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

/** Alias for host PLUGIN_DATA.entity */
export type Entity = PortEntity;

export type ParamValue = {
  type?: string;
  value?: unknown;
};

export type Params = Record<string, ParamValue>;

/** Blueprint object from the `blueprint` upload param (`PLUGIN_DATA.params`). */
export type BlueprintParam = NonNullable<
  Parameters<typeof mergePageFilters>[2]
> & {
  title?: string;
};

export type PluginConfig = {
  blueprint: BlueprintParam;
  createdDateProperty: string;
  /** When true, calendar week starts Monday; otherwise Sunday (default). */
  weekStartsOnMonday: boolean;
};

export type CalendarEntity = {
  identifier: string;
  title: string;
  dateKey: string;
};
