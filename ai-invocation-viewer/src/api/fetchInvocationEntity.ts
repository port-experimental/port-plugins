import type { Entity } from "../types";

const INVOCATION_BLUEPRINT = "_ai_invocations";

export async function fetchInvocationEntity(
  baseUrl: string,
  token: string,
  identifier: string
): Promise<Entity> {
  const res = await fetch(
    `${baseUrl}/v1/blueprints/${encodeURIComponent(INVOCATION_BLUEPRINT)}/entities/${encodeURIComponent(identifier)}`,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to load invocation (${res.status}): ${body}`);
  }

  const json = (await res.json()) as { entity?: Entity };
  if (!json.entity?.identifier) {
    throw new Error("Invocation entity missing from Port API response");
  }

  return {
    ...json.entity,
    blueprint: json.entity.blueprint ?? INVOCATION_BLUEPRINT,
  };
}
