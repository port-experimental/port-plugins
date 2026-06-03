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
  blueprint?: string;
  properties?: Record<string, unknown>;
  /** Present on some API responses when mirror values are not inlined in `properties`. */
  mirrorProperties?: Record<string, unknown>;
  relations?: Record<string, unknown>;
};

export type Entity = PortEntity;

export type ParamValue = {
  type?: string;
  value?: unknown;
};

export type Params = Record<string, ParamValue>;

export type BlueprintParam = NonNullable<
  Parameters<typeof mergePageFilters>[2]
> & {
  title?: string;
};

export type PluginConfig = {
  blueprint: BlueprintParam;
};

export type PropertyKind = "boolean" | "enum" | "array" | "default";

export type BlueprintPropertyMeta = {
  identifier: string;
  title: string;
  type?: string;
  kind: PropertyKind;
  enumValues?: string[];
};

/** How array properties render on cards when visible. */
export type ArrayDisplayMode = "count" | "items";

/** How boolean properties render on cards when visible. */
export type BooleanDisplayMode = "pill" | "labeled";

export type StatusTone =
  | "success"
  | "danger"
  | "warning"
  | "neutral"
  | "info"
  | "backlog"
  | "violet";

export type EntitySearchPage = {
  entities: PortEntity[];
  next: string | null;
};
