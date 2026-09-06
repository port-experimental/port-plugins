import type { Entity, OrgFilterStrategy } from "../types";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_ENTITIES } from "../dev/mockData";

type SearchRule = Record<string, unknown>;

function buildOrgFilterRule(
  strategy: OrgFilterStrategy,
  githubOrg: string
): SearchRule | null {
  if (strategy.kind === "property") {
    return { property: strategy.propertyKey, operator: "=", value: githubOrg };
  }
  if (strategy.kind === "relation") {
    return {
      relation: strategy.relationKey,
      operator: "=",
      value: githubOrg,
    };
  }
  return null;
}

/**
 * POST /v1/blueprints/{blueprint}/entities/search — body nests rules under
 * `query` (top-level combinator/rules is rejected with a 422).
 */
export async function searchSyncedEntities(
  token: string,
  portApiBaseUrl: string | null,
  targetBlueprint: string,
  strategy: OrgFilterStrategy,
  githubOrg: string
): Promise<Entity[]> {
  const orgRule = buildOrgFilterRule(strategy, githubOrg);
  if (!orgRule) return [];

  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_ENTITIES[targetBlueprint] ?? [];
  }

  const url = `${portApiBaseUrl}/v1/blueprints/${encodeURIComponent(
    targetBlueprint
  )}/entities/search`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query: { combinator: "and", rules: [orgRule] },
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Port API ${res.status}:\n${body}`);
  }
  const data = await res.json();
  return (data.entities ?? []) as Entity[];
}
