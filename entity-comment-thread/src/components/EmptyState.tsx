import { MessageSquare } from "lucide-react";

export function EmptyState() {
  return (
    <div className="empty-state">
      <MessageSquare size={32} className="empty-state__icon" aria-hidden />
      <p className="empty-state__title">No comments yet</p>
      <p className="empty-state__sub muted">Be the first to start a discussion on this entity.</p>
    </div>
  );
}
