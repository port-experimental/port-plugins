import type { Campaign } from "../api/campaigns";
import type { Entity } from "../types";

/**
 * Filter active surveys to the ones the current user may see (model A: sharing
 * gates visibility). A survey is visible when:
 *   - it was shared with audience "all", or
 *   - it was shared with one of the user's teams.
 * An active survey with no campaign is NOT shown - publishing alone doesn't
 * distribute it.
 *
 * `degradeOpen` is the safety valve: when we can't determine identity or load
 * campaigns (no user email, or a failed lookup), we show everything rather than
 * leave the runner mysteriously empty due to an infra hiccup.
 */
export function filterSharedSurveys(
  surveys: Entity[],
  campaigns: Record<string, Campaign>,
  userTeams: string[],
  degradeOpen: boolean
): Entity[] {
  if (degradeOpen) return surveys;
  const mine = new Set(userTeams);
  return surveys.filter((s) => {
    const c = campaigns[s.identifier];
    if (!c) return false;
    if (c.audience === "all") return true;
    return c.teams.some((t) => mine.has(t));
  });
}
