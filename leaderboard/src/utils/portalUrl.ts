const FALLBACK_ORIGIN = "https://app.port.io";

/** Port's portal origin, derived from the host document that embedded this iframe. */
function getPortalOrigin(): string {
  try {
    return document.referrer ? new URL(document.referrer).origin : FALLBACK_ORIGIN;
  } catch {
    return FALLBACK_ORIGIN;
  }
}

/** Link to an entity's page in the Port portal. Not resolvable outside Port's iframe. */
export function entityPageUrl(blueprint: string, identifier: string): string {
  return `${getPortalOrigin()}/${encodeURIComponent(blueprint)}Entity?identifier=${encodeURIComponent(identifier)}`;
}
