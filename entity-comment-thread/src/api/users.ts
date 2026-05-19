import { parsePortError } from "./portError";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_USERS } from "../dev/mockData";
import type { PortUser } from "../types";

type SearchResponse = { entities?: PortUser[] };

export async function searchActiveUsers(
  baseUrl: string,
  token: string,
  query: string
): Promise<PortUser[]> {
  if (DEV_MOCK) {
    const q = query.trim().toLowerCase();
    return MOCK_USERS.filter(
      (u) =>
        !q ||
        u.identifier.toLowerCase().includes(q) ||
        (u.title ?? "").toLowerCase().includes(q)
    );
  }

  const rules: Record<string, unknown>[] = [
    {
      property: "status",
      operator: "=",
      value: "Active",
    },
  ];

  if (query.trim()) {
    rules.push({
      property: "$title",
      operator: "contains",
      value: query.trim(),
    });
  }

  const res = await fetch(
    `${baseUrl}/v1/blueprints/_user/entities/search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: { combinator: "and", rules },
      }),
    }
  );

  if (!res.ok) await parsePortError(res);
  const data = (await res.json()) as SearchResponse;
  return data.entities ?? [];
}

export function userLabel(user: PortUser): string {
  return user.title?.trim() || user.identifier;
}

export function usersForMentions(users: PortUser[]): { email: string; label: string }[] {
  return users.map((u) => ({
    email: u.identifier,
    label: userLabel(u),
  }));
}
