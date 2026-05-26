import type { BlueprintSchema } from "../types";

type WrappedBlueprint = {
  ok?: boolean;
  blueprint?: BlueprintSchema;
  identifier?: string;
  relations?: BlueprintSchema["relations"];
};

/** Port GET /v1/blueprints/{id} may return the blueprint at the root or under `blueprint`. */
export function normalizeBlueprintResponse(data: unknown): BlueprintSchema {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid blueprint response from Port API");
  }

  const record = data as WrappedBlueprint;
  const inner = record.blueprint;

  if (inner && typeof inner === "object") {
    return {
      ...inner,
      identifier: inner.identifier ?? record.identifier ?? "",
      relations: inner.relations ?? record.relations,
    };
  }

  return record as BlueprintSchema;
}
