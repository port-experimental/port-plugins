export function LoadingState() {
  return (
    <div className="loading-state" role="status" aria-label="Loading comments">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-comment">
          <div className="skeleton-avatar" />
          <div className="skeleton-body">
            <div className="skeleton-line skeleton-line--short" />
            <div className="skeleton-line" />
            <div className="skeleton-line skeleton-line--med" />
          </div>
        </div>
      ))}
    </div>
  );
}
