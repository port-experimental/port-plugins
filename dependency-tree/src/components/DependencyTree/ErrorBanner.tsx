import React from 'react';

interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="dep-tree-error">
      <span className="dep-tree-error__icon">⚠️</span>
      <span className="dep-tree-error__message">{message}</span>
      <button type="button" className="dep-tree-error__retry" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}
