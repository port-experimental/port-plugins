const STORAGE_PREFIX = "entity-cards-view-visible-props:";

export function readVisiblePropertyIds(
  blueprintIdentifier: string
): string[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + blueprintIdentifier);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed.filter((id): id is string => typeof id === "string");
  } catch {
    return null;
  }
}

export function writeVisiblePropertyIds(
  blueprintIdentifier: string,
  propertyIds: string[]
): void {
  try {
    localStorage.setItem(
      STORAGE_PREFIX + blueprintIdentifier,
      JSON.stringify(propertyIds)
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export function defaultVisiblePropertyIds(
  available: { identifier: string }[],
  max = 4
): string[] {
  return available.slice(0, max).map((p) => p.identifier);
}
