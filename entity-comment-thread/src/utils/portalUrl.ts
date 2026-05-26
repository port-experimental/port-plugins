export function getPortalOrigin(): string {
  try {
    if (document.referrer) {
      const url = new URL(document.referrer);
      return url.origin;
    }
  } catch {
    /* ignore */
  }
  return "https://app.port.io";
}

export function entityPageUrl(
  blueprintIdentifier: string,
  entityIdentifier: string
): string {
  const origin = getPortalOrigin();
  return `${origin}/${blueprintIdentifier}Entity?identifier=${encodeURIComponent(entityIdentifier)}`;
}
