import React from 'react';

export function LoadingSkeleton() {
  return (
    <div className="dep-tree-skeleton">
      {[0, 1, 2, 3].map(i => (
        <div
          key={i}
          className="dep-tree-skeleton__node"
          style={{ left: `${(i % 2) * 260 + 40}px`, top: `${Math.floor(i / 2) * 110 + 40}px` }}
        />
      ))}
    </div>
  );
}
