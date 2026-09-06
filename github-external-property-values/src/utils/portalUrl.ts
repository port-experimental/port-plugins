const DEFAULT_PORTAL_ORIGIN = "https://app.port.io";
const ORG_SEGMENT_PATTERN = /^\/org_[^/]+/;

/**
 * Portal routes in this org are prefixed with the org id
 * (e.g. `https://app.port.io/org_xxx/serviceEntity?...`). `document.referrer`'s
 * `.origin` alone drops that prefix, so capture it from the referrer's pathname
 * when present; fall back to origin-only (e.g. local dev, or orgs without this
 * routing) otherwise.
 */
export function getPortalBase(): string {
  try {
    const ref = document.referrer?.trim();
    if (ref) {
      const url = new URL(ref);
      const orgSegment = url.pathname.match(ORG_SEGMENT_PATTERN)?.[0] ?? "";
      return `${url.origin}${orgSegment}`;
    }
  } catch {
    /* invalid referrer */
  }
  return DEFAULT_PORTAL_ORIGIN;
}

export function buildEntityPageUrl(
  blueprintIdentifier: string,
  entityIdentifier: string
): string {
  const base = getPortalBase();
  const path = `${encodeURIComponent(blueprintIdentifier)}Entity`;
  const qs = new URLSearchParams({ identifier: entityIdentifier });
  return `${base}/${path}?${qs.toString()}`;
}

export function buildWorkflowRunUrl(runId: string): string {
  const base = getPortalBase();
  const qs = new URLSearchParams({ runId });
  return `${base}/organization/workflow-run?${qs.toString()}`;
}
