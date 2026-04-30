/**
 * Normalize Port relation values to entity identifier strings.
 * Supports string, string[], null, and `{ identifier: string }` shapes returned by the API.
 */
export function relationIdList(rel: unknown): string[] {
  if (rel == null) return [];
  if (typeof rel === "string") {
    const t = rel.trim();
    return t ? [t] : [];
  }
  if (Array.isArray(rel)) {
    const out: string[] = [];
    for (const x of rel) {
      if (typeof x === "string") {
        const t = x.trim();
        if (t) out.push(t);
      } else if (x && typeof x === "object" && "identifier" in x) {
        const id = (x as { identifier: unknown }).identifier;
        if (typeof id === "string" && id.trim()) out.push(id.trim());
      }
    }
    return out;
  }
  if (typeof rel === "object" && "identifier" in rel) {
    const id = (rel as { identifier: unknown }).identifier;
    if (typeof id === "string" && id.trim()) return [id.trim()];
  }
  return [];
}
