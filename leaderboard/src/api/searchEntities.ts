import { mergePageFilters } from "@port-labs/plugins-sdk";
import type { EntitiesQuery } from "@port-labs/plugins-sdk";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import type { BlueprintParam, Entity, Page } from "../types";

type SearchResponse = {
  entities?: Entity[];
};

// Sample data for local `npm run dev` preview, never used inside the Port iframe.
const MOCK_CONTRIBUTORS: Entity[] = [
  { identifier: "dana", title: "Dana Cohen", team: "Platform", properties: { skillsContributed: 27 } },
  { identifier: "revital", title: "Revital Ben Ami", team: "Developer Experience", properties: { skillsContributed: 24 } },
  { identifier: "yossi", title: "Yossi Levi", team: "Platform", properties: { skillsContributed: 19 } },
  { identifier: "maya", title: "Maya Ron", team: "Backend", properties: { skillsContributed: 15 } },
  { identifier: "tal", title: "Tal Golan", team: "Backend", properties: { skillsContributed: 12 } },
  { identifier: "noa", title: "Noa Peretz", team: "Frontend", properties: { skillsContributed: 9 } },
  { identifier: "omer", title: "Omer Shaked", team: "Frontend", properties: { skillsContributed: 6 } },
];

export async function searchLeaderboardEntities(
  portApiBaseUrl: string,
  portToken: string,
  blueprint: BlueprintParam,
  page: Page | undefined,
  filter: EntitiesQuery | null
): Promise<Entity[]> {
  if (DEV_MOCK) {
    return MOCK_CONTRIBUTORS;
  }

  const baseQuery: EntitiesQuery = filter ?? { combinator: "and", rules: [] };
  const query = mergePageFilters(baseQuery, page?.pageFilters, blueprint);

  const res = await fetch(
    `${portApiBaseUrl}/v1/blueprints/${encodeURIComponent(blueprint.identifier)}/entities/search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${portToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Entity search failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as SearchResponse;
  return data.entities ?? [];
}
