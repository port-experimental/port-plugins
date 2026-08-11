import { useQuery } from "@tanstack/react-query";
import { fetchBlueprint } from "../api/blueprints";
import { searchSyncedEntities } from "../api/entities";
import { resolveLatestRunsForEntities } from "../api/workflowRuns";
import { resolveOrgFilterStrategy } from "../utils/orgFilterStrategy";
import type {
  Entity,
  GithubExternalPropertyFields,
  OrgFilterStrategy,
  SyncedEntityRow,
} from "../types";

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

  if (fields.syncWorkflowIdentifier && rows.length > 0) {
    const latestRuns = await resolveLatestRunsForEntities(
      token,
      portApiBaseUrl,
      fields.syncWorkflowIdentifier,
      rows.map((row) => row.identifier)
    );
    for (const row of rows) {
      row.latestRun = latestRuns.get(row.identifier);
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
    queryFn: () => loadSyncedEntities(token!, portApiBaseUrl, fields!),
    enabled: !!token && !!portApiBaseUrl && !!fields,
    staleTime: 5 * 60 * 1000,
  });
}
