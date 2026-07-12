export type ParamValue = { type?: string; value?: unknown; identifier?: string };
export type Params = Record<string, ParamValue | undefined>;
export type Page = { identifier?: string; pageFilters?: unknown };
export type User = { firstName?: string; lastName?: string; email?: string; picture?: string };
export type Entity = {
  identifier: string;
  title?: string;
  blueprint?: string;
  properties?: Record<string, unknown>;
  relations?: Record<string, unknown>;
};
