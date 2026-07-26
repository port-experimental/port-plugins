import {
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent,
  type MutableRefObject,
  type ReactNode,
} from "react";

import {
  Bold,
  Code,
  FileCode,
  Italic,
  Link2,
  List,
  ListOrdered,
  Strikethrough,
  TextQuote,
} from "lucide-react";

interface RichTextInputProps {
  value: string;
  onChange: (val: string) => void;
  onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  /** Rendered inside a `position:relative` wrapper around the textarea only,
   *  so absolute children (e.g. mention dropdown) anchor to the textarea top. */
  overlay?: ReactNode;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

type FormatType =
  | "bold"
  | "italic"
  | "strikethrough"
  | "link"
  | "code"
  | "codeblock"
  | "ol"
  | "ul"
  | "blockquote";

function computeFormat(
  val: string,
  selStart: number,
  selEnd: number,
  type: FormatType
): { newVal: string; newStart: number; newEnd: number } {
  const selected = val.slice(selStart, selEnd);

  if (type === "bold") {
    const text = selected || "bold text";
    return {
      newVal: val.slice(0, selStart) + `**${text}**` + val.slice(selEnd),
      newStart: selStart + 2,
      newEnd: selStart + 2 + text.length,
    };
  }
  if (type === "italic") {
    const text = selected || "italic text";
    return {
      newVal: val.slice(0, selStart) + `*${text}*` + val.slice(selEnd),
      newStart: selStart + 1,
      newEnd: selStart + 1 + text.length,
    };
  }
  if (type === "strikethrough") {
    const text = selected || "text";
    return {
      newVal: val.slice(0, selStart) + `~~${text}~~` + val.slice(selEnd),
      newStart: selStart + 2,
      newEnd: selStart + 2 + text.length,
    };
  }
  if (type === "code") {
    const text = selected || "code";
    return {
      newVal: val.slice(0, selStart) + "`" + text + "`" + val.slice(selEnd),
      newStart: selStart + 1,
      newEnd: selStart + 1 + text.length,
    };
  }
  if (type === "codeblock") {
    const text = selected || "code block";
    return {
      newVal: val.slice(0, selStart) + "```\n" + text + "\n```" + val.slice(selEnd),
      newStart: selStart + 4,
      newEnd: selStart + 4 + text.length,
    };
  }
  if (type === "link") {
    const text = selected || "link text";
    return {
      newVal:
        val.slice(0, selStart) + `[${text}](url)` + val.slice(selEnd),
      newStart: selStart + text.length + 3,
      newEnd: selStart + text.length + 6,
    };
  }
  // Line-prefix operations
  const prefix =
    type === "ul" ? "- " : type === "ol" ? "1. " : "> ";
  const lineStart = val.lastIndexOf("\n", selStart - 1) + 1;
  const chunk = val.slice(lineStart, selEnd);
  const prefixed = chunk
    .split("\n")
    .map((l) => prefix + l)
    .join("\n");
  return {
    newVal: val.slice(0, lineStart) + prefixed + val.slice(selEnd),
    newStart: lineStart,
    newEnd: lineStart + prefixed.length,
  };
}

// ── Toolbar button ────────────────────────────────────────────────────────────

function ToolbarBtn({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      className="rti-btn"
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export const RichTextInput = forwardRef<HTMLTextAreaElement, RichTextInputProps>(
  (
    {
      value,
      onChange,
      onKeyDown,
      placeholder,
      rows = 3,
      disabled,
      autoFocus,
      className,
      overlay,
    },
    forwardedRef
  ) => {
    const localRef = useRef<HTMLTextAreaElement>(null);
    const pendingSel = useRef<{ start: number; end: number } | null>(null);

    // Merge forwarded ref with local ref
    const setRef = useCallback(
      (el: HTMLTextAreaElement | null) => {
        (localRef as MutableRefObject<HTMLTextAreaElement | null>).current = el;
        if (typeof forwardedRef === "function") {
          forwardedRef(el);
        } else if (forwardedRef) {
          forwardedRef.current = el;
        }
      },
      [forwardedRef]
    );

    // Restore selection after React re-renders with new value
    useEffect(() => {
      if (pendingSel.current && localRef.current) {
        const { start, end } = pendingSel.current;
        localRef.current.setSelectionRange(start, end);
        pendingSel.current = null;
      }
    }, [value]);

    const applyFormat = useCallback(
      (type: FormatType) => {
        const ta = localRef.current;
        if (!ta) return;
        const { value: val, selectionStart, selectionEnd } = ta;
        const { newVal, newStart, newEnd } = computeFormat(
          val,
          selectionStart,
          selectionEnd,
          type
        );
        pendingSel.current = { start: newStart, end: newEnd };
        onChange(newVal);
      },
      [onChange]
    );

    return (
      <div className={`rich-input${className ? ` ${className}` : ""}`}>
        {/* Prevent mousedown on toolbar from stealing focus from textarea */}
        <div
          className="rich-input__toolbar"
          onMouseDown={(e) => e.preventDefault()}
        >
          <div className="rich-input__group">
            <ToolbarBtn title="Bold (⌘B)" onClick={() => applyFormat("bold")}>
              <Bold size={13} />
            </ToolbarBtn>
            <ToolbarBtn title="Italic (⌘I)" onClick={() => applyFormat("italic")}>
              <Italic size={13} />
            </ToolbarBtn>
            <ToolbarBtn
              title="Strikethrough"
              onClick={() => applyFormat("strikethrough")}
            >
              <Strikethrough size={13} />
            </ToolbarBtn>
          </div>

          <span className="rich-input__sep" aria-hidden />

          <div className="rich-input__group">
            <ToolbarBtn title="Link" onClick={() => applyFormat("link")}>
              <Link2 size={13} />
            </ToolbarBtn>
          </div>

          <span className="rich-input__sep" aria-hidden />

          <div className="rich-input__group">
            <ToolbarBtn
              title="Ordered list"
              onClick={() => applyFormat("ol")}
            >
              <ListOrdered size={13} />
            </ToolbarBtn>
            <ToolbarBtn
              title="Unordered list"
              onClick={() => applyFormat("ul")}
            >
              <List size={13} />
            </ToolbarBtn>
            <ToolbarBtn title="Blockquote" onClick={() => applyFormat("blockquote")}>
              <TextQuote size={13} />
            </ToolbarBtn>
          </div>

          <span className="rich-input__sep" aria-hidden />

          <div className="rich-input__group">
            <ToolbarBtn title="Inline code" onClick={() => applyFormat("code")}>
              <Code size={13} />
            </ToolbarBtn>
            <ToolbarBtn
              title="Code block"
              onClick={() => applyFormat("codeblock")}
            >
              <FileCode size={13} />
            </ToolbarBtn>
          </div>
        </div>

        {/* Positioned wrapper so overlay (e.g. mention dropdown) anchors to the textarea */}
        <div className="rich-input__textarea-wrap">
          <textarea
            ref={setRef}
            className="rich-input__textarea"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            autoFocus={autoFocus}
            aria-label="Comment body"
          />
          {overlay}
        </div>
      </div>
    );
  }
);

RichTextInput.displayName = "RichTextInput";
