const DEFAULT_PORTAL_ORIGIN = "https://app.port.io";

export function getPortalOrigin(): string {
  try {
    const ref = document.referrer?.trim();
    if (ref) return new URL(ref).origin;
  } catch {
    // invalid referrer — use fallback
  }
  return DEFAULT_PORTAL_ORIGIN;
}

export function buildPageUrl(pageIdentifier: string): string {
  const origin = getPortalOrigin();
  return `${origin}/${encodeURIComponent(pageIdentifier)}`;
}

export function buildSelfServiceActionUrl(actionIdentifier: string): string {
  const origin = getPortalOrigin();
  const qs = new URLSearchParams({ action: actionIdentifier });
  return `${origin}/workflows/self-service?${qs.toString()}`;
}

export function buildWorkflowSelfServeUrl(
  workflowIdentifier: string,
  triggerIdentifier: string
): string {
  const origin = getPortalOrigin();
  const qs = new URLSearchParams({
    workflow: `${workflowIdentifier}/${triggerIdentifier}`,
  });
  return `${origin}/workflows/self-service?${qs.toString()}`;
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
