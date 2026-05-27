import { mergePageFilters } from "@port-labs/plugins-sdk";
import { MOCK_ENTITIES } from "../dev/mockData";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import type { Page, PortEntity, Scorecard, EntityScorecardEvaluation } from "../types";
import { parsePortError } from "./portFetch";

const PAGE_LIMIT = 100;

type SearchResponse = {
  entities?: PortEntity[];
  next?: string | null;
};

function normalizeNext(next: unknown): string | null {
  if (next == null || next === "") return null;
  return String(next);
}

function mapEntityScorecards(
  entity: PortEntity,
  scorecards: Scorecard[]
): PortEntity {
  if (entity.scorecards && Object.keys(entity.scorecards).length > 0) {
    return entity;
  }

  const scorecardData: Record<string, EntityScorecardEvaluation> = {};
  const raw = entity as Record<string, unknown>;

  for (const sc of scorecards) {
    const value = raw[sc.identifier];
    if (value && typeof value === "object") {
      scorecardData[sc.identifier] = value as EntityScorecardEvaluation;
    }
  }

  if (Object.keys(scorecardData).length === 0) return entity;

  return { ...entity, scorecards: scorecardData };
}

function buildInclude(scorecards: Scorecard[]): string[] {
  const include = ["$identifier", "$title"];
  for (const sc of scorecards) {
    if (sc.identifier) include.push(sc.identifier);
  }
  return include;
}

export async function searchBlueprintEntities(
  baseUrl: string,
  token: string,
  blueprintIdentifier: string,
  scorecards: Scorecard[],
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
      page.pageFilters
    ) as Record<string, unknown>;
  }

  const path = `/v1/blueprints/${encodeURIComponent(blueprintIdentifier)}/entities/search`;
  const include = buildInclude(scorecards);
  const all: PortEntity[] = [];
  let from: string | undefined;

  for (;;) {
    const body: Record<string, unknown> = {
      query: baseQuery,
      limit: PAGE_LIMIT,
      include,
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

    if (!res.ok) await parsePortError(res);

    const data = (await res.json()) as SearchResponse;
    const batch = (data.entities ?? []).map((entity) =>
      mapEntityScorecards(entity, scorecards)
    );
    all.push(...batch);

    const next = normalizeNext(data.next);
    if (!next) break;
    from = next;
  }

  return all;
}
