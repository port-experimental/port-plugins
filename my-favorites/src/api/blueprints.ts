import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_BLUEPRINTS } from "../dev/mockData";
import type { PortBlueprint } from "../types";

// System blueprint identifiers to exclude from the entity picker.
const SYSTEM_BLUEPRINT_PREFIXES = ["_"];

export async function fetchBlueprints(
  baseUrl: string,
  token: string
): Promise<PortBlueprint[]> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_BLUEPRINTS;
  }
  const res = await fetch(`${baseUrl}/v1/blueprints`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Port API ${res.status}:\n${body}`);
  }
  const data = await res.json();
  const all = (data.blueprints ?? []) as PortBlueprint[];
  return all.filter(
    (bp) =>
      !SYSTEM_BLUEPRINT_PREFIXES.some((prefix) =>
        bp.identifier.startsWith(prefix)
      )
  );
}
