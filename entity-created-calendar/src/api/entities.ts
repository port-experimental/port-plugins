import type { Entity } from "../types";
import { DEV_MOCK } from "../hooks/usePostMessageData";

export type SearchEntitiesResponse = {
  entities?: Entity[];
  ok?: boolean;
};

const MOCK_ENTITIES: Entity[] = [
  {
    identifier: "svc-alpha",
    title: "Alpha Service",
    createdAt: "2026-05-03T10:00:00.000Z",
  },
  {
    identifier: "svc-beta",
    title: "Beta Service",
    createdAt: "2026-05-03T14:30:00.000Z",
  },
  {
    identifier: "svc-gamma",
    title: "Gamma Service",
    createdAt: "2026-05-12T09:15:00.000Z",
  },
  {
    identifier: "svc-delta",
    title: "Delta Service",
    createdAt: "2026-04-28T16:45:00.000Z",
  },
];

export async function searchBlueprintEntities(
  blueprint: string,
  token: string,
  baseUrl: string
): Promise<Entity[]> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return MOCK_ENTITIES;
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

  const data = (await res.json()) as SearchEntitiesResponse;
  return data.entities ?? [];
}
