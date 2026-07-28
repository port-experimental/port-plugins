import type { Campaign } from "../api/campaigns";

type Props = {
  campaign?: Campaign | null;
  /** Survey lifecycle status; an active, unshared survey gets the attention chip. */
  status?: string;
  /** Resolve a team identifier to its display title. */
  teamTitle: (id: string) => string;
};

function PeopleIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

/** Summarize a campaign audience as "All teams" or "Platform +2". */
function audienceLabel(campaign: Campaign, teamTitle: (id: string) => string): string {
  if (campaign.audience === "all") return "All teams";
  const names = campaign.teams.map(teamTitle);
  if (names.length === 0) return "No teams";
  if (names.length === 1) return names[0];
  return `${names[0]} +${names.length - 1}`;
}

/**
 * Secondary, lower-weight chip next to the status pill. Shows the share
 * audience when a campaign exists, or a subtle "Not shared" nudge for an active
 * survey that nobody can receive yet. Renders nothing for unshared drafts/closed
 * surveys, where sharing isn't actionable.
 */
export function ShareBadge({ campaign, status, teamTitle }: Props) {
  if (campaign) {
    return (
      <span className="share-chip" title={`Shared with ${audienceLabel(campaign, teamTitle)}`}>
        <PeopleIcon />
        {audienceLabel(campaign, teamTitle)}
      </span>
    );
  }
  if (status === "active") {
    return (
      <span className="share-chip share-chip--none" title="Published but not shared with anyone yet">
        Not shared
      </span>
    );
  }
  return null;
}
