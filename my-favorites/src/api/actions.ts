import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_ACTIONS } from "../dev/mockData";
import type { PortAction } from "../types";

export async function fetchActions(
  baseUrl: string,
  token: string
): Promise<PortAction[]> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_ACTIONS;
  }
  const res = await fetch(`${baseUrl}/v1/actions?version=v2&trigger_type=self-service`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Port API ${res.status}:\n${body}`);
  }
  const data = await res.json();
  return (data.actions ?? []) as PortAction[];
}
