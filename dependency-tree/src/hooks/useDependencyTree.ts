import { useState, useEffect, useRef, useCallback } from 'react';
import type { Node, Edge } from '@xyflow/react';
import { collectRelationEdges } from '../utils/collectRelationEdges';
import { getRelationColor } from '../utils/relationColors';
import { applyDagreLayout, NODE_WIDTH, NODE_HEIGHT } from '../utils/dagreLayout';
import type { Entity } from '../types';

export interface DependencyTreeResult {
  nodes: Node[];
  edges: Edge[];
  /** All unique relation type names found in the tree */
  relationTypes: string[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export interface RawEdge {
  sourceId: string;
  targetId: string;
  relationKey: string;
  isCycle: boolean;
  isUpstream: boolean;
}

export interface RawNode {
  entity: Entity;
  depth: number;
  isRoot: boolean;
  isCycle: boolean;
  /** True if at maxDepth and entity has unfetched relations */
  hasMoreRelations: boolean;
  moreRelationsCount: number;
}

async function fetchEntitiesByIds(
  token: string,
  portApiBaseUrl: string,
  ids: string[],
  signal?: AbortSignal,
): Promise<Entity[]> {
  if (ids.length === 0) return [];

  const body = {
    combinator: 'or',
    rules: ids.map(id => ({ property: '$identifier', operator: '=', value: id })),
  };

  const base = portApiBaseUrl.replace(/\/$/, '');
  const url = new URL(`${base}/v1/entities/search`);
  url.searchParams.set('exclude_calculated_properties', 'false');

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`Entities fetch failed: ${res.status}`);
  const json = await res.json();
  // Port returns { ok: true, entities: [...] }
  return (json.entities ?? []) as Entity[];
}

export async function bfsFetch(
  token: string,
  portApiBaseUrl: string,
  rootEntity: Entity,
  maxDepth: number,
  onLevel: (nodes: RawNode[], edges: RawEdge[]) => void,
  signal?: AbortSignal,
): Promise<void> {
  const rootNode: RawNode = {
    entity: rootEntity,
    depth: 0,
    isRoot: true,
    isCycle: false,
    hasMoreRelations: false,
    moreRelationsCount: 0,
  };
  onLevel([rootNode], []);

  const visitedIds = new Set<string>([rootEntity.identifier]);
  let currentLevel: Entity[] = [rootEntity];

  for (let depth = 1; depth <= maxDepth; depth++) {
    const candidateEdges: Array<{ sourceId: string; targetId: string; relationKey: string }> = [];
    for (const entity of currentLevel) {
      candidateEdges.push(...collectRelationEdges(entity.identifier, entity.relations));
    }

    const levelEdges: RawEdge[] = [];

    for (const e of candidateEdges) {
      if (visitedIds.has(e.targetId)) {
        levelEdges.push({ ...e, isCycle: true, isUpstream: false });
      }
    }

    const unvisitedTargetIds = [
      ...new Set(
        candidateEdges
          .filter(e => !visitedIds.has(e.targetId))
          .map(e => e.targetId),
      ),
    ];

    if (unvisitedTargetIds.length === 0) {
      if (levelEdges.length > 0) onLevel([], levelEdges);
      break;
    }

    const fetched = await fetchEntitiesByIds(token, portApiBaseUrl, unvisitedTargetIds, signal);
    const fetchedMap = new Map(fetched.map(e => [e.identifier, e]));

    const levelNodes: RawNode[] = [];
    const nextLevel: Entity[] = [];

    for (const e of candidateEdges.filter(ce => !visitedIds.has(ce.targetId))) {
      if (visitedIds.has(e.targetId)) continue;
      const targetEntity = fetchedMap.get(e.targetId);
      if (!targetEntity) continue;

      visitedIds.add(e.targetId);

      const targetRelationEdges = collectRelationEdges(targetEntity.identifier, targetEntity.relations);
      const hasMoreRelations = depth === maxDepth && targetRelationEdges.length > 0;
      const moreRelationsCount = hasMoreRelations ? targetRelationEdges.length : 0;

      levelNodes.push({ entity: targetEntity, depth, isRoot: false, isCycle: false, hasMoreRelations, moreRelationsCount });
      levelEdges.push({ sourceId: e.sourceId, targetId: e.targetId, relationKey: e.relationKey, isCycle: false, isUpstream: false });
      nextLevel.push(targetEntity);
    }

    if (levelNodes.length > 0 || levelEdges.length > 0) {
      onLevel(levelNodes, levelEdges);
    }

    currentLevel = nextLevel;
    if (currentLevel.length === 0) break;
  }
}

async function fetchBlueprintIds(
  token: string,
  portApiBaseUrl: string,
  signal?: AbortSignal,
): Promise<string[]> {
  const base = portApiBaseUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/v1/blueprints`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    signal,
  });
  if (!res.ok) throw new Error(`Blueprints fetch failed: ${res.status}`);
  const json = await res.json();
  return ((json.blueprints ?? []) as Array<{ identifier: string }>).map(b => b.identifier);
}

async function fetchUpstreamEntitiesByIds(
  token: string,
  portApiBaseUrl: string,
  ids: string[],
  blueprintIds: string[],
  signal?: AbortSignal,
): Promise<Entity[]> {
  if (ids.length === 0 || blueprintIds.length === 0) return [];

  // Port's relatedTo operator requires a blueprint field and matches entities that
  // have a relation pointing to any of the given entity identifiers.
  const body = {
    combinator: 'or',
    rules: blueprintIds.flatMap(blueprint =>
      ids.map(id => ({ operator: 'relatedTo', blueprint, value: id })),
    ),
  };

  const base = portApiBaseUrl.replace(/\/$/, '');
  const url = new URL(`${base}/v1/entities/search`);
  url.searchParams.set('exclude_calculated_properties', 'false');

  const res = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal,
  });
  if (!res.ok) throw new Error(`Upstream entities fetch failed: ${res.status}`);
  const json = await res.json();
  return (json.entities ?? []) as Entity[];
}

export async function upstreamBfsFetch(
  token: string,
  portApiBaseUrl: string,
  rootEntity: Entity,
  maxDepth: number,
  onLevel: (nodes: RawNode[], edges: RawEdge[]) => void,
  showRuleResults: boolean,
  signal?: AbortSignal,
): Promise<void> {
  const blueprintIds = await fetchBlueprintIds(token, portApiBaseUrl, signal);
  if (blueprintIds.length === 0) return;

  const visitedIds = new Set<string>([rootEntity.identifier]);
  let currentLevelIds = new Set<string>([rootEntity.identifier]);

  for (let depth = 1; depth <= maxDepth; depth++) {
    const fetched = await fetchUpstreamEntitiesByIds(token, portApiBaseUrl, [...currentLevelIds], blueprintIds, signal);
    if (fetched.length === 0) break;

    // Filter out _rule_result blueprint entities unless the caller wants them
    const toProcess = showRuleResults
      ? fetched
      : fetched.filter(e => !e.blueprint?.includes('_rule_result'));

    const levelNodes: RawNode[] = [];
    const levelEdges: RawEdge[] = [];
    const nextLevelIds = new Set<string>();

    for (const upstreamEntity of toProcess) {
      const allEdges = collectRelationEdges(upstreamEntity.identifier, upstreamEntity.relations);
      const pointingEdges = allEdges.filter(e => currentLevelIds.has(e.targetId));

      if (pointingEdges.length === 0) continue;

      for (const edge of pointingEdges) {
        if (visitedIds.has(upstreamEntity.identifier)) {
          levelEdges.push({
            sourceId: upstreamEntity.identifier,
            targetId: edge.targetId,
            relationKey: edge.relationKey,
            isCycle: true,
            isUpstream: true,
          });
        } else {
          if (!nextLevelIds.has(upstreamEntity.identifier)) {
            levelNodes.push({
              entity: upstreamEntity,
              depth,
              isRoot: false,
              isCycle: false,
              hasMoreRelations: false,
              moreRelationsCount: 0,
            });
            nextLevelIds.add(upstreamEntity.identifier);
            visitedIds.add(upstreamEntity.identifier);
          }
          levelEdges.push({
            sourceId: upstreamEntity.identifier,
            targetId: edge.targetId,
            relationKey: edge.relationKey,
            isCycle: false,
            isUpstream: true,
          });
        }
      }
    }

    if (levelNodes.length > 0 || levelEdges.length > 0) {
      onLevel(levelNodes, levelEdges);
    }

    currentLevelIds = nextLevelIds;
    if (currentLevelIds.size === 0) break;
  }
}

function toFlowNodes(rawNodes: RawNode[], badge1Property?: string, badge2Property?: string): Node[] {
  return rawNodes.map(n => ({
    id: n.entity.identifier,
    type: 'entityNode',
    position: { x: 0, y: 0 }, // overwritten by dagre
    data: {
      entity: n.entity,
      isRoot: n.isRoot,
      isCycle: n.isCycle,
      hasMoreRelations: n.hasMoreRelations,
      moreRelationsCount: n.moreRelationsCount,
      badge1Property,
      badge2Property,
    },
    style: { width: NODE_WIDTH },
  }));
}

export function toFlowEdges(rawEdges: RawEdge[]): Edge[] {
  return rawEdges.map(e => ({
    id: `${e.sourceId}--${e.relationKey}--${e.targetId}${e.isUpstream ? '--up' : ''}`,
    source: e.sourceId,
    target: e.targetId,
    label: e.relationKey,
    animated: false,
    style: {
      stroke: getRelationColor(e.relationKey),
      strokeWidth: 1.5,
      ...(e.isUpstream ? { strokeDasharray: '6 3' } : {}),
    },
    labelStyle: { fill: 'var(--text-medium, #6b87b8)', fontSize: 10 },
    labelBgStyle: { fill: 'var(--background-primary, #0f1117)', fillOpacity: 0.85 },
    data: { relationKey: e.relationKey, isCycle: e.isCycle, isUpstream: e.isUpstream },
    type: 'smoothstep',
  }));
}

export function useDependencyTree(
  rootEntity: Entity | undefined,
  portToken: string | null,
  portApiBaseUrl: string | null,
  maxDepth: number,
  showUpstream: boolean,
  showRuleResults: boolean,
  badge1Property?: string,
  badge2Property?: string,
): DependencyTreeResult {
  const [result, setResult] = useState<{
    nodes: Node[];
    edges: Edge[];
    relationTypes: string[];
  }>({ nodes: [], edges: [], relationTypes: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [fetchKey, setFetchKey] = useState(0);

  const accRef = useRef<{
    nodes: RawNode[];
    edges: RawEdge[];
    cycleIds: Set<string>;
  }>({ nodes: [], edges: [], cycleIds: new Set() });

  useEffect(() => {
    if (!rootEntity || !portToken || !portApiBaseUrl) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();
    accRef.current = { nodes: [], edges: [], cycleIds: new Set() };
    setResult({ nodes: [], edges: [], relationTypes: [] });
    setIsLoading(true);
    setError(null);

    const onLevel = (newNodes: RawNode[], newEdges: RawEdge[]) => {
      if (cancelled) return;

      // Track which node IDs are targets of cycle edges.
      // isCycle on a node means "this node is the target of a back-edge".
      for (const e of newEdges) {
        if (e.isCycle) accRef.current.cycleIds.add(e.targetId);
      }

      // Deduplicate nodes by identifier
      const existingIds = new Set(accRef.current.nodes.map(n => n.entity.identifier));
      const uniqueNewNodes = newNodes.filter(n => !existingIds.has(n.entity.identifier));

      accRef.current = {
        nodes: [...accRef.current.nodes, ...uniqueNewNodes],
        // Edge deduplication is intentionally omitted: bfsFetch (isUpstream: false) and
        // upstreamBfsFetch (isUpstream: true) produce structurally distinct edge IDs,
        // and each BFS function's own visitedIds prevents internal duplicates.
        edges: [...accRef.current.edges, ...newEdges],
        cycleIds: accRef.current.cycleIds,
      };

      // Apply cycle flag to any node whose ID is in cycleIds
      const markedNodes = accRef.current.nodes.map(n =>
        accRef.current.cycleIds.has(n.entity.identifier) ? { ...n, isCycle: true } : n,
      );

      const flowNodes = toFlowNodes(markedNodes, badge1Property, badge2Property);
      const flowEdges = toFlowEdges(accRef.current.edges);
      const positioned = applyDagreLayout(flowNodes, flowEdges);
      const relationTypes = [...new Set(accRef.current.edges.map(e => e.relationKey))];
      setResult({ nodes: positioned, edges: flowEdges, relationTypes });
    };

    // Both BFS traversals are launched in parallel. Their onLevel callbacks interleave at
    // await boundaries, but JS is single-threaded so each callback runs to completion
    // before the next is processed — the accRef read-modify-write sequence is safe.
    const runs: Promise<void>[] = [
      bfsFetch(portToken, portApiBaseUrl, rootEntity, maxDepth, onLevel, controller.signal),
    ];
    if (showUpstream) {
      runs.push(upstreamBfsFetch(portToken, portApiBaseUrl, rootEntity, maxDepth, onLevel, showRuleResults, controller.signal));
    }

    Promise.all(runs)
      .then(() => { if (!cancelled) setIsLoading(false); })
      .catch((err: unknown) => {
        if (!cancelled) {
          // AbortError means the effect cleaned up — not a real error
          if (err instanceof Error && err.name === 'AbortError') return;
          setError(err instanceof Error ? err : new Error(String(err)));
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [rootEntity?.identifier, portToken, portApiBaseUrl, maxDepth, showUpstream, showRuleResults, badge1Property, badge2Property, fetchKey]);

  const refetch = useCallback(() => setFetchKey(k => k + 1), []);

  return {
    nodes: result.nodes,
    edges: result.edges,
    relationTypes: result.relationTypes,
    isLoading,
    error,
    refetch,
  };
}
