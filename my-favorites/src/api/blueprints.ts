import { DEV_MOCK } from "../hooks/usePostMessageData";
import type { PortBlueprintSummary } from "../types";
import { MOCK_BLUEPRINTS } from "../dev/mockData";
import { portFetch } from "./portFetch";

type BlueprintsResponse = {
  blueprints?: PortBlueprintSummary[];
};

export async function fetchBlueprints(
  baseUrl: string,
  token: string
): Promise<PortBlueprintSummary[]> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 120));
    return MOCK_BLUEPRINTS;
  }

  const data = await portFetch<BlueprintsResponse>(baseUrl, token, "/v1/blueprints");
  return (data.blueprints ?? [])
    .filter((bp) => !bp.identifier.startsWith("_"))
    .sort((a, b) => a.title.localeCompare(b.title));
}
