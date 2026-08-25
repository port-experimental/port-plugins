import { useQuery } from "@tanstack/react-query";
import { fetchBlueprint } from "../api/blueprints";
import { searchSyncedEntities } from "../api/entities";
import {
  resolveLatestBulkSyncRun,
  resolveLatestRunsForEntities,
} from "../api/workflowRuns";
import { resolveOrgFilterStrategy } from "../utils/orgFilterStrategy";
import type {
  Entity,
  GithubExternalPropertyFields,
  OrgFilterStrategy,
  SyncedEntityRow,
  WorkflowRunSummary,
} from "../types";

/** Whichever run is more recent — the row's own sync, or a bulk sync of the property. */
function pickLatestRun(
  a: WorkflowRunSummary | undefined,
  b: WorkflowRunSummary | undefined
): WorkflowRunSummary | undefined {
  if (!a) return b;
  if (!b) return a;
  return new Date(b.createdAt) > new Date(a.createdAt) ? b : a;
}

export type SyncedEntitiesResult = {
  rows: SyncedEntityRow[];
  targetBlueprintTitle: string;
  propertyTitle: string;
  propertyEnumColors?: Record<string, string>;
  organizationColumnPath: string;
};

function readOrganizationValue(
  entity: Entity,
  strategy: OrgFilterStrategy
): unknown {
  if (strategy.kind === "property") {
    return entity.properties?.[strategy.propertyKey];
  }
  if (strategy.kind === "relation") {
    return entity.relations?.[strategy.relationKey];
  }
  return undefined;
}

async function loadSyncedEntities(
  token: string,
  portApiBaseUrl: string | null,
  hostIdentifier: string,
  fields: GithubExternalPropertyFields
): Promise<SyncedEntitiesResult> {
  const targetBlueprint = await fetchBlueprint(
    token,
    portApiBaseUrl,
    fields.blueprintName
  );

  const strategy = resolveOrgFilterStrategy(targetBlueprint);
  if (strategy.kind === "unsupported") {
    throw new Error(
      `Blueprint "${fields.blueprintName}" has no "github_org" property and no relation to "githubOrganization" — cannot resolve which entities belong to org "${fields.githubOrg}".`
    );
  }

  const entities = await searchSyncedEntities(
    token,
    portApiBaseUrl,
    fields.blueprintName,
    strategy,
    fields.githubOrg
  );

  const propertySchema =
    targetBlueprint.schema?.properties?.[fields.propertyName] ??
    targetBlueprint.mirrorProperties?.[fields.propertyName] ??
    targetBlueprint.calculationProperties?.[fields.propertyName];

  const rows: SyncedEntityRow[] = entities.map((entity) => ({
    identifier: entity.identifier,
    title: entity.title ?? entity.identifier,
    propertyValue: entity.properties?.[fields.propertyName],
    organizationValue: readOrganizationValue(entity, strategy),
  }));

  if (rows.length > 0) {
    const [latestRuns, bulkRun] = await Promise.all([
      fields.syncWorkflowIdentifier
        ? resolveLatestRunsForEntities(
            token,
            portApiBaseUrl,
            fields.syncWorkflowIdentifier,
            rows.map((row) => row.identifier),
            "entity"
          )
        : Promise.resolve(new Map<string, WorkflowRunSummary>()),
      resolveLatestBulkSyncRun(token, portApiBaseUrl, hostIdentifier),
    ]);
    for (const row of rows) {
      row.latestRun = pickLatestRun(latestRuns.get(row.identifier), bulkRun);
    }
  }

  return {
    rows,
    targetBlueprintTitle: targetBlueprint.title ?? fields.blueprintName,
    propertyTitle: propertySchema?.title ?? fields.propertyName,
    propertyEnumColors: propertySchema?.enumColors,
    organizationColumnPath: strategy.path,
  };
}

export function useSyncedEntities(
  token: string | null,
  portApiBaseUrl: string | null,
  hostIdentifier: string | undefined,
  fields: GithubExternalPropertyFields | null
) {
  return useQuery({
    queryKey: ["synced-entities", hostIdentifier, fields],
    queryFn: () =>
      loadSyncedEntities(token!, portApiBaseUrl, hostIdentifier!, fields!),
    enabled: !!token && !!portApiBaseUrl && !!hostIdentifier && !!fields,
    staleTime: 5 * 60 * 1000,
  });
}
