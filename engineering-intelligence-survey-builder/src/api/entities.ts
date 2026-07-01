import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_SURVEYS } from "../dev/mockData";
import { normalizeDefinition } from "../surveys/registry";
import { definitionFromDraft } from "../utils/draft";
import type { Entity, SurveyDraft, SurveyRow } from "../types";
import { FRAMEWORKS } from "../types";
import { delay, portFetch, type PortCtx } from "./portFetch";

const FRAMEWORK_ENUM = new Set<string>(FRAMEWORKS);

/** All survey entities (any status) for the dashboard list. */
export async function searchSurveys(
  ctx: PortCtx,
  surveyBlueprint: string
): Promise<Entity[]> {
  if (DEV_MOCK) {
    await delay();
    return MOCK_SURVEYS;
  }
  const data = await portFetch<{ entities: Entity[] }>(
    ctx,
    `/v1/blueprints/${encodeURIComponent(surveyBlueprint)}/entities`,
    { method: "GET" }
  );
  return data.entities ?? [];
}

/** Fetch one survey entity (used when editing an existing survey). */
export async function getSurvey(
  ctx: PortCtx,
  surveyBlueprint: string,
  identifier: string
): Promise<Entity | null> {
  if (DEV_MOCK) {
    await delay();
    return MOCK_SURVEYS.find((s) => s.identifier === identifier) ?? null;
  }
  const data = await portFetch<{ entity: Entity }>(
    ctx,
    `/v1/blueprints/${encodeURIComponent(surveyBlueprint)}/entities/${encodeURIComponent(
      identifier
    )}`,
    { method: "GET" }
  );
  return data.entity ?? null;
}

/** Create or update a survey entity from the working draft. */
export async function saveSurvey(
  ctx: PortCtx,
  surveyBlueprint: string,
  draft: SurveyDraft
): Promise<Entity> {
  // For new surveys (no entityId yet) append a timestamp so two surveys with
  // the same title don't collide and overwrite each other via upsert.
  const identifier = draft.entityId
    ?? `${draft.title.trim() || "survey"}-${Date.now().toString(36)}`;
  const safeId = toIdentifier(identifier);
  const definition = definitionFromDraft(draft, safeId);

  const body: Record<string, unknown> = {
    identifier: safeId,
    title: draft.title.trim() || safeId,
    properties: {
      framework: FRAMEWORK_ENUM.has(draft.framework) ? draft.framework : "custom",
      status: draft.status,
      cadence: draft.cadence,
      ...(draft.description.trim() ? { description: draft.description.trim() } : {}),
      definition,
      // Set publishedAt the first time the survey goes active; preserve on re-publish.
      // Never write publishedAt for drafts - clones would otherwise inherit the
      // original's publish date even before being published themselves.
      ...(draft.status === "active" && !draft.publishedAt
        ? { publishedAt: new Date().toISOString() }
        : draft.status === "active" && draft.publishedAt
          ? { publishedAt: draft.publishedAt }
          : {}),
    },
  };

  if (DEV_MOCK) {
    await delay();
    return { ...body, blueprint: surveyBlueprint } as Entity;
  }

  const data = await portFetch<{ entity: Entity }>(
    ctx,
    `/v1/blueprints/${encodeURIComponent(surveyBlueprint)}/entities?upsert=true&merge=true`,
    { method: "POST", body: JSON.stringify(body) }
  );
  return data.entity;
}

/** Delete a survey entity. */
export async function deleteSurvey(
  ctx: PortCtx,
  surveyBlueprint: string,
  identifier: string,
  cascade = false
): Promise<void> {
  if (DEV_MOCK) {
    await delay();
    return;
  }
  // delete_dependents=true also removes related entities (e.g. responses). Port
  // refuses a plain delete when dependents exist, so we only cascade on demand.
  const qs = cascade ? "?delete_dependents=true" : "";
  await portFetch<unknown>(
    ctx,
    `/v1/blueprints/${encodeURIComponent(surveyBlueprint)}/entities/${encodeURIComponent(
      identifier
    )}${qs}`,
    { method: "DELETE" }
  );
}

/** Project a survey entity into a compact list row. */
export function toSurveyRow(e: Entity): SurveyRow {
  const p = e.properties ?? {};
  const def = normalizeDefinition(p.definition);
  const description =
    typeof p.description === "string" && p.description.trim()
      ? p.description
      : def?.description;
  return {
    identifier: e.identifier,
    title: e.title || e.identifier,
    description,
    framework: (typeof p.framework === "string" && p.framework !== "custom")
      ? p.framework
      : def?.framework || "custom",
    version: def?.version,
    status: typeof p.status === "string" ? p.status : undefined,
    cadence: typeof p.cadence === "string" ? p.cadence : undefined,
    questionCount: def?.questions.length,
    dimensionCount: def?.dimensions.length,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
    publishedAt: typeof p.publishedAt === "string" ? p.publishedAt : undefined,
  };
}

/** Port identifiers allow [A-Za-z0-9@_.:\\/=-]; coerce a title into a safe slug. */
function toIdentifier(raw: string): string {
  const cleaned = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_.:/=@-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return cleaned || `survey-${Date.now().toString(36)}`;
}
