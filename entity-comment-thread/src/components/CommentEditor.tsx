import { useCallback, useEffect, useRef, useState } from "react";
import { searchActiveUsers, usersForMentions } from "../api/users";
import {
  extractMentions,
  filterUsersByQuery,
  insertMention,
  mentionQueryAtCursor,
} from "../utils/mentions";

type Props = {
  portApiBaseUrl: string;
  portToken: string;
  placeholder?: string;
  submitLabel?: string;
  initialValue?: string;
  onSubmit: (body: string, mentions: string[]) => Promise<void>;
  onCancel?: () => void;
  disabled?: boolean;
};

export function CommentEditor({
  portApiBaseUrl,
  portToken,
  placeholder = "Write a comment… Use **markdown**, `code`, @mentions",
  submitLabel = "Comment",
  initialValue = "",
  onSubmit,
  onCancel,
  disabled,
}: Props) {
  const [text, setText] = useState(initialValue);
  const [saving, setSaving] = useState(false);
  const [mentionOpen, setMentionOpen] = useState(false);
  const [mentionUsers, setMentionUsers] = useState<
    { email: string; label: string }[]
  >([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setText(initialValue);
  }, [initialValue]);

  const loadMentionUsers = useCallback(
    async (query: string) => {
      const users = await searchActiveUsers(portApiBaseUrl, portToken, query);
      setMentionUsers(filterUsersByQuery(usersForMentions(users), query));
    },
    [portApiBaseUrl, portToken]
  );

  const handleChange = (value: string, cursor: number) => {
    setText(value);
    const mentionCtx = mentionQueryAtCursor(value, cursor);
    if (mentionCtx) {
      setMentionOpen(true);
      void loadMentionUsers(mentionCtx.query);
    } else {
      setMentionOpen(false);
    }
  };

  const wrapSelection = (before: string, after: string) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = text.slice(start, end);
    const next =
      text.slice(0, start) + before + selected + after + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + before.length + selected.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const pickMention = (email: string) => {
    const el = textareaRef.current;
    const cursor = el?.selectionStart ?? text.length;
    const ctx = mentionQueryAtCursor(text, cursor);
    if (!ctx) return;
    const before = text.slice(0, ctx.start);
    const after = text.slice(cursor);
    const { next, cursor: nextCursor } = insertMention(
      before + after.replace(/^@[^\s]*/, ""),
      email,
      before.length
    );
    setText(next);
    setMentionOpen(false);
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(nextCursor, nextCursor);
    });
  };

  const handleSubmit = async () => {
    const body = text.trim();
    if (!body || saving || disabled) return;
    setSaving(true);
    try {
      await onSubmit(body, extractMentions(body));
      setText("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="comment-editor">
      <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
        <button
          type="button"
          className="toolbar-btn"
          title="Bold"
          onClick={() => wrapSelection("**", "**")}
        >
          B
        </button>
        <button
          type="button"
          className="toolbar-btn"
          title="Italic"
          onClick={() => wrapSelection("_", "_")}
        >
          I
        </button>
        <button
          type="button"
          className="toolbar-btn"
          title="Inline code"
          onClick={() => wrapSelection("`", "`")}
        >
          {"</>"}
        </button>
        <button
          type="button"
          className="toolbar-btn"
          title="Code block"
          onClick={() => wrapSelection("\n```\n", "\n```\n")}
        >
          {"{ }"}
        </button>
      </div>
      <div className="editor-input-wrap">
        <textarea
          ref={textareaRef}
          className="editor-textarea"
          value={text}
          placeholder={placeholder}
          rows={4}
          disabled={disabled || saving}
          onChange={(e) =>
            handleChange(e.target.value, e.target.selectionStart)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              void handleSubmit();
            }
          }}
        />
        {mentionOpen && mentionUsers.length > 0 && (
          <ul className="mention-list" role="listbox">
            {mentionUsers.map((u) => (
              <li key={u.email}>
                <button
                  type="button"
                  className="mention-option"
                  onClick={() => pickMention(u.email)}
                >
                  <span className="mention-label">{u.label}</span>
                  <span className="mention-email">{u.email}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="editor-actions">
        {onCancel && (
          <button
            type="button"
            className="btn ghost"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          className="btn primary"
          onClick={() => void handleSubmit()}
          disabled={disabled || saving || !text.trim()}
        >
          {saving ? "Saving…" : submitLabel}
        </button>
      </div>
    </div>
  );
}
