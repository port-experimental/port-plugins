import { DEV_MOCK } from "../hooks/usePostMessageData";
import { delay, portFetch, type PortCtx } from "./portFetch";
import type { Team } from "../types";

/** Stand-in teams for dev mode (widget running outside Port's iframe). */
const MOCK_TEAMS: Team[] = [
  { identifier: "platform", title: "Platform" },
  { identifier: "mobile", title: "Mobile" },
  { identifier: "data", title: "Data" },
  { identifier: "frontend", title: "Frontend" },
];

/**
 * List the org's teams for the audience picker. Teams are native `_team`
 * entities (same source the runner reads team membership from), so we query the
 * blueprint rather than /v1/teams - keeping one consistent access pattern.
 */
export async function searchTeams(ctx: PortCtx): Promise<Team[]> {
  if (DEV_MOCK) {
    await delay();
    return MOCK_TEAMS;
  }
  const data = await portFetch<{ entities: { identifier: string; title?: string }[] }>(
    ctx,
    "/v1/blueprints/_team/entities",
    { method: "GET" }
  );
  return (data.entities ?? [])
    .map((e) => ({ identifier: e.identifier, title: e.title || e.identifier }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
