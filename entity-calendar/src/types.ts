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

export type BlueprintParam = {
  identifier: string;
  title: string;
};

export type PluginConfig = {
  blueprint: BlueprintParam;
  createdDateProperty: string;
};

export type CalendarEntity = {
  identifier: string;
  title: string;
  dateKey: string;
};
