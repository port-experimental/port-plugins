import { MOCK_ENTITIES } from "../dev/mockData";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import type { PortEntity } from "../types";

type SearchResponse = {
  entities?: PortEntity[];
  ok?: boolean;
};

type ListResponse = {
  entities?: PortEntity[];
  ok?: boolean;
};

async function parseError(response: Response): Promise<never> {
  const body = await response.text();
  throw new Error(`Port API ${response.status}:\n${body}`);
}

export async function searchBlueprintEntities(
  baseUrl: string,
  token: string,
  blueprintIdentifier: string
): Promise<PortEntity[]> {
  if (DEV_MOCK) return MOCK_ENTITIES;

  const res = await fetch(
    `${baseUrl}/v1/blueprints/${encodeURIComponent(blueprintIdentifier)}/entities/search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: { combinator: "and", rules: [] },
      }),
    }
  );

  if (!res.ok) await parseError(res);

  const data = (await res.json()) as SearchResponse;
  if (Array.isArray(data.entities)) return data.entities;

  const listRes = await fetch(
    `${baseUrl}/v1/blueprints/${encodeURIComponent(blueprintIdentifier)}/entities`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!listRes.ok) await parseError(listRes);

  const listData = (await listRes.json()) as ListResponse;
  return listData.entities ?? [];
}
