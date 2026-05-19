import { useState } from "react";
import type { CommentThread as Thread } from "../types";
import { CommentEditor } from "./CommentEditor";
import { CommentItem } from "./CommentItem";

type Props = {
  thread: Thread;
  portApiBaseUrl: string;
  portToken: string;
  currentUserEmail: string;
  onPostReply: (
    parentCommentId: string,
    body: string,
    mentions: string[]
  ) => Promise<void>;
  onToggleStatus: (rootId: string, status: "open" | "resolved") => Promise<void>;
};

export function CommentThreadBlock({
  thread,
  portApiBaseUrl,
  portToken,
  currentUserEmail,
  onPostReply,
  onToggleStatus,
}: Props) {
  const [replyTargetId, setReplyTargetId] = useState<string | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const isResolved = thread.status === "resolved";

  const handleStatus = async () => {
    setStatusBusy(true);
    try {
      await onToggleStatus(
        thread.root.identifier,
        isResolved ? "open" : "resolved"
      );
    } finally {
      setStatusBusy(false);
    }
  };

  return (
    <section
      className={`thread${isResolved ? " thread--resolved" : ""}`}
      aria-label={`Thread: ${thread.root.title ?? thread.root.identifier}`}
    >
      <header className="thread-header">
        <span
          className={`thread-badge${isResolved ? " thread-badge--resolved" : ""}`}
        >
          {isResolved ? "Resolved" : "Open"}
        </span>
        <button
          type="button"
          className="btn ghost small"
          disabled={statusBusy}
          onClick={() => void handleStatus()}
        >
          {statusBusy
            ? "Updating…"
            : isResolved
              ? "Reopen thread"
              : "Mark resolved"}
        </button>
      </header>

      <CommentItem
        comment={thread.root}
        onReply={() => setReplyTargetId(thread.root.identifier)}
      />

      {thread.replies.map((reply) => (
        <CommentItem
          key={reply.identifier}
          comment={reply}
          isReply
          onReply={() => setReplyTargetId(reply.identifier)}
        />
      ))}

      {replyTargetId ? (
        <CommentEditor
          portApiBaseUrl={portApiBaseUrl}
          portToken={portToken}
          placeholder="Reply…"
          submitLabel="Reply"
          onCancel={() => setReplyTargetId(null)}
          onSubmit={async (body, mentions) => {
            await onPostReply(replyTargetId, body, mentions);
            setReplyTargetId(null);
          }}
        />
      ) : (
        <button
          type="button"
          className="btn link reply-toggle"
          onClick={() => setReplyTargetId(thread.root.identifier)}
        >
          Reply to thread
        </button>
      )}

      {!currentUserEmail && (
        <p className="muted-inline">Sign in to Port to post comments.</p>
      )}
    </section>
  );
}
