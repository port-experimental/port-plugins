import { mergePageFilters } from "@port-labs/plugins-sdk";
import type { EntitiesQuery } from "@port-labs/plugins-sdk";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import type { BlueprintParam, Entity, Page } from "../types";

/** Cap so a single leaderboard load can't page through an unbounded blueprint. */
const ENTITY_POOL_LIMIT = 1000;
const SEARCH_PAGE_SIZE = 100;

type SearchResponse = {
  entities?: Entity[];
  next?: string | null;
};

function normalizeNext(next: unknown): string | null {
  if (next == null || next === "") return null;
  return String(next);
}

/** Only the fields the leaderboard reads — keeps each page response small. */
function buildInclude(sortProperty: string): string[] {
  return ["$identifier", "$title", "$team", sortProperty];
}

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
  filter: EntitiesQuery | null,
  sortProperty: string
): Promise<Entity[]> {
  if (DEV_MOCK) {
    return MOCK_CONTRIBUTORS;
  }

  const baseQuery: EntitiesQuery = filter ?? { combinator: "and", rules: [] };
  const query = mergePageFilters(baseQuery, page?.pageFilters, blueprint);
  const include = buildInclude(sortProperty);

  const all: Entity[] = [];
  let from: string | undefined;

  // Blueprint entity search is paginated; loop until exhausted (or the pool
  // cap) so ranking is correct across the whole blueprint, not just page 1.
  while (all.length < ENTITY_POOL_LIMIT) {
    const res = await fetch(
      `${portApiBaseUrl}/v1/blueprints/${encodeURIComponent(blueprint.identifier)}/entities/search`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${portToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          include,
          limit: Math.min(SEARCH_PAGE_SIZE, ENTITY_POOL_LIMIT - all.length),
          ...(from ? { from } : {}),
        }),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Entity search failed (${res.status}): ${body}`);
    }

    const data = (await res.json()) as SearchResponse;
    all.push(...(data.entities ?? []));

    const next = normalizeNext(data.next);
    if (!next) break;
    from = next;
  }

  return all;
}
