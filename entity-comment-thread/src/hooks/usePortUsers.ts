import { useQuery } from "@tanstack/react-query";
import { searchPortUsers } from "../api/users";

export function usePortUsers(baseUrl: string | null, token: string | null) {
  return useQuery({
    queryKey: ["port-users", token],
    queryFn: () => searchPortUsers(baseUrl!, token!),
    enabled: !!baseUrl && !!token,
    staleTime: 5 * 60_000,
  });
}
