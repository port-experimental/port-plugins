import React from 'react';
import { getRelationColor } from '../../utils/relationColors';

interface RelationFilterBarProps {
  relationTypes: string[];
  hiddenRelationTypes: Set<string>;
  onToggle: (relationType: string) => void;
}

export function RelationFilterBar({ relationTypes, hiddenRelationTypes, onToggle }: RelationFilterBarProps) {
  if (relationTypes.length === 0) return null;

  return (
    <div className="relation-filter-bar">
      <span className="relation-filter-bar__label">Relations:</span>
      {relationTypes.map(rt => {
        const isActive = !hiddenRelationTypes.has(rt);
        const color = getRelationColor(rt);
        return (
          <button
            key={rt}
            type="button"
            className={['relation-filter-chip', isActive ? 'relation-filter-chip--active' : 'relation-filter-chip--inactive'].join(' ')}
            onClick={() => onToggle(rt)}
            style={isActive ? { borderColor: color, color } : undefined}
            title={isActive ? `Hide "${rt}" relations` : `Show "${rt}" relations`}
          >
            <span
              className="relation-filter-chip__dot"
              style={{ background: isActive ? color : undefined }}
            />
            {rt}
          </button>
        );
      })}
    </div>
  );
}
