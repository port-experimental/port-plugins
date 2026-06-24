import { useQuery } from "@tanstack/react-query";
import { portFetch, type PortCtx } from "../api/portFetch";
import { DEV_MOCK } from "./usePostMessageData";

type UserEntity = { identifier: string; team?: string[] };

/**
 * The current user's teams from their `_user` entity's native ownership
 * ("team"), which Port returns as an array of team identifiers (e.g.
 * ["platform"]). Used both to tag a response's owning team (first one) and to
 * filter the picker to surveys shared with any of the user's teams.
 * Note: `/v1/users` is NOT used - it omits teams by default.
 */
async function fetchUserTeams(ctx: PortCtx, email: string): Promise<string[]> {
  if (DEV_MOCK) return ["platform"];
  try {
    const data = await portFetch<{ entities: UserEntity[] }>(
      ctx,
      "/v1/blueprints/_user/entities/search",
      {
        method: "POST",
        body: JSON.stringify({
          query: {
            combinator: "and",
            rules: [{ property: "$identifier", operator: "=", value: email }],
          },
        }),
      }
    );
    const teams = data.entities?.[0]?.team;
    return Array.isArray(teams) ? teams.filter((t) => typeof t === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Best-effort lookup of the current user's teams. Returns [] gracefully on any
 * error - callers degrade (team tagging skips; audience filtering opens up).
 */
export function useUserTeams(ctx: PortCtx | null, email: string | undefined) {
  return useQuery<string[]>({
    queryKey: ["userTeams", email],
    queryFn: () => fetchUserTeams(ctx!, email!),
    enabled: !!ctx && !!email,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}
