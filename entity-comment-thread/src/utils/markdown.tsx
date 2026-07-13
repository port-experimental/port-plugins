import type { ReactNode } from "react";
import type { PortUser } from "../types";

/**
 * Safe markdown-to-React renderer (no dangerouslySetInnerHTML).
 * Inline: **bold**, *italic*, ~~strike~~, `code`, [label](url), @mentions
 * Block:  ```code blocks```, > blockquote, - / 1. lists
 */

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
    const local = email.split("@")[0];
    return local
      .split(/[._+\-]/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? "")
      .join("");
  }
  return "?";
}

// ── Inline parser ─────────────────────────────────────────────────────────────

type Segment =
  | { kind: "text"; value: string }
  | { kind: "bold"; value: string }
  | { kind: "italic"; value: string }
  | { kind: "strike"; value: string }
  | { kind: "code"; value: string }
  | { kind: "link"; label: string; href: string }
  | { kind: "mention"; value: string };

// Groups (1-based capture groups):
//  1 – full **bold**           → inner = [2]
//  2 – bold inner
//  3 – full *italic*           → inner = [4]
//  4 – italic inner
//  5 – full ~~strike~~         → inner = [6]
//  6 – strike inner
//  7 – full [label](href)      → label=[8], href=[9]
//  8 – link label
//  9 – link href
// 10 – full `code`             → inner = [11]
// 11 – code inner
// 12 – @mention handle         → [12]
const INLINE_RE =
  /(\*\*(.+?)\*\*)|(\*(.+?)\*)|~~((.+?))~~|(\[([^\]]+)\]\(([^)]*)\))|(`([^`]+)`)|(@(?:[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}|[\w.-]+))/g;

function sanitizeHref(href: string): string {
  const trimmed = href.trim();
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) {
    return trimmed;
  }
  return "#";
}

function parseInline(text: string, mentionedUsers: string[]): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  INLINE_RE.lastIndex = 0;

  while ((match = INLINE_RE.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", value: text.slice(lastIndex, match.index) });
    }

    if (match[2] !== undefined) {
      segments.push({ kind: "bold", value: match[2] });
    } else if (match[4] !== undefined) {
      segments.push({ kind: "italic", value: match[4] });
    } else if (match[6] !== undefined) {
      segments.push({ kind: "strike", value: match[6] });
    } else if (match[8] !== undefined) {
      segments.push({
        kind: "link",
        label: match[8],
        href: sanitizeHref(match[9] ?? ""),
      });
    } else if (match[11] !== undefined) {
      segments.push({ kind: "code", value: match[11] });
    } else if (match[12] !== undefined) {
      const handle = match[12].slice(1); // strip leading @
      const isMention =
        mentionedUsers.length === 0 ||
        mentionedUsers.some((u) => u === handle || u.startsWith(handle));
      if (isMention) {
        segments.push({ kind: "mention", value: handle });
      } else {
        segments.push({ kind: "text", value: match[0] });
      }
    }

    lastIndex = INLINE_RE.lastIndex;
  }

  if (lastIndex < text.length) {
    segments.push({ kind: "text", value: text.slice(lastIndex) });
  }

  return segments;
}

function renderSegments(
  segments: Segment[],
  keyPrefix: string,
  users: PortUser[]
): ReactNode[] {
  return segments.map((seg, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (seg.kind) {
      case "bold":
        return <strong key={key}>{seg.value}</strong>;
      case "italic":
        return <em key={key}>{seg.value}</em>;
      case "strike":
        return <del key={key}>{seg.value}</del>;
      case "code":
        return (
          <code key={key} className="md-inline-code">
            {seg.value}
          </code>
        );
      case "link":
        return (
          <a
            key={key}
            href={seg.href}
            target="_blank"
            rel="noopener noreferrer"
            className="md-link"
          >
            {seg.label}
          </a>
        );
      case "mention": {
        const user = users.find(
          (u) =>
            u.properties?.email === seg.value ||
            u.identifier === seg.value ||
            u.identifier === `@${seg.value}`
        );
        const displayName = user?.title ?? seg.value;
        return (
          <span key={key} className="md-mention">
            {displayName}
          </span>
        );
      }
      default:
        return <span key={key}>{seg.value}</span>;
    }
  });
}

// ── Block renderer ────────────────────────────────────────────────────────────

function renderTextBlock(
  text: string,
  mentions: string[],
  users: PortUser[],
  keyPrefix: string
): ReactNode[] {
  const lines = text.split("\n");
  const result: ReactNode[] = [];
  let i = 0;
  let groupIdx = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Unordered list — collect consecutive `- ` / `* ` lines
    if (/^[-*] /.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        const content = lines[i].slice(2);
        items.push(
          <li key={`${keyPrefix}-ul-li-${i}`}>
            {renderSegments(parseInline(content, mentions), `${keyPrefix}-uli-${i}`, users)}
          </li>
        );
        i++;
      }
      result.push(
        <ul key={`${keyPrefix}-ul-${groupIdx++}`} className="md-list">
          {items}
        </ul>
      );
      continue;
    }

    // Ordered list — collect consecutive `1. ` / `2. ` etc. lines
    if (/^\d+\. /.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        const content = lines[i].replace(/^\d+\. /, "");
        items.push(
          <li key={`${keyPrefix}-ol-li-${i}`}>
            {renderSegments(parseInline(content, mentions), `${keyPrefix}-oli-${i}`, users)}
          </li>
        );
        i++;
      }
      result.push(
        <ol key={`${keyPrefix}-ol-${groupIdx++}`} className="md-list">
          {items}
        </ol>
      );
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const content = line.slice(2);
      result.push(
        <blockquote
          key={`${keyPrefix}-bq-${groupIdx++}`}
          className="md-blockquote"
        >
          {renderSegments(parseInline(content, mentions), `${keyPrefix}-bq-${i}`, users)}
        </blockquote>
      );
      i++;
      continue;
    }

    // Regular inline line
    result.push(
      ...renderSegments(parseInline(line, mentions), `${keyPrefix}-l${i}`, users)
    );
    if (i < lines.length - 1) {
      result.push(<br key={`${keyPrefix}-br${i}`} />);
    }
    i++;
  }

  return result;
}

// ── Public entry point ────────────────────────────────────────────────────────

export function renderMarkdown(
  body: string,
  mentions: string[] = [],
  users: PortUser[] = []
): ReactNode {
  if (!body) return null;

  const nodes: ReactNode[] = [];
  const codeBlockRe = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let blockIdx = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRe.exec(body)) !== null) {
    const before = body.slice(lastIndex, match.index);
    if (before) {
      nodes.push(...renderTextBlock(before, mentions, users, `tb-${blockIdx}`));
    }
    const lang = match[1] || "";
    const code = match[2].replace(/^\n/, "").replace(/\n$/, "");
    nodes.push(
      <pre key={`code-${blockIdx}`} className="md-code-block">
        {lang && <span className="md-code-lang">{lang}</span>}
        <code>{code}</code>
      </pre>
    );
    lastIndex = codeBlockRe.lastIndex;
    blockIdx++;
  }

  const remaining = body.slice(lastIndex);
  if (remaining) {
    nodes.push(...renderTextBlock(remaining, mentions, users, `tb-${blockIdx}`));
  }

  return <>{nodes}</>;
}
