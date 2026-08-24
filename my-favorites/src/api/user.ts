import { DEV_MOCK } from "../hooks/usePostMessageData";
import { getMockUserEntity, setMockUserEntityProperties } from "../dev/mockData";
import type { PortEntity } from "../types";

export async function fetchUserEntity(
  baseUrl: string,
  token: string,
  email: string
): Promise<PortEntity | null> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return getMockUserEntity();
  }
  const res = await fetch(
    `${baseUrl}/v1/blueprints/_user/entities/${encodeURIComponent(email)}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Port API ${res.status}:\n${body}`);
  }
  const data = await res.json();
  return (data.entity as PortEntity) ?? null;
}

export async function patchUserEntityProperties(
  baseUrl: string,
  token: string,
  userIdentifier: string,
  properties: Record<string, unknown>
): Promise<void> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    setMockUserEntityProperties(properties);
    return;
  }
  const res = await fetch(
    `${baseUrl}/v1/blueprints/_user/entities/${encodeURIComponent(userIdentifier)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties }),
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Port API ${res.status}:\n${body}`);
  }
}
