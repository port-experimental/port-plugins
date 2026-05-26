import { parsePortError } from "./portError";
import type { BlueprintSchema } from "../types";
import { COMMENT_BLUEPRINT } from "../types";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import { normalizeBlueprintResponse } from "../utils/blueprintResponse";

const MOCK_BLUEPRINT: BlueprintSchema = {
  identifier: COMMENT_BLUEPRINT,
  title: "Entity Comment",
  relations: {
    parentComment: {
      target: "entityComment",
      required: false,
      many: false,
    },
    service: {
      target: "service",
      required: false,
      many: false,
    },
  },
};

export async function fetchBlueprint(
  baseUrl: string,
  token: string,
  identifier: string
): Promise<BlueprintSchema> {
  if (DEV_MOCK) return MOCK_BLUEPRINT;

  const res = await fetch(
    `${baseUrl}/v1/blueprints/${encodeURIComponent(identifier)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) await parsePortError(res);
  return normalizeBlueprintResponse(await res.json());
}
