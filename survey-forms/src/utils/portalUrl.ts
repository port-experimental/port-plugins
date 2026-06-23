const DEFAULT_PORTAL_ORIGIN = "https://app.port.io";

/** Portal origin for in-app links - from the embedding page, not the API host. */
export function getPortalOrigin(): string {
  try {
    const ref = document.referrer?.trim();
    if (ref) return new URL(ref).origin;
  } catch {
    /* invalid referrer */
  }
  return DEFAULT_PORTAL_ORIGIN;
}

export function buildEntityPageUrl(
  blueprintIdentifier: string,
  entityIdentifier: string
): string {
  const origin = getPortalOrigin();
  const path = `${encodeURIComponent(blueprintIdentifier)}Entity`;
  const qs = new URLSearchParams({ identifier: entityIdentifier });
  return `${origin}/${path}?${qs.toString()}`;
}
