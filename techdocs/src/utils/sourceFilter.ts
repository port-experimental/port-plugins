/**
 * Filtering tech docs by the `source` property on the tech doc blueprint
 * (e.g. `git`, `confluence`, `notion`). An empty selection means "all sources".
 */

export const SOURCE_PROPERTY = "source";

/**
 * Normalize the `techDocSources` widget param into a de-duplicated list of
 * source values (matched exactly, so keep the casing used at ingestion). Accepts a comma/newline-separated string
 * (`"git, confluence"`) or an array of strings (`["git", "confluence"]`).
 * Returns `[]` (no filtering) for empty values or `all` / `*`.
 */
export function parseSourceFilter(value: unknown): string[] {
  let raw: unknown[] = [];
  if (Array.isArray(value)) {
    raw = value;
  } else if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed.startsWith("[")) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        if (Array.isArray(parsed)) raw = parsed;
      } catch {
        raw = trimmed.split(/[,\n]/);
      }
    } else {
      raw = trimmed.split(/[,\n]/);
    }
  }

  const out: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const s = item.trim();
    if (!s) continue;
    if (s.toLowerCase() === "all" || s === "*") return [];
    if (!out.includes(s)) out.push(s);
  }
  return out;
}

/** Port search rule restricting results to the selected sources, or `null` for all. */
export function buildSourceRule(
  sources: string[]
): Record<string, unknown> | null {
  if (sources.length === 0) return null;
  return { property: SOURCE_PROPERTY, operator: "in", value: sources };
}

/** Client-side equivalent of {@link buildSourceRule} (used by dev mocks). */
export function matchesSourceFilter(
  properties: Record<string, unknown> | undefined,
  sources: string[]
): boolean {
  if (sources.length === 0) return true;
  const v = properties?.[SOURCE_PROPERTY];
  return typeof v === "string" && sources.includes(v.trim());
}
