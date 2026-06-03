/**
 * Case- and diacritic-insensitive comparison for search and sentiment matching.
 * Display text stays as returned from Port; use this only for logic.
 */
export function normalizeForComparison(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

/** Distinct contains variants so Port's case-sensitive `contains` still matches Active/ACTIVE/active. */
export function caseInsensitiveContainsVariants(term: string): string[] {
  const trimmed = term.trim();
  if (!trimmed) return [];

  const lower = trimmed.toLocaleLowerCase();
  const upper = trimmed.toLocaleUpperCase();
  const variants = new Set<string>([trimmed, lower, upper]);

  if (lower.length > 0) {
    variants.add(lower.charAt(0).toLocaleUpperCase() + lower.slice(1));
    const titleCase = lower.replace(
      /\b\p{L}/gu,
      (ch) => ch.toLocaleUpperCase()
    );
    if (titleCase) variants.add(titleCase);
  }

  return [...variants];
}

export function stringsEqualInsensitive(a: string, b: string): boolean {
  return normalizeForComparison(a) === normalizeForComparison(b);
}

export function stringIncludesInsensitive(haystack: string, needle: string): boolean {
  const n = normalizeForComparison(needle);
  if (!n) return true;
  return normalizeForComparison(haystack).includes(n);
}

/**
 * Case-insensitive search that won't match `active` inside `inactive`.
 * Matches whole tokens (e.g. status enum) or the term as a separate word in longer text.
 */
export function stringMatchesSearch(haystack: string, needle: string): boolean {
  const n = normalizeForComparison(needle);
  if (!n) return true;

  const h = normalizeForComparison(haystack);
  if (!h) return false;
  if (h === n) return true;

  const tokens = h.split(/[^a-z0-9]+/).filter(Boolean);
  if (tokens.some((token) => token === n)) return true;

  const escaped = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const wordBoundary = new RegExp(`(?:^|[^a-z0-9])${escaped}(?:[^a-z0-9]|$)`);
  return wordBoundary.test(h);
}
