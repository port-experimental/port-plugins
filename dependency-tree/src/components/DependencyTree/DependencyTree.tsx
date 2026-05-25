import React, { useCallback, useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, BackgroundVariant } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import './DependencyTree.css';

import { usePortPluginData } from '@port-labs/plugins-sdk/react';
import type { Entity, Params } from '../../types';
import { useDependencyTree } from '../../hooks/useDependencyTree';
import { buildPortEntityUrl } from '../../utils/portEntityUrl';
import { EntityNode } from './EntityNode';
import type { EntityNodeData } from './EntityNode';
import type { Node } from '@xyflow/react';
import { RelationFilterBar } from './RelationFilterBar';
import { EmptyState } from './EmptyState';
import { ErrorBanner } from './ErrorBanner';
import { LoadingSkeleton } from './LoadingSkeleton';

const NODE_TYPES = { entityNode: EntityNode };

export function DependencyTree() {
  const { entity: rawEntity, portToken, portApiBaseUrl, params } = usePortPluginData();
  const entity = rawEntity as Entity | undefined;
  const typedParams = params as Params;

  const maxDepth = typeof typedParams?.maxDepth?.value === 'number' ? typedParams.maxDepth.value : 3;
  const badge1Property = typeof typedParams?.badge1Property?.value === 'string' ? typedParams.badge1Property.value : undefined;
  const badge2Property = typeof typedParams?.badge2Property?.value === 'string' ? typedParams.badge2Property.value : undefined;
  // Param sets the initial default; UI toggle overrides it at runtime
  const defaultShowUpstream = typedParams?.showUpstream?.value !== false;
  // showRuleResults defaults to false — _rule_result entities clutter the tree
  const showRuleResults = typedParams?.showRuleResults?.value === true;

  const [showUpstream, setShowUpstream] = useState<boolean>(() => {
    const stored = localStorage.getItem('dep-tree:showUpstream');
    return stored !== null ? stored !== 'false' : defaultShowUpstream;
  });

  const [hiddenRelationTypes, setHiddenRelationTypes] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('dep-tree:hiddenRelations');
      return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
    } catch {
      return new Set();
    }
  });

  const toggleUpstream = useCallback(() => {
    setShowUpstream(v => {
      const next = !v;
      localStorage.setItem('dep-tree:showUpstream', String(next));
      return next;
    });
  }, []);

  const toggleRelationType = useCallback((rt: string) => {
    setHiddenRelationTypes(prev => {
      const next = new Set(prev);
      if (next.has(rt)) next.delete(rt); else next.add(rt);
      localStorage.setItem('dep-tree:hiddenRelations', JSON.stringify([...next]));
      return next;
    });
  }, []);

  const { nodes: allNodes, edges: allEdges, relationTypes, isLoading, error, refetch } =
    useDependencyTree(entity, portToken, portApiBaseUrl, maxDepth, showUpstream, showRuleResults, badge1Property, badge2Property);

  type EntityFlowNode = Node<EntityNodeData>;

  // Inject portAppUrl into each node's data
  const nodesWithUrl = useMemo(() =>
    (allNodes as EntityFlowNode[]).map(n => ({
      ...n,
      data: {
        ...n.data,
        portAppUrl: buildPortEntityUrl(portApiBaseUrl, n.data.entity?.blueprint ?? '', n.id),
      },
    })),
    [allNodes, portApiBaseUrl],
  );

  // Filter by hidden relation types
  const visibleEdges = useMemo(
    () => allEdges.filter(e => !hiddenRelationTypes.has((e.data as any)?.relationKey)),
    [allEdges, hiddenRelationTypes],
  );
  const visibleTargetIds = useMemo(
    () => new Set(visibleEdges.flatMap(e => [e.source, e.target])),
    [visibleEdges],
  );
  const visibleNodes = useMemo(
    () => (nodesWithUrl as EntityFlowNode[]).filter(n => n.data.isRoot || visibleTargetIds.has(n.id)),
    [nodesWithUrl, visibleTargetIds],
  );

  // ── Setup prompt ──────────────────────────────────────────
  if (!entity || !portToken) {
    return (
      <div className="dep-tree-widget">
        <div className="dep-tree-setup">
          <div className="dep-tree-setup__icon">🌲</div>
          <div className="dep-tree-setup__text">Open this widget from an entity page</div>
        </div>
      </div>
    );
  }

  const hasRelations = allNodes.length > 1;

  return (
    <div className="dep-tree-widget">
      {/* Header */}
      <div className="dep-tree-header">
        <div>
          <div className="dep-tree-header__title">
            🌲 Dependency Tree
          </div>
          <div className="dep-tree-header__subtitle">
            {entity.title || entity.identifier} · depth {maxDepth}
          </div>
        </div>
        <div className="dep-tree-header__controls">
          <button
            className={`dep-tree-toggle${showUpstream ? ' dep-tree-toggle--active' : ''}`}
            onClick={toggleUpstream}
            title={showUpstream ? 'Hide upstream dependencies' : 'Show upstream dependencies'}
          >
            ↑ Upstream
          </button>
          {isLoading && <span className="dep-tree-header__loading">Loading…</span>}
        </div>
      </div>

      {/* Error banner */}
      {error && <ErrorBanner message={error.message} onRetry={refetch} />}

      {/* Relation filter bar — only shown when tree has data */}
      {!isLoading && !error && hasRelations && (
        <RelationFilterBar
          relationTypes={relationTypes}
          hiddenRelationTypes={hiddenRelationTypes}
          onToggle={toggleRelationType}
        />
      )}

      {/* Canvas area */}
      {isLoading && !hasRelations ? (
        <LoadingSkeleton />
      ) : !isLoading && !error && !hasRelations ? (
        <EmptyState />
      ) : error && !hasRelations ? (
        null
      ) : (
        <div className="dep-tree-canvas">
          <ReactFlow
            nodes={visibleNodes}
            edges={visibleEdges}
            nodeTypes={NODE_TYPES}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={28} size={1} />
            <Controls />
          </ReactFlow>
          <div className="dep-tree-depth-badge">Depth: {maxDepth}</div>
        </div>
      )}
    </div>
  );
}
