import { DEV_MOCK } from "../hooks/usePostMessageData";
import type { Entity } from "../types";
import { portFetch } from "./portFetch";

function pickEntityPayload(data: Record<string, unknown>): Record<string, unknown> {
  if (data.entity && typeof data.entity === "object") {
    return data.entity as Record<string, unknown>;
  }
  return data;
}

export async function fetchBlueprintEntity(
  baseUrl: string,
  token: string,
  blueprint: string,
  identifier: string
): Promise<Entity> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 120));
    return {
      identifier,
      blueprint,
      title: identifier,
      relations: { repository: "Node" },
    };
  }

  const path = `/v1/blueprints/${encodeURIComponent(blueprint)}/entities/${encodeURIComponent(identifier)}`;
  const response = await portFetch(baseUrl, token, path, {
    method: "GET",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Failed to load entity (${response.status}):\n${errorBody}`
    );
  }

  const data = (await response.json()) as Record<string, unknown>;
  const e = pickEntityPayload(data);

  return {
    identifier: String(e.identifier ?? identifier),
    blueprint: String(e.blueprint ?? blueprint),
    title: typeof e.title === "string" ? e.title : undefined,
    properties:
      e.properties && typeof e.properties === "object"
        ? (e.properties as Record<string, unknown>)
        : undefined,
    relations:
      e.relations && typeof e.relations === "object"
        ? (e.relations as Record<string, unknown>)
        : undefined,
  };
}
