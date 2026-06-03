import { mergePageFilters, type PageQuery } from "@port-labs/plugins-sdk";
import { MOCK_ENTITIES } from "../dev/mockData";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import type { BlueprintParam, Page, PortEntity } from "../types";

const PAGE_LIMIT = 100;

type SearchResponse = {
  entities?: PortEntity[];
  next?: string | null;
};

function normalizeNext(next: unknown): string | null {
  if (next == null || next === "") return null;
  return String(next);
}

async function parseError(response: Response): Promise<never> {
  const body = await response.text();
  throw new Error(`Port API ${response.status}:\n${body}`);
}

export async function searchBlueprintEntities(
  baseUrl: string,
  token: string,
  blueprint: BlueprintParam,
  page?: Page
): Promise<PortEntity[]> {
  if (DEV_MOCK) return MOCK_ENTITIES;

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

  const path = `/v1/blueprints/${encodeURIComponent(blueprint.identifier)}/entities/search`;
  const all: PortEntity[] = [];
  let from: string | undefined;

  for (; ;) {
    const body: Record<string, unknown> = {
      query: baseQuery,
      limit: PAGE_LIMIT,
      ...(from ? { from } : {}),
    };

    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) await parseError(res);

    const data = (await res.json()) as SearchResponse;
    all.push(...(data.entities ?? []));

    const next = normalizeNext(data.next);
    if (!next) break;
    from = next;
  }

  return all;
}
