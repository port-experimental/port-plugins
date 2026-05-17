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

export type BlueprintParam = {
  identifier: string;
  title: string;
};

export type PluginConfig = {
  blueprint: BlueprintParam;
  /** When set, read creation date from entity.properties[key] instead of createdAt */
  createdDateProperty: string;
};

export type CalendarEntity = {
  identifier: string;
  title: string;
  createdDate: Date;
};
