import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_USERS } from "../dev/mockData";
import type { PortUser } from "../types";

export async function searchPortUsers(
  baseUrl: string,
  token: string
): Promise<PortUser[]> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    return MOCK_USERS;
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
        query: { combinator: "and", rules: [] },
      }),
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Port API ${res.status}: ${body}`);
  }

  const result = (await res.json()) as { entities: PortUser[] };
  return result.entities ?? [];
}
