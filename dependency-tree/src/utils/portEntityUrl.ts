/** Returns the portal origin from the parent page referrer, falling back to app.port.io. */
function getPortalOrigin(): string {
  try {
    if (document.referrer) return new URL(document.referrer).origin;
  } catch {
    // fall through
  }
  return 'https://app.port.io';
}

/** Builds a Port entity-page URL using the portal origin from document.referrer. */
export function buildPortEntityUrl(
  blueprintIdentifier: string,
  entityIdentifier: string,
): string {
  if (!blueprintIdentifier || !entityIdentifier) return '#';
  return `${getPortalOrigin()}/${blueprintIdentifier}Entity?identifier=${encodeURIComponent(entityIdentifier)}`;
}
