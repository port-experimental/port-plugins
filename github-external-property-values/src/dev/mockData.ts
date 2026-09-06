import type {
  BlueprintSchema,
  Entity,
  WorkflowRunDetail,
  WorkflowRunListItem,
} from "../types";

/**
 * Fixtures mirroring real catalog shapes from this org (see README
 * Prerequisites). Two blueprints are mocked to exercise both org-filter
 * flows: `service` (direct property `github_org`) and `githubRepository`
 * (relation `organization` → `githubOrganization`).
 */

export const MOCK_BLUEPRINTS: Record<string, BlueprintSchema> = {
  service: {
    identifier: "service",
    title: "Service",
    schema: {
      properties: {
        lifecycle: {
          title: "Lifecycle",
          type: "string",
          enum: ["Production", "Experimental", "Deprecated"],
          enumColors: {
            Production: "green",
            Experimental: "yellow",
            Deprecated: "red",
          },
        },
        criticality: {
          title: "Criticality",
          type: "string",
          enum: ["low", "medium", "high", "critical"],
          enumColors: {
            critical: "red",
            high: "orange",
            low: "turquoise",
            medium: "yellow",
          },
        },
      },
    },
    mirrorProperties: {
      github_org: {
        title: "GitHub Org",
        type: "string",
        path: "github_repository.organization.$identifier",
      },
    },
    relations: {
      domain: { title: "Domain", target: "domain", many: false },
      github_repository: {
        title: "GitHub Repository",
        target: "githubRepository",
        many: false,
      },
    },
  },
  githubRepository: {
    identifier: "githubRepository",
    title: "GitHub Repository",
    schema: {
      properties: {
        custom_prop: { title: "custom_prop", type: "string" },
      },
    },
    mirrorProperties: {},
    relations: {
      organization: {
        title: "Organization",
        target: "githubOrganization",
        many: false,
      },
      githubTeams: { title: "GitHub Teams", target: "githubTeam", many: true },
    },
  },
};

export const MOCK_ENTITIES: Record<string, Entity[]> = {
  service: [
    {
      identifier: "deep-copy-entities",
      title: "deep-copy-entities",
      blueprint: "service",
      properties: { lifecycle: "Experimental", github_org: "port-experimental" },
    },
    {
      identifier: "billing-service",
      title: "Billing Service",
      blueprint: "service",
      properties: { lifecycle: "Production", github_org: "port-experimental" },
    },
  ],
  githubRepository: [
    {
      identifier: "port-plugins",
      title: "port-plugins",
      blueprint: "githubRepository",
      properties: { custom_prop: "hello-world" },
      relations: { organization: "port-experimental" },
    },
  ],
};

/**
 * `billing-service` intentionally has no matching run fixture below, to
 * exercise the "no recent run found" ("—") case alongside a resolved one.
 */
export const MOCK_WORKFLOW_RUNS: Record<string, WorkflowRunListItem[]> = {
  sync_port_lifecycle_attr: [
    {
      identifier: "wfr_mock_3",
      status: "COMPLETED",
      result: "SUCCESS",
      createdAt: "2026-07-13T08:01:07.204Z",
      workflowVersion: { workflow: { identifier: "sync_port_lifecycle_attr" } },
    },
    {
      identifier: "wfr_mock_2",
      status: "COMPLETED",
      result: "SUCCESS",
      createdAt: "2026-07-12T14:38:44.854Z",
      workflowVersion: { workflow: { identifier: "sync_port_lifecycle_attr" } },
    },
  ],
  sync_port_custom_attr: [
    {
      identifier: "wfr_mock_10",
      status: "COMPLETED",
      result: "SUCCESS",
      createdAt: "2026-07-11T09:12:00.000Z",
      workflowVersion: { workflow: { identifier: "sync_port_custom_attr" } },
    },
  ],
  /**
   * The global bulk-sync workflow (see README "How 'Latest sync run' is
   * resolved"). `wfr_mock_20` postdates `wfr_mock_3` — the per-entity run
   * for `deep-copy-entities` — so the merge logic in `useSyncedEntities`
   * should pick this newer, bulk-sourced run for that row instead.
   * `wfr_mock_21` exercises the manual self-service "Bulk Sync" trigger,
   * whose entity id arrives as a plain output field, not a `diff`.
   */
  manage_sync_workflows: [
    {
      identifier: "wfr_mock_21",
      status: "COMPLETED",
      result: "SUCCESS",
      createdAt: "2026-07-14T10:00:00.000Z",
      workflowVersion: { workflow: { identifier: "manage_sync_workflows" } },
    },
    {
      identifier: "wfr_mock_20",
      status: "COMPLETED",
      result: "SUCCESS",
      createdAt: "2026-07-13T16:45:00.000Z",
      workflowVersion: { workflow: { identifier: "manage_sync_workflows" } },
    },
  ],
};

export const MOCK_WORKFLOW_RUN_DETAILS: Record<string, WorkflowRunDetail> = {
  wfr_mock_3: {
    identifier: "wfr_mock_3",
    nodeRuns: [
      { output: { diff: { before: null, after: { identifier: "deep-copy-entities" } } } },
      { output: { new_value: "Experimental", old_value: null } },
    ],
  },
  wfr_mock_2: {
    identifier: "wfr_mock_2",
    nodeRuns: [
      { output: { diff: { before: null, after: { identifier: "deep-copy-entities" } } } },
      { output: { new_value: "Experimental", old_value: null } },
    ],
  },
  wfr_mock_10: {
    identifier: "wfr_mock_10",
    nodeRuns: [
      { output: { diff: { before: null, after: { identifier: "port-plugins" } } } },
      { output: { new_value: "hello-world", old_value: null } },
    ],
  },
  // Triggered by an update of the `Port.lifecycle_attr` host property entity.
  wfr_mock_20: {
    identifier: "wfr_mock_20",
    nodeRuns: [
      {
        output: {
          diff: { before: { identifier: "Port.lifecycle_attr" }, after: { identifier: "Port.lifecycle_attr" } },
        },
      },
    ],
  },
  // Triggered manually via the "Bulk Sync GitHub External Property" self-service trigger.
  wfr_mock_21: {
    identifier: "wfr_mock_21",
    nodeRuns: [
      { output: { github_external_custom_property: "Port.lifecycle_attr" } },
    ],
  },
};
