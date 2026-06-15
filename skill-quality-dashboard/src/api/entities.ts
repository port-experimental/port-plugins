import type { PortEntity } from "../types";

export async function fetchEntities(
  baseUrl: string,
  token: string,
  blueprint: string
): Promise<PortEntity[]> {
  const res = await fetch(
    `${baseUrl}/v1/blueprints/${blueprint}/entities/search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: { combinator: "and", rules: [] } }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Port API ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.entities ?? [];
}
