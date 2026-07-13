import { useMemo, useState } from "react";
import { CommentItem } from "./CommentItem";
import { CommentComposer } from "./CommentComposer";
import { EmptyState } from "./EmptyState";
import type { Comment, PortUser } from "../types";

type StatusFilter = "all" | "open" | "resolved";

interface CommentThreadProps {
  comments: Comment[];
  /** Email of the currently logged-in user (from PLUGIN_DATA.user.email) */
  currentUserEmail: string;
  users: PortUser[];
  onAddComment: (body: string, mentions: string[]) => void;
  onReply: (parentId: string, body: string, mentions: string[]) => void;
  onEdit: (commentId: string, newBody: string) => void;
  onToggleStatus: (commentId: string, status: "open" | "resolved") => void;
  onDelete: (commentId: string) => void;
  isSubmitting?: boolean;
  isTogglingStatus?: boolean;
  isDeletingId?: string | null;
  isEditingId?: string | null;
}

export function CommentThread({
  comments,
  currentUserEmail,
  users,
  onAddComment,
  onReply,
  onEdit,
  onToggleStatus,
  onDelete,
  isSubmitting = false,
  isTogglingStatus = false,
  isDeletingId,
  isEditingId,
}: CommentThreadProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const topLevel = useMemo(
    () =>
      comments
        .filter((c) => !c.relations?.parentComment)
        .sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        ),
    [comments]
  );

  const repliesByParent = useMemo(() => {
    const map = new Map<string, Comment[]>();
    comments
      .filter((c) => !!c.relations?.parentComment)
      .sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      )
      .forEach((c) => {
        const parent = c.relations!.parentComment!;
        const list = map.get(parent) ?? [];
        list.push(c);
        map.set(parent, list);
      });
    return map;
  }, [comments]);

  const visibleThreads = useMemo(() => {
    if (filter === "all") return topLevel;
    return topLevel.filter((c) => c.properties.status === filter);
  }, [topLevel, filter]);

  const openCount = topLevel.filter(
    (c) => !c.properties.status || c.properties.status === "open"
  ).length;
  const resolvedCount = topLevel.filter(
    (c) => c.properties.status === "resolved"
  ).length;

  return (
    <div className="thread">
      {topLevel.length > 0 && (
        <div className="thread__toolbar">
          <div className="thread__counts">
            {openCount > 0 && (
              <span className="count-chip count-chip--open">{openCount} open</span>
            )}
            {resolvedCount > 0 && (
              <span className="count-chip count-chip--resolved">
                {resolvedCount} resolved
              </span>
            )}
          </div>

          <div className="thread__filter" role="group" aria-label="Filter threads">
            {(["all", "open", "resolved"] as StatusFilter[]).map((f) => (
              <button
                key={f}
                type="button"
                className={`filter-btn${filter === f ? " filter-btn--active" : ""}`}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="thread__list">
        {visibleThreads.length === 0 && topLevel.length === 0 ? (
          <EmptyState />
        ) : visibleThreads.length === 0 ? (
          <p className="muted" style={{ padding: "8px 0" }}>
            No {filter} threads.
          </p>
        ) : (
          visibleThreads.map((comment) => (
            <CommentItem
              key={comment.identifier}
              comment={comment}
              isTopLevel
              currentUserEmail={currentUserEmail}
              users={users}
              replies={repliesByParent.get(comment.identifier) ?? []}
              onReply={onReply}
              onEdit={onEdit}
              onToggleStatus={onToggleStatus}
              onDelete={onDelete}
              isTogglingStatus={isTogglingStatus}
              isDeletingId={isDeletingId}
              isEditingId={isEditingId}
            />
          ))
        )}
      </div>

      <div className="thread__composer">
        <CommentComposer
          users={users}
          onSubmit={onAddComment}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
