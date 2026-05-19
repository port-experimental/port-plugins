import { useState } from "react";
import type { CommentEntity } from "../types";
import { MarkdownBody } from "./MarkdownBody";

function formatWhen(iso?: string): string {
  if (!iso) return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function authorLabel(email?: string): string {
  if (!email) return "Unknown";
  const local = email.split("@")[0];
  return local.replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

type Props = {
  comment: CommentEntity;
  isReply?: boolean;
  onReply?: () => void;
};

export function CommentItem({ comment, isReply, onReply }: Props) {
  const [expanded, setExpanded] = useState(true);
  const body = String(comment.properties?.body ?? "");
  const author = String(comment.properties?.author ?? "");

  return (
    <article
      className={`comment-item${isReply ? " comment-item--reply" : ""}`}
    >
      <header className="comment-header">
        <span className="comment-avatar" aria-hidden>
          {authorLabel(author).slice(0, 1)}
        </span>
        <div className="comment-meta">
          <span className="comment-author">{authorLabel(author)}</span>
          <time className="comment-time" dateTime={comment.createdAt}>
            {formatWhen(comment.createdAt)}
          </time>
        </div>
        <div className="comment-header-actions">
          {body.length > 280 && (
            <button
              type="button"
              className="btn link"
              onClick={() => setExpanded((v) => !v)}
            >
              {expanded ? "Collapse" : "Expand"}
            </button>
          )}
          {onReply && (
            <button type="button" className="btn link" onClick={onReply}>
              Reply
            </button>
          )}
        </div>
      </header>
      <div
        className={`comment-body${expanded ? "" : " comment-body--clamped"}`}
      >
        <MarkdownBody body={body} />
      </div>
    </article>
  );
}
