import { useQuery } from "@tanstack/react-query";
import { searchTeams } from "../api/teams";
import type { PortCtx } from "../api/portFetch";
import type { Team } from "../types";

/** The org's teams, for the Share drawer's audience picker. */
export function useTeams(ctx: PortCtx | null) {
  return useQuery<Team[]>({
    queryKey: ["teams"],
    enabled: !!ctx,
    queryFn: () => searchTeams(ctx!),
    staleTime: 5 * 60 * 1000,
  });
}
