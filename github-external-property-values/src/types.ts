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

/** The subset of a GitHub External Property entity's properties/relations this widget reads. */
export type GithubExternalPropertyFields = {
  blueprintName: string;
  propertyName: string;
  githubOrg: string;
  githubAttrName?: string;
  syncWorkflowIdentifier?: string;
};

/** Minimal shape of a Port property schema entry, as returned by GET /v1/blueprints/{id}. */
export type PropertySchema = {
  title?: string;
  type?: string;
  format?: string;
  enum?: string[];
  enumColors?: Record<string, string>;
};

/** Minimal shape of a Port relation schema entry. */
export type RelationSchema = {
  title?: string;
  target: string;
  many?: boolean;
};

export type BlueprintSchema = {
  identifier: string;
  title?: string;
  schema?: { properties?: Record<string, PropertySchema> };
  mirrorProperties?: Record<string, PropertySchema & { path?: string }>;
  calculationProperties?: Record<string, PropertySchema>;
  relations?: Record<string, RelationSchema>;
};

/**
 * How this widget resolves "entities of blueprintName belonging to
 * githubOrg". `path` is the dot-path to the org value on the entity —
 * shown as the organization column header.
 */
export type OrgFilterStrategy =
  | { kind: "property"; propertyKey: "github_org"; path: string }
  | {
      kind: "relation";
      relationKey: string;
      targetBlueprint: string;
      path: string;
    }
  | { kind: "unsupported" };

export type SyncedEntityRow = {
  identifier: string;
  title: string;
  propertyValue: unknown;
  organizationValue: unknown;
  latestRun?: WorkflowRunSummary;
};

/** Minimal shape of a run from GET /v1/workflows/runs (list) or /runs/:identifier (detail). */
export type WorkflowRunListItem = {
  identifier: string;
  status: "COMPLETED" | "IN_PROGRESS" | "CANCELLING";
  result: "SUCCESS" | "FAILED" | "CANCELLED" | null;
  createdAt: string;
  workflowVersion: { workflow: { identifier: string } };
};

export type WorkflowNodeRun = {
  output?: {
    diff?: {
      before?: { identifier?: string } | null;
      after?: { identifier?: string } | null;
    };
  };
};

export type WorkflowRunDetail = {
  identifier: string;
  nodeRuns: WorkflowNodeRun[];
};

/** Resolved "latest run" info attached to a table row. */
export type WorkflowRunSummary = {
  runId: string;
  status: WorkflowRunListItem["status"];
  result: WorkflowRunListItem["result"];
  createdAt: string;
};
