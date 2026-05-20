import { DEV_MOCK } from "../hooks/usePostMessageData";
import { portFetch } from "./portFetch";

function pickBlueprintRecord(data: unknown): Record<string, unknown> | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;
  const bp = root.blueprint ?? root;
  if (!bp || typeof bp !== "object") return null;
  return bp as Record<string, unknown>;
}

/** Relation ids on a blueprint and their target blueprint identifiers. */
export function extractRelationTargets(
  blueprintPayload: unknown
): { relationId: string; targetBlueprint: string }[] {
  const bp = pickBlueprintRecord(blueprintPayload);
  if (!bp) return [];
  const rels = bp.relations;
  if (!rels || typeof rels !== "object") return [];
  const out: { relationId: string; targetBlueprint: string }[] = [];
  for (const [relId, def] of Object.entries(rels as Record<string, unknown>)) {
    if (!def || typeof def !== "object") continue;
    const t = (def as { target?: unknown }).target;
    if (typeof t === "string" && t.trim()) {
      out.push({ relationId: relId, targetBlueprint: t.trim() });
    }
  }
  out.sort((a, b) => a.relationId.localeCompare(b.relationId));
  return out;
}

/**
 * Target blueprints that appear on both tech-doc and host blueprints, with relation field names.
 * Used to find shared "bridge" entities (e.g. both link to the same githubRepository).
 */
export function collectSharedRelationBridgeGroups(
  techDocEdges: { relationId: string; targetBlueprint: string }[],
  hostEdges: { relationId: string; targetBlueprint: string }[]
): {
  targetBlueprint: string;
  techDocRelationIds: string[];
  hostRelationIds: string[];
}[] {
  const techByTarget = new Map<
    string,
    { canonical: string; relationIds: Set<string> }
  >();
  for (const { relationId, targetBlueprint } of techDocEdges) {
    const k = targetBlueprint.trim().toLowerCase();
    if (!techByTarget.has(k)) {
      techByTarget.set(k, {
        canonical: targetBlueprint.trim(),
        relationIds: new Set(),
      });
    }
    techByTarget.get(k)!.relationIds.add(relationId);
  }

  const hostByTarget = new Map<string, Set<string>>();
  for (const { relationId, targetBlueprint } of hostEdges) {
    const k = targetBlueprint.trim().toLowerCase();
    if (!hostByTarget.has(k)) hostByTarget.set(k, new Set());
    hostByTarget.get(k)!.add(relationId);
  }

  const out: {
    targetBlueprint: string;
    techDocRelationIds: string[];
    hostRelationIds: string[];
  }[] = [];

  for (const [k, { canonical, relationIds: techRels }] of techByTarget) {
    const hostRels = hostByTarget.get(k);
    if (!hostRels?.size) continue;
    out.push({
      targetBlueprint: canonical,
      techDocRelationIds: [...techRels].sort(),
      hostRelationIds: [...hostRels].sort(),
    });
  }

  out.sort((a, b) => a.targetBlueprint.localeCompare(b.targetBlueprint));
  return out;
}

export async function fetchBlueprintJson(
  baseUrl: string,
  token: string,
  blueprintIdentifier: string
): Promise<unknown> {
  const path = `/v1/blueprints/${encodeURIComponent(blueprintIdentifier)}`;
  const response = await portFetch(baseUrl, token, path, { method: "GET" });
  return response.json();
}

/**
 * Shortest chain of relation field ids from `sourceBlueprint` to `targetBlueprint`
 * by walking Port blueprint relation targets (GET /v1/blueprints).
 * Returns ids for Port `matchAny` `property.path`; null if no path within `maxHops` or same blueprint.
 */
export async function findRelationPathBetweenBlueprints(
  baseUrl: string,
  token: string,
  sourceBlueprint: string,
  targetBlueprint: string,
  options?: { maxHops?: number }
): Promise<string[] | null> {
  const maxHops = options?.maxHops ?? 8;
  const goal = targetBlueprint.trim().toLowerCase();
  const start = sourceBlueprint.trim();
  if (!start || !targetBlueprint.trim()) return null;
  if (start.toLowerCase() === goal) return null;

  if (DEV_MOCK) {
    if (start.toLowerCase() === "techdoc" && goal === "githubrepository") {
      return ["repository"];
    }
    return null;
  }

  type Item = { blueprintId: string; path: string[] };
  const queue: Item[] = [{ blueprintId: start, path: [] }];
  const expanded = new Set<string>();
  const cache = new Map<
    string,
    { relationId: string; targetBlueprint: string }[]
  >();

  async function edgesFor(bpId: string) {
    if (!cache.has(bpId)) {
      const json = await fetchBlueprintJson(baseUrl, token, bpId);
      cache.set(bpId, extractRelationTargets(json));
    }
    return cache.get(bpId)!;
  }

  while (queue.length > 0) {
    const { blueprintId, path } = queue.shift()!;
    if (path.length >= maxHops) continue;
    if (expanded.has(blueprintId)) continue;
    expanded.add(blueprintId);

    const edges = await edgesFor(blueprintId);
    for (const { relationId, targetBlueprint: tgt } of edges) {
      const nextPath = [...path, relationId];
      if (tgt.trim().toLowerCase() === goal) {
        return nextPath;
      }
      queue.push({ blueprintId: tgt, path: nextPath });
    }
  }

  return null;
}
