const MENTION_PATTERN = /@([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

export function extractMentions(body: string): string[] {
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  const re = new RegExp(MENTION_PATTERN.source, "g");
  while ((match = re.exec(body)) !== null) {
    found.add(match[1].toLowerCase());
  }
  return [...found];
}

export function insertMention(
  text: string,
  email: string,
  cursor: number
): { next: string; cursor: number } {
  const mention = `@${email} `;
  const before = text.slice(0, cursor);
  const after = text.slice(cursor);
  const next = `${before}${mention}${after}`;
  return { next, cursor: before.length + mention.length };
}

export function filterUsersByQuery(
  users: { email: string; label: string }[],
  query: string
): { email: string; label: string }[] {
  const q = query.trim().toLowerCase();
  if (!q) return users.slice(0, 8);
  return users
    .filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        u.label.toLowerCase().includes(q)
    )
    .slice(0, 8);
}

export function mentionQueryAtCursor(
  text: string,
  cursor: number
): { query: string; start: number } | null {
  const before = text.slice(0, cursor);
  const at = before.lastIndexOf("@");
  if (at < 0) return null;
  const fragment = before.slice(at + 1);
  if (/\s/.test(fragment)) return null;
  return { query: fragment, start: at };
}
