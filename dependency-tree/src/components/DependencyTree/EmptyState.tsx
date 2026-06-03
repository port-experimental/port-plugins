import React from 'react';

export function EmptyState() {
  return (
    <div className="dep-tree-empty">
      <div className="dep-tree-empty__icon" aria-hidden="true">&#x25CB;</div>
      <div className="dep-tree-empty__title">No relations found</div>
      <div className="dep-tree-empty__subtitle">
        This entity has no relations defined. Add relations in Port to see the dependency tree.
      </div>
    </div>
  );
}
