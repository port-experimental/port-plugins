import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { RichTextInput } from "./RichTextInput";
import {
  CheckCircle2,
  Circle,
  CornerDownRight,
  Loader2,
  MoreHorizontal,
  Pencil,
  RotateCcw,
  Trash2,
  X,
} from "lucide-react";
import { renderMarkdown } from "../utils/markdown";
import { CommentComposer } from "./CommentComposer";
import type { Comment, PortUser } from "../types";

interface CommentItemProps {
  comment: Comment;
  isTopLevel: boolean;
  currentUserEmail: string;
  users: PortUser[];
  replies: Comment[];
  onReply: (parentId: string, body: string, mentions: string[]) => void;
  onEdit: (commentId: string, newBody: string) => void;
  onToggleStatus: (commentId: string, status: "open" | "resolved") => void;
  onDelete: (commentId: string) => void;
  isTogglingStatus?: boolean;
  isDeletingId?: string | null;
  isEditingId?: string | null;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const AVATAR_PALETTE = [
  "#8B8FFF", "#7B88FF", "#6E7CF5",
  "#5AA3F0", "#48C9B0", "#58D68D",
  "#F4A24B", "#EC7063", "#BB8FCE",
  "#5DADE2", "#F1948A", "#45B39D",
];

function avatarColor(key: string): string {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    return name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }
  if (email) {
    // Use only the local part before @, split on separators
    const local = email.split("@")[0];
    return local
      .split(/[._+\-]/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }
  return "?";
}

export function CommentItem({
  comment,
  isTopLevel,
  currentUserEmail,
  users,
  replies,
  onReply,
  onEdit,
  onToggleStatus,
  onDelete,
  isTogglingStatus = false,
  isDeletingId,
  isEditingId,
}: CommentItemProps) {
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [showReplies, setShowReplies] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editBody, setEditBody] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  // Close overflow menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const { body, status, mentions } = comment.properties;
  const authorEmail = comment.properties.author ?? "";
  const authorUser = users.find(
    (u) =>
      u.properties?.email === authorEmail ||
      u.identifier === authorEmail
  );
  const authorName = authorUser?.title;
  const isAuthor = !!currentUserEmail && currentUserEmail === authorEmail;
  const isResolved = status === "resolved";
  const isDeleting = isDeletingId === comment.identifier;
  const isSavingEdit = isEditingId === comment.identifier;
  const displayName = authorName ?? (authorEmail || "Unknown");
  const initials = getInitials(authorName, authorEmail);

  const hasOverflowActions = isTopLevel || isAuthor;

  const handleStartEdit = () => {
    setEditBody(body ?? "");
    setEditMode(true);
    setMenuOpen(false);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditBody("");
  };

  const handleSaveEdit = () => {
    const trimmed = editBody.trim();
    if (!trimmed || trimmed === body) {
      handleCancelEdit();
      return;
    }
    onEdit(comment.identifier, trimmed);
    setEditMode(false);
    setEditBody("");
  };

  const handleEditKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  // ── Shared card markup (used for both top-level and reply) ──
  const card = (
    <div
      className={[
        "comment",
        isTopLevel ? "comment--top" : "comment--reply",
        isResolved ? "comment--resolved" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div
        className="comment__avatar"
        aria-hidden
        style={{ background: avatarColor(authorEmail || displayName) }}
      >
        {initials}
      </div>

      <div className="comment__content">
        {/* ── Header ── */}
        <div className="comment__header">
          <div className="comment__author-info">
            <span className="comment__author">{displayName}</span>
            <span className="comment__meta">{formatDate(comment.createdAt)}</span>
            {isTopLevel && status && (
              <span className={`status-badge status-badge--${isResolved ? "resolved" : "open"}`}>
                {isResolved ? "Resolved" : "Open"}
              </span>
            )}
            {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
              <span className="comment__edited-badge">edited</span>
            )}
          </div>

          {/* ··· overflow menu */}
          {hasOverflowActions && (
            <div className="comment__overflow" ref={menuRef}>
              <button
                type="button"
                className={`overflow-trigger${menuOpen ? " overflow-trigger--open" : ""}`}
                onClick={() => setMenuOpen((v) => !v)}
                aria-label="More actions"
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <MoreHorizontal size={14} aria-hidden />
              </button>

              {menuOpen && (
                <div className="overflow-menu" role="menu">
                  {isTopLevel && (
                    <button
                      type="button"
                      role="menuitem"
                      className="overflow-item"
                      disabled={isTogglingStatus}
                      onClick={() => {
                        onToggleStatus(comment.identifier, isResolved ? "open" : "resolved");
                        setMenuOpen(false);
                      }}
                    >
                      {isTogglingStatus
                        ? <Loader2 size={13} aria-hidden className="icon-spin" />
                        : isResolved
                          ? <Circle size={13} aria-hidden />
                          : <CheckCircle2 size={13} aria-hidden />}
                      {isResolved ? "Reopen thread" : "Resolve thread"}
                    </button>
                  )}
                  {isAuthor && (
                    <button type="button" role="menuitem" className="overflow-item" onClick={handleStartEdit}>
                      <Pencil size={13} aria-hidden />
                      Edit
                    </button>
                  )}
                  {isAuthor && (
                    <button
                      type="button"
                      role="menuitem"
                      className="overflow-item overflow-item--danger"
                      disabled={isDeleting}
                      onClick={() => { onDelete(comment.identifier); setMenuOpen(false); }}
                    >
                      <Trash2 size={13} aria-hidden />
                      {isDeleting ? "Deleting…" : "Delete"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Body / Edit area ── */}
        {editMode ? (
          <div className="comment__edit-area">
            <RichTextInput
              value={editBody}
              onChange={setEditBody}
              onKeyDown={handleEditKeyDown}
              rows={3}
              autoFocus
            />
            <div className="edit-actions">
              <span className="edit-hint muted">⌘↵ to save · Esc to cancel</span>
              <div className="edit-buttons">
                <button type="button" className="action-btn" onClick={handleCancelEdit}>
                  <X size={12} aria-hidden />
                  Cancel
                </button>
                <button
                  type="button"
                  className="action-btn action-btn--primary"
                  disabled={isSavingEdit || !editBody.trim()}
                  onClick={handleSaveEdit}
                >
                  {isSavingEdit ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="comment__body">
            {renderMarkdown(body, mentions ?? [], users)}
          </div>
        )}

        {/* ── Footer: Reply + toggle (top-level only) ── */}
        {isTopLevel && !editMode && (
          <div className="comment__footer">
            <button
              type="button"
              className="action-btn"
              onClick={() => setShowReplyBox((v) => !v)}
              aria-label="Reply to this comment"
            >
              <RotateCcw size={12} aria-hidden />
              Reply
            </button>
            {replies.length > 0 && (
              <button
                type="button"
                className="replies-toggle"
                onClick={() => setShowReplies((v) => !v)}
                aria-expanded={showReplies}
              >
                {showReplies
                  ? "Hide replies"
                  : `Show ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`}
              </button>
            )}
          </div>
        )}

        {/* ── Inline reply composer ── */}
        {showReplyBox && (
          <div className="comment__reply-area">
            <div className="replying-to-banner">
              <CornerDownRight size={12} aria-hidden />
              <span>Replying to <strong>{displayName}</strong></span>
            </div>
            <CommentComposer
              users={users}
              placeholder="Write a reply…"
              submitLabel="Reply"
              autoFocus
              onSubmit={(replyBody, mentions) => {
                onReply(comment.identifier, replyBody, mentions);
                setShowReplyBox(false);
              }}
              onCancel={() => setShowReplyBox(false)}
            />
          </div>
        )}

        {/* ── Nested replies inside the card ── */}
        {isTopLevel && replies.length > 0 && (
          <div className={`replies-section${showReplies ? " replies-section--open" : ""}`}>
            <div className="replies-section__inner">
              {replies.map((reply) => (
                <CommentItem
                  key={reply.identifier}
                  comment={reply}
                  isTopLevel={false}
                  currentUserEmail={currentUserEmail}
                  users={users}
                  replies={[]}
                  onReply={onReply}
                  onEdit={onEdit}
                  onToggleStatus={onToggleStatus}
                  onDelete={onDelete}
                  isDeletingId={isDeletingId}
                  isEditingId={isEditingId}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  if (!isTopLevel) {
    return card;
  }

  return (
    <div className={`thread-item${isDeleting ? " thread-item--deleting" : ""}`}>
      {card}
    </div>
  );
}
