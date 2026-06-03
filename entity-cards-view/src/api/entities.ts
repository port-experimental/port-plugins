import { mergePageFilters, type PageQuery } from "@port-labs/plugins-sdk";
import { MOCK_ENTITIES_PAGE } from "../dev/mockData";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import type {
  BlueprintParam,
  EntitySearchPage,
  Page,
  PortEntity,
} from "../types";
import { parsePortError } from "./portFetch";

export const PAGE_SIZE = 12;
/** Max entities loaded for this widget (page filters apply; search is client-only). */
const CARD_ENTITY_POOL_LIMIT = 200;

type SearchResponse = {
  entities?: PortEntity[];
  next?: string | null;
};

function normalizeNext(next: unknown): string | null {
  if (next == null || next === "") return null;
  return String(next);
}

function buildInclude(visiblePropertyIds: string[]): string[] {
  const include = new Set<string>(["$identifier", "$title", "$icon"]);
  for (const id of visiblePropertyIds) {
    include.add(id);
  }
  return [...include];
}

function buildBaseQuery(
  blueprint: BlueprintParam,
  page: Page | undefined
): Record<string, unknown> {
  let baseQuery: Record<string, unknown> = {
    combinator: "and",
    rules: [],
  };

  if (page?.pageFilters) {
    baseQuery = mergePageFilters(
      baseQuery as Parameters<typeof mergePageFilters>[0],
      page.pageFilters as PageQuery[],
      blueprint
    ) as Record<string, unknown>;
  }

  return baseQuery;
}

async function postEntitySearch(
  baseUrl: string,
  token: string,
  blueprintIdentifier: string,
  body: Record<string, unknown>
): Promise<SearchResponse> {
  const path = `/v1/blueprints/${encodeURIComponent(blueprintIdentifier)}/entities/search`;
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) await parsePortError(res);
  return (await res.json()) as SearchResponse;
}

export async function fetchCardEntityPool(
  baseUrl: string,
  token: string,
  blueprint: BlueprintParam,
  page: Page | undefined,
  visiblePropertyIds: string[]
): Promise<PortEntity[]> {
  if (DEV_MOCK) {
    void baseUrl;
    void token;
    void blueprint;
    void page;
    void visiblePropertyIds;
    return MOCK_ENTITIES_PAGE;
  }

  const all: PortEntity[] = [];
  let from: string | undefined;

  while (all.length < CARD_ENTITY_POOL_LIMIT) {
    const data = await postEntitySearch(baseUrl, token, blueprint.identifier, {
      query: buildBaseQuery(blueprint, page),
      limit: Math.min(100, CARD_ENTITY_POOL_LIMIT - all.length),
      include: buildInclude(visiblePropertyIds),
      ...(from ? { from } : {}),
    });

    all.push(...(data.entities ?? []));
    const next = normalizeNext(data.next);
    if (!next) break;
    from = next;
  }

  return all;
}

export function paginateCardEntities(
  entities: PortEntity[],
  from: string | undefined
): EntitySearchPage {
  const start = from ? Number.parseInt(from, 10) : 0;
  const safeStart = Number.isFinite(start) ? Math.max(0, start) : 0;
  const slice = entities.slice(safeStart, safeStart + PAGE_SIZE);
  const nextStart = safeStart + PAGE_SIZE;
  return {
    entities: slice,
    next: nextStart < entities.length ? String(nextStart) : null,
  };
}
