import { DEV_MOCK } from "../hooks/usePostMessageData";
import type { PortEntitySummary } from "../types";
import { MOCK_ENTITIES } from "../dev/mockData";
import { portFetch } from "./portFetch";

type SearchResponse = {
  entities?: Array<{
    identifier: string;
    title?: string;
    blueprint?: string;
  }>;
};

export async function searchBlueprintEntities(
  baseUrl: string,
  token: string,
  blueprint: string,
  limit = 200
): Promise<PortEntitySummary[]> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 120));
    return MOCK_ENTITIES.filter((e) => e.blueprint === blueprint);
  }

  const data = await portFetch<SearchResponse>(
    baseUrl,
    token,
    `/v1/blueprints/${encodeURIComponent(blueprint)}/entities/search`,
    {
      method: "POST",
      body: JSON.stringify({
        query: { combinator: "and", rules: [] },
        limit,
      }),
    }
  );

  return (data.entities ?? []).map((entity) => ({
    identifier: entity.identifier,
    title: entity.title ?? entity.identifier,
    blueprint,
  }));
}
