import { DEV_MOCK } from "../hooks/usePostMessageData";
import type { RelatedToDirection } from "../types";
import { relationIdList } from "../utils/relationIdList";
import { MOCK_DOCS } from "../utils/mocks";
import {
  collectSharedRelationBridgeGroups,
  extractRelationTargets,
  fetchBlueprintJson,
  findRelationPathBetweenBlueprints,
} from "./fetchBlueprintSchema";
import { mapSearchEntity, type TechDocsPage } from "./fetchDocs";
import { fetchBlueprintEntity } from "./fetchEntity";
import { portFetch } from "./portFetch";

const RELATED_DOCS_PAGE_LIMIT = 200;

const ENTITIES_SEARCH_QUERY =
  "allow_partial_results=true&attach_title_to_relation=true&attach_identifier_to_title_mirror_properties=true&compact=true";

/**
 * Extract entity identifiers from Port entities search responses
 * (`entities`, nested blueprint buckets, etc.).
 */
function parseEntityIdentifiersFromSearchResponse(data: unknown): Set<string> {
  const out = new Set<string>();
  const addFromEntities = (arr: unknown) => {
    if (!Array.isArray(arr)) return;
    for (const e of arr) {
      if (e && typeof e === "object" && "identifier" in e) {
        const id = (e as { identifier: unknown }).identifier;
        if (typeof id === "string" && id.trim()) out.add(id.trim());
      } else if (typeof e === "string" && e.trim()) {
        out.add(e.trim());
      }
    }
  };
  if (!data || typeof data !== "object") return out;
  const root = data as Record<string, unknown>;
  addFromEntities(root.entities);
  addFromEntities(root.results);
  const bps =
    root.blueprints ?? root.matchingBlueprints ?? root.blueprintsThatHasEntities;
  if (Array.isArray(bps)) {
    for (const bp of bps) {
      if (bp && typeof bp === "object") {
        const bo = bp as Record<string, unknown>;
        addFromEntities(bo.entities);
        addFromEntities(bo.entityIds);
        addFromEntities(bo.entity_identifiers);
      }
    }
  }
  return out;
}

export type RelatedTechDocSearchParams = {
  hostEntityIdentifier: string;
  hostBlueprint: string;
  techDocBlueprint: string;
  repositoryBlueprint: string;
  direction: RelatedToDirection;
};

type SearchRule = Record<string, unknown>;

async function searchBridgeEntityIdsForHost(
  baseUrl: string,
  token: string,
  hostBlueprint: string,
  hostIdentifier: string,
  bridgeBlueprint: string,
  direction: RelatedToDirection
): Promise<string[]> {
  const path = `/v1/entities/search?${ENTITIES_SEARCH_QUERY}`;
  const response = await portFetch(baseUrl, token, path, {
    method: "POST",
    body: JSON.stringify({
      combinator: "and",
      rules: [
        { operator: "=", property: "$blueprint", value: bridgeBlueprint },
        {
          operator: "relatedTo",
          value: hostIdentifier,
          blueprint: hostBlueprint,
          direction,
        },
      ],
    }),
  });
  const data = await response.json();
  return [...parseEntityIdentifiersFromSearchResponse(data)];
}

function matchAnyRule(path: string[], value: string): SearchRule {
  return {
    property: { path },
    operator: "matchAny",
    value,
  };
}

/**
 * Build search rules: shared bridge (service↔repo←techdoc), direct techDoc→host path, or relatedTo.
 */
async function buildTechDocRelatedSearchRules(
  baseUrl: string,
  token: string,
  params: RelatedTechDocSearchParams
): Promise<SearchRule[]> {
  const { hostEntityIdentifier, hostBlueprint, techDocBlueprint, direction } =
    params;

  const blueprintRule: SearchRule = {
    operator: "=",
    property: "$blueprint",
    value: techDocBlueprint,
  };

  if (hostBlueprint.trim().toLowerCase() === techDocBlueprint.trim().toLowerCase()) {
    return [
      {
        operator: "relatedTo",
        value: hostEntityIdentifier,
        direction,
        blueprint: hostBlueprint,
      },
      blueprintRule,
    ];
  }

  const [techPayload, hostPayload] = await Promise.all([
    fetchBlueprintJson(baseUrl, token, techDocBlueprint),
    fetchBlueprintJson(baseUrl, token, hostBlueprint),
  ]);

  const sharedGroups = collectSharedRelationBridgeGroups(
    extractRelationTargets(techPayload),
    extractRelationTargets(hostPayload)
  );

  const hostEntity = await fetchBlueprintEntity(
    baseUrl,
    token,
    hostBlueprint,
    hostEntityIdentifier
  );
  const hostRels = hostEntity.relations ?? {};

  const matchAnyRules: SearchRule[] = [];
  const seenPair = new Set<string>();

  for (const group of sharedGroups) {
    const anchorIds = new Set<string>();
    const targetLower = group.targetBlueprint.trim().toLowerCase();
    const hostBpLower = hostBlueprint.trim().toLowerCase();

    if (hostBpLower === targetLower) {
      anchorIds.add(hostEntityIdentifier);
    }

    for (const hostRelId of group.hostRelationIds) {
      for (const id of relationIdList(hostRels[hostRelId])) {
        anchorIds.add(id);
      }
    }

    const upDown = await Promise.all([
      searchBridgeEntityIdsForHost(
        baseUrl,
        token,
        hostBlueprint,
        hostEntityIdentifier,
        group.targetBlueprint,
        "upstream"
      ),
      searchBridgeEntityIdsForHost(
        baseUrl,
        token,
        hostBlueprint,
        hostEntityIdentifier,
        group.targetBlueprint,
        "downstream"
      ),
    ]);
    for (const id of [...upDown[0], ...upDown[1]]) anchorIds.add(id);

    for (const anchorId of anchorIds) {
      for (const techRelId of group.techDocRelationIds) {
        const key = `${techRelId}\0${anchorId}`;
        if (seenPair.has(key)) continue;
        seenPair.add(key);
        matchAnyRules.push(matchAnyRule([techRelId], anchorId));
      }
    }
  }

  if (matchAnyRules.length > 0) {
    if (matchAnyRules.length === 1) {
      return [matchAnyRules[0], blueprintRule];
    }
    return [
      {
        combinator: "or",
        rules: matchAnyRules,
      },
      blueprintRule,
    ];
  }

  const directPath = await findRelationPathBetweenBlueprints(
    baseUrl,
    token,
    techDocBlueprint,
    hostBlueprint,
    { maxHops: 8 }
  );

  if (directPath && directPath.length > 0) {
    return [matchAnyRule(directPath, hostEntityIdentifier), blueprintRule];
  }

  return [
    {
      operator: "relatedTo",
      value: hostEntityIdentifier,
      direction,
      blueprint: hostBlueprint,
    },
    blueprintRule,
  ];
}

function rulesCacheKey(
  baseUrl: string,
  params: RelatedTechDocSearchParams
): string {
  return [
    baseUrl,
    params.techDocBlueprint,
    params.hostBlueprint,
    params.hostEntityIdentifier,
    params.direction,
  ].join("|");
}

const rulesCache = new Map<string, Promise<SearchRule[]>>();

async function getRelatedSearchRules(
  baseUrl: string,
  token: string,
  params: RelatedTechDocSearchParams
): Promise<SearchRule[]> {
  const key = rulesCacheKey(baseUrl, params);
  const cached = rulesCache.get(key);
  if (cached) return cached;
  const pending = buildTechDocRelatedSearchRules(baseUrl, token, params).then(
    (allRules) =>
      allRules.filter(
        (rule) => (rule as { property?: unknown }).property !== "$blueprint"
      )
  );
  pending.catch(() => rulesCache.delete(key));
  rulesCache.set(key, pending);
  return pending;
}

export async function fetchTechDocsRelatedToEntityPage(
  baseUrl: string,
  token: string,
  params: RelatedTechDocSearchParams,
  from?: string | null
): Promise<TechDocsPage> {
  if (DEV_MOCK) {
    const host = await fetchBlueprintEntity(
      baseUrl,
      token,
      params.hostBlueprint,
      params.hostEntityIdentifier
    );
    const anchors = new Set<string>();
    const rels = host.relations ?? {};
    for (const id of Object.values(rels)) {
      for (const x of relationIdList(id)) anchors.add(x);
    }
    if (anchors.size === 0) anchors.add("Node");
    const matched = MOCK_DOCS.filter((d) => {
      const dr = d.relations as Record<string, unknown>;
      for (const x of Object.values(dr)) {
        for (const rid of relationIdList(x)) {
          if (anchors.has(rid)) return true;
        }
      }
      return false;
    });
    const docs = matched.length > 0 ? matched : MOCK_DOCS;
    const PAGE_SIZE = 2;
    const pageIndex =
      from == null || from === ""
        ? 0
        : Math.max(0, parseInt(from, 10) || 0);
    const start = pageIndex * PAGE_SIZE;
    const slice = docs.slice(start, start + PAGE_SIZE);
    const more = start + PAGE_SIZE < docs.length;
    return { entities: slice, next: more ? String(pageIndex + 1) : null };
  }

  const rules = await getRelatedSearchRules(baseUrl, token, params);

  const searchPath = `/v1/blueprints/${encodeURIComponent(params.techDocBlueprint)}/entities/search`;
  const body: Record<string, unknown> = {
    query: { combinator: "and", rules },
    limit: RELATED_DOCS_PAGE_LIMIT,
    ...(from && from.trim() ? { from: from.trim() } : {}),
  };

  const response = await portFetch(baseUrl, token, searchPath, {
    method: "POST",
    body: JSON.stringify(body),
  });

  const data = await response.json();
  const raw = Array.isArray(data?.entities)
    ? (data.entities as Record<string, unknown>[])
    : [];
  const next =
    typeof data?.next === "string" && data.next.trim()
      ? data.next.trim()
      : null;
  return {
    entities: raw.map((e) => mapSearchEntity(e, params.repositoryBlueprint)),
    next,
  };
}
