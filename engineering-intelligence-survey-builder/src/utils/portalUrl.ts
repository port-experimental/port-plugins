const DEFAULT_PORTAL_ORIGIN = "https://app.port.io";
/** Page identifier of the dashboard that hosts the developer-survey picker. */
const DEFAULT_RESPONDENT_PAGE = "developer_survey";
/** Page identifier of the dashboard that hosts the survey-analytics widget. */
const DEFAULT_ANALYTICS_PAGE = "survey_analytics";

/**
 * Origin (and any org segment) of the embedding Port portal, read from the
 * referrer. Cross-origin embedding means the referrer is usually trimmed to the
 * bare origin - good enough for the host, but the org segment is recovered from
 * the token instead (see `orgFromToken`).
 */
function portalBase(): { origin: string; org: string | null } {
  try {
    const ref = document.referrer?.trim();
    if (ref) {
      const u = new URL(ref);
      const seg = u.pathname.split("/").filter(Boolean);
      const org = seg[0]?.startsWith("org_") ? seg[0] : null;
      return { origin: u.origin, org };
    }
  } catch {
    /* invalid referrer */
  }
  return { origin: DEFAULT_PORTAL_ORIGIN, org: null };
}

/**
 * The org id (`org_…`) from the Port JWT. The portal URL needs the org segment,
 * which a cross-origin referrer drops - but the token always carries `orgId`.
 */
function orgFromToken(token: string | null | undefined): string | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64.length % 4 ? b64 + "=".repeat(4 - (b64.length % 4)) : b64;
    const payload = JSON.parse(
      decodeURIComponent(
        atob(padded)
          .split("")
          .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
          .join("")
      )
    );
    return typeof payload.orgId === "string" && payload.orgId ? payload.orgId : null;
  } catch {
    return null;
  }
}

/**
 * URL of the dashboard where developers pick and fill in a survey. The org comes
 * from the token (reliable cross-origin), the origin from the referrer. The
 * respondentUrl param, when set, overrides this entirely.
 */
export function buildRespondentDashboardUrl(
  token?: string | null,
  pageId = DEFAULT_RESPONDENT_PAGE
): string {
  const { origin, org: orgFromRef } = portalBase();
  const org = orgFromToken(token) ?? orgFromRef;
  return org ? `${origin}/${org}/${pageId}` : `${origin}/${pageId}`;
}

/**
 * Deep link to a survey's results in the survey-analytics dashboard, with the
 * survey id in the query so analytics can pre-select it. `override` (the
 * analyticsUrl param) wins over the portal-derived default.
 */
export function buildAnalyticsResultsUrl(
  surveyId: string,
  override?: string,
  token?: string | null
): string {
  const base =
    override?.trim() || buildRespondentDashboardUrl(token, DEFAULT_ANALYTICS_PAGE);
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}survey=${encodeURIComponent(surveyId)}`;
}
