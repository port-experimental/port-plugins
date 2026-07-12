import React, { useRef } from "react";
import { Bold, Heading, Italic, Link2, List } from "lucide-react";

type Props = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  ariaLabel?: string;
};

type Wrap = { before: string; after: string; placeholder: string };

const ACTIONS: { key: string; label: string; icon: typeof Bold; wrap: Wrap }[] = [
  { key: "h", label: "Heading", icon: Heading, wrap: { before: "## ", after: "", placeholder: "Heading" } },
  { key: "b", label: "Bold", icon: Bold, wrap: { before: "**", after: "**", placeholder: "bold text" } },
  { key: "i", label: "Italic", icon: Italic, wrap: { before: "_", after: "_", placeholder: "italic text" } },
  { key: "li", label: "List item", icon: List, wrap: { before: "- ", after: "", placeholder: "list item" } },
  { key: "a", label: "Link", icon: Link2, wrap: { before: "[", after: "](https://)", placeholder: "link text" } },
];

export function MarkdownEditor({ value, onChange, placeholder, ariaLabel }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const applyWrap = (wrap: Wrap) => {
    const el = ref.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || wrap.placeholder;
    const next =
      value.slice(0, start) + wrap.before + selected + wrap.after + value.slice(end);
    onChange(next);

    const caretStart = start + wrap.before.length;
    const caretEnd = caretStart + selected.length;
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(caretStart, caretEnd);
    });
  };

  return (
    <div className="editor">
      <div className="editor-toolbar" role="toolbar" aria-label="Formatting">
        {ACTIONS.map(({ key, label, icon: Icon, wrap }) => (
          <button
            key={key}
            type="button"
            className="tool-btn"
            aria-label={label}
            title={label}
            onClick={() => applyWrap(wrap)}
          >
            <Icon size={15} aria-hidden />
          </button>
        ))}
      </div>
      <textarea
        ref={ref}
        className="editor-textarea"
        value={value}
        spellCheck
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Write your SKILL.md content here…"}
        aria-label={ariaLabel ?? "SKILL.md content"}
      />
    </div>
  );
}
