/**
 * Catalog integrations use different property names for file / sync metadata.
 * Picks the first non-empty value from known keys for "last update" display.
 */

const LAST_UPDATE_KEYS = [
  "lastUpdated",
  "lastModified",
  "lastModifiedAt",
  "lastCommitDate",
  "commitDate",
  "gitLastCommitDate",
  "fileLastModified",
] as const;

export function pickLastUpdatedRaw(
  properties: Record<string, unknown>,
  entityUpdatedAt?: string
): string | null {
  for (const key of LAST_UPDATE_KEYS) {
    const v = properties[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  if (typeof entityUpdatedAt === "string" && entityUpdatedAt.trim()) {
    return entityUpdatedAt.trim();
  }
  return null;
}
