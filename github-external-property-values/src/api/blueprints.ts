import type { BlueprintSchema } from "../types";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_BLUEPRINTS } from "../dev/mockData";

/**
 * GET /v1/blueprints/{id} — used to inspect the *target* blueprint's schema
 * (properties, mirrorProperties, relations) so the widget can decide, per
 * blueprint, whether org-filtering uses a `github_org` property or an
 * `organization` relation. See README "How org filtering is resolved".
 */
export async function fetchBlueprint(
  token: string,
  portApiBaseUrl: string | null,
  blueprintId: string
): Promise<BlueprintSchema> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    const mock = MOCK_BLUEPRINTS[blueprintId];
    if (!mock) throw new Error(`Port API 404:\nBlueprint not found: ${blueprintId}`);
    return mock;
  }

  const res = await fetch(
    `${portApiBaseUrl}/v1/blueprints/${encodeURIComponent(blueprintId)}`,
    {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Port API ${res.status}:\n${body}`);
  }
  const data = await res.json();
  return (data.blueprint ?? data) as BlueprintSchema;
}
