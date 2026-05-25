type EmptyStateProps = {
  blueprintTitle: string;
  hasEntities: boolean;
};

export function EmptyState({ blueprintTitle, hasEntities }: EmptyStateProps) {
  if (!hasEntities) {
    return (
      <p className="status muted-inline">
        No entities found for <strong>{blueprintTitle}</strong>.
      </p>
    );
  }

  return (
    <p className="status muted-inline">
      No scorecards are defined for <strong>{blueprintTitle}</strong>. Create
      scorecards in Port to see compliance bars here.
    </p>
  );
}
