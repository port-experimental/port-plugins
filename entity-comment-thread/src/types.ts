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

export type PluginConfig = {
  commentBlueprint: BlueprintParam;
};

/** A Port _user entity (fetched for @mention autocomplete) */
export type PortUser = {
  identifier: string;
  title?: string;
  properties?: {
    email?: string;
    port_role?: string;
    status?: string;
  };
};

/** A comment entity returned from the Port API */
export type Comment = {
  identifier: string;
  title?: string;
  createdAt: string;
  updatedAt?: string;
  properties: {
    body: string;
    /**
     * Port user who wrote this comment.
     * Stored as a `format: "user"` property — value is the user's email.
     */
    author?: string | null;
    status?: "open" | "resolved";
    subjectBlueprint: string;
    subjectIdentifier: string;
    mentions?: string[];
  };
  /**
   * `parentComment` → parent comment entity identifier (null for top-level).
   * Set via the self-relation on the `comment` blueprint.
   */
  relations?: {
    parentComment?: string | null;
  };
  relationsObjects?: {
    parentComment?: { identifier: string; title?: string } | null;
  };
};
