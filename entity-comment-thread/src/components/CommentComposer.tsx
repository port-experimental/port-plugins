import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { Send, X } from "lucide-react";
import type { PortUser } from "../types";
import { RichTextInput } from "./RichTextInput";

interface CommentComposerProps {
  users: PortUser[];
  onSubmit: (body: string, mentions: string[]) => void;
  onCancel?: () => void;
  placeholder?: string;
  submitLabel?: string;
  isSubmitting?: boolean;
  autoFocus?: boolean;
}

const AVATAR_PALETTE = [
  "#8B8FFF","#7B88FF","#6E7CF5",
  "#5AA3F0","#48C9B0","#58D68D",
  "#F4A24B","#EC7063","#BB8FCE",
  "#5DADE2","#F1948A","#45B39D",
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
  const src = name ?? email ?? "?";
  const parts = src.split(/\s+|@/);
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function CommentComposer({
  users,
  onSubmit,
  onCancel,
  placeholder = "Add a comment… (supports **bold**, *italic*, `code`, ```blocks```, @mentions)",
  submitLabel = "Comment",
  isSubmitting = false,
  autoFocus = false,
}: CommentComposerProps) {
  const [body, setBody] = useState("");
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionStart, setMentionStart] = useState(0);
  const [mentionHighlight, setMentionHighlight] = useState(0);
  const [mentionedEmails, setMentionedEmails] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredUsers =
    mentionQuery !== null
      ? users.filter(
          (u) =>
            (u.title?.toLowerCase().includes(mentionQuery.toLowerCase()) ||
              u.properties?.email
                ?.toLowerCase()
                .includes(mentionQuery.toLowerCase())) &&
            mentionQuery.length > 0
        )
      : [];

  const handleChange = useCallback((val: string) => {
    setBody(val);
    // Read cursor position from the live DOM element (valid on same tick for typing)
    const pos = textareaRef.current?.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, pos);
    const mentionMatch = /@([\w.]*)$/.exec(textBeforeCursor);
    if (mentionMatch) {
      setMentionQuery(mentionMatch[1]);
      setMentionStart(mentionMatch.index);
      setMentionHighlight(0);
    } else {
      setMentionQuery(null);
    }
  }, []);

  const insertMention = useCallback(
    (user: PortUser) => {
      const email = user.properties?.email ?? user.identifier;
      const before = body.slice(0, mentionStart);
      const after = body.slice(textareaRef.current?.selectionStart ?? body.length);
      const newBody = `${before}@${email} ${after}`;
      setBody(newBody);
      setMentionedEmails((prev) =>
        prev.includes(email) ? prev : [...prev, email]
      );
      setMentionQuery(null);
      setTimeout(() => {
        const ta = textareaRef.current;
        if (ta) {
          const cursor = before.length + email.length + 2;
          ta.setSelectionRange(cursor, cursor);
          ta.focus();
        }
      }, 0);
    },
    [body, mentionStart]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (mentionQuery !== null && filteredUsers.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setMentionHighlight((h) =>
            Math.min(h + 1, filteredUsers.length - 1)
          );
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setMentionHighlight((h) => Math.max(h - 1, 0));
          return;
        }
        if (e.key === "Enter" || e.key === "Tab") {
          e.preventDefault();
          insertMention(filteredUsers[mentionHighlight]);
          return;
        }
        if (e.key === "Escape") {
          setMentionQuery(null);
          return;
        }
      }

      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleSubmit();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mentionQuery, filteredUsers, mentionHighlight, insertMention]
  );

  const handleSubmit = useCallback(() => {
    const trimmed = body.trim();
    if (!trimmed) return;
    onSubmit(trimmed, mentionedEmails);
    setBody("");
    setMentionedEmails([]);
    setMentionQuery(null);
  }, [body, mentionedEmails, onSubmit]);

  return (
    <div className="composer">
      <div className="composer__input-wrap">
        <RichTextInput
          ref={textareaRef}
          value={body}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          disabled={isSubmitting}
          autoFocus={autoFocus}
          overlay={
            mentionQuery !== null && filteredUsers.length > 0 ? (
              <div
                ref={dropdownRef}
                className="mention-dropdown"
                role="listbox"
                aria-label="Mention suggestions"
              >
                {filteredUsers.slice(0, 6).map((u, i) => {
                  const email = u.properties?.email ?? u.identifier;
                  const name  = u.title ?? u.identifier;
                  return (
                    <button
                      key={u.identifier}
                      type="button"
                      role="option"
                      aria-selected={i === mentionHighlight}
                      className={`mention-option${i === mentionHighlight ? " mention-option--active" : ""}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        insertMention(u);
                      }}
                    >
                      <span
                        className="mention-option__avatar"
                        style={{ background: avatarColor(email) }}
                        aria-hidden
                      >
                        {getInitials(name, email)}
                      </span>
                      <span className="mention-option__name">{name}</span>
                      {u.properties?.email && (
                        <span className="mention-option__email">
                          {u.properties.email}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : null
          }
        />
      </div>

      <div className="composer__footer">
        <div className="composer__actions">
          {onCancel && (
            <button
              type="button"
              className="btn btn--ghost"
              onClick={onCancel}
              disabled={isSubmitting}
              aria-label="Cancel"
            >
              <X size={14} aria-hidden />
              Cancel
            </button>
          )}
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleSubmit}
            disabled={!body.trim() || isSubmitting}
            aria-label="Submit comment"
          >
            <Send size={14} aria-hidden />
            {isSubmitting ? "Posting…" : submitLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
