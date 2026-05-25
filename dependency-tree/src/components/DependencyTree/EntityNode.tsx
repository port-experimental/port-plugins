import React from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { Entity } from '../../types';

export interface EntityNodeData {
  entity: Entity;
  isRoot: boolean;
  isCycle: boolean;
  hasMoreRelations: boolean;
  moreRelationsCount: number;
  badge1Property?: string;
  badge2Property?: string;
  portAppUrl?: string;
  [key: string]: unknown;
}

export function EntityNode({ data }: NodeProps) {
  const d = data as EntityNodeData;
  const { entity, isRoot, isCycle, hasMoreRelations, moreRelationsCount, badge1Property, badge2Property, portAppUrl } = d;

  const badge1Value = badge1Property ? entity.properties[badge1Property] : undefined;
  const badge2Value = badge2Property ? entity.properties[badge2Property] : undefined;

  function handleClick() {
    if (portAppUrl) window.open(portAppUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div
      className={[
        'entity-node',
        isRoot ? 'entity-node--root' : '',
        isCycle ? 'entity-node--cycle' : '',
      ].filter(Boolean).join(' ')}
      onClick={handleClick}
      title={entity.identifier}
    >
      <Handle type="target" position={Position.Left} className="entity-node__handle" />

      <div className="entity-node__header">
        {entity.icon && <span className="entity-node__icon">{entity.icon}</span>}
        <div className="entity-node__title-group">
          <div className="entity-node__title">{entity.title || entity.identifier}</div>
          <div className="entity-node__blueprint">{entity.blueprint ?? ''}</div>
        </div>
      </div>

      {(badge1Value != null || badge2Value != null || isCycle) && (
        <div className="entity-node__badges">
          {isCycle && <span className="entity-node__badge entity-node__badge--cycle">↩ cycle</span>}
          {badge1Value != null && (
            <span className="entity-node__badge">{String(badge1Value)}</span>
          )}
          {badge2Value != null && (
            <span className="entity-node__badge entity-node__badge--secondary">{String(badge2Value)}</span>
          )}
        </div>
      )}

      {hasMoreRelations && (
        <div className="entity-node__more">+{moreRelationsCount} more</div>
      )}

      <Handle type="source" position={Position.Right} className="entity-node__handle" />
    </div>
  );
}
