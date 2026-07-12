import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_ENTITIES } from "../dev/mockData";
import type { PortEntity } from "../types";

export async function fetchEntitiesForBlueprint(
  baseUrl: string,
  token: string,
  blueprint: string
): Promise<PortEntity[]> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 250));
    return MOCK_ENTITIES[blueprint] ?? [];
  }
  const res = await fetch(
    `${baseUrl}/v1/blueprints/${encodeURIComponent(blueprint)}/entities/search`,
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
    throw new Error(`Port API ${res.status}:\n${body}`);
  }
  const data = await res.json();
  return (data.entities ?? []) as PortEntity[];
}
