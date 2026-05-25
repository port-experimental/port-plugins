/**
 * Builds the Port app URL for an entity page from the API base URL.
 * Port entity pages use the format: /{blueprintId}Entity?identifier={entityId}
 * e.g. https://api.getport.io → https://app.getport.io/serviceEntity?identifier=my-svc
 */
export function buildPortEntityUrl(
  portApiBaseUrl: string | null,
  blueprintIdentifier: string,
  entityIdentifier: string,
): string {
  if (!portApiBaseUrl || !blueprintIdentifier) return '#';

  const base = portApiBaseUrl.replace(/\/$/, '');
  try {
    const url = new URL(base);
    // Replace "api" subdomain with "app" (handles api.getport.io and api.eu.getport.io)
    url.hostname = url.hostname.replace(/^api\./, 'app.');
    return `${url.origin}/${blueprintIdentifier}Entity?identifier=${entityIdentifier}`;
  } catch {
    return '#';
  }
}
