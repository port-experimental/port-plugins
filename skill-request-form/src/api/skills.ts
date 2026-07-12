import { DEV_MOCK } from "../hooks/usePostMessageData";
import {
  REL_FILE_TO_VERSION,
  REL_REQUESTER,
  REL_SKILL_GROUP,
  REL_TARGET_SKILL_FILES,
  REL_VERSION_TO_SKILL,
  SKILL_FILE_BLUEPRINT,
  SKILL_VERSION_BLUEPRINT,
} from "../constants";
import type {
  PluginConfig,
  PortEntity,
  SkillFile,
  SkillGroupOption,
  SubmitPayload,
} from "../types";
import { MOCK_CURRENT_FILES, MOCK_SKILL_GROUPS, MOCK_SKILL_SEARCH_RESULTS } from "../dev/mockData";
import { classifyPath, makeId } from "../utils/draft";

/** Minimal shape returned by skill search. */
export type SkillSearchResult = {
  identifier: string;
  title: string;
  location?: string;
  groupIds: string[];
};

type ApiContext = {
  baseUrl: string;
  token: string;
};

async function searchEntities(
  ctx: ApiContext,
  blueprint: string,
  rules: unknown[]
): Promise<PortEntity[]> {
  const res = await fetch(
    `${ctx.baseUrl}/v1/blueprints/${encodeURIComponent(blueprint)}/entities/search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ctx.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: { combinator: "and", rules } }),
    }
  );

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Port API ${res.status}:\n${body}`);
  }

  const data = await res.json();
  return (data.entities ?? []) as PortEntity[];
}

/** All skill groups, for the group picker. */
export async function fetchSkillGroups(
  ctx: ApiContext,
  config: PluginConfig
): Promise<SkillGroupOption[]> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    return MOCK_SKILL_GROUPS;
  }

  const entities = await searchEntities(ctx, config.skillGroupBlueprint, []);
  return entities
    .map((e) => ({ identifier: e.identifier, title: e.title ?? e.identifier }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

/** Search skills by title substring. Returns up to 20 results. */
export async function fetchSkillsBySearch(
  ctx: ApiContext,
  config: PluginConfig,
  query: string
): Promise<SkillSearchResult[]> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    const q = query.toLowerCase();
    return MOCK_SKILL_SEARCH_RESULTS.filter(
      (s) => s.title.toLowerCase().includes(q) || s.identifier.toLowerCase().includes(q)
    );
  }

  const rules: unknown[] = query.trim()
    ? [{ property: "$title", operator: "contains", value: query.trim() }]
    : [];

  const entities = await searchEntities(ctx, config.skillBlueprint, rules);
  return entities.slice(0, 20).map((e) => ({
    identifier: e.identifier,
    title: e.title ?? e.identifier,
    location: e.properties?.location as string | undefined,
    groupIds: extractRelationIds(e.relations?.skill_to_skill_group),
  }));
}

function extractRelationIds(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value) return [value];
  return [];
}

/**
 * All current files for an existing skill, traversed as:
 *   skill ← skill_version (via skill_version_to_skill) ← skill_file (via skill_file_to_skill_version)
 *
 * Every file in the skill bundle (SKILL.md, references, scripts, assets, etc.)
 * is a `skill_file` entity with `path` and `content`. Returns them with
 * SKILL.md first, classified by path.
 */
export async function fetchCurrentFiles(
  ctx: ApiContext,
  skillId: string
): Promise<SkillFile[]> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    return MOCK_CURRENT_FILES;
  }

  // 1. Find all versions pointing at this skill.
  const versions = await searchEntities(ctx, SKILL_VERSION_BLUEPRINT, [
    {
      relation: REL_VERSION_TO_SKILL,
      operator: "=",
      value: skillId,
    },
  ]);
  if (versions.length === 0) return [];

  // 2. Pick the latest version.
  const latestVersion = pickLatest(versions);

  // 3. Get ALL skill_file entities attached to that version.
  const fileEntities = await searchEntities(ctx, SKILL_FILE_BLUEPRINT, [
    {
      relation: REL_FILE_TO_VERSION,
      operator: "=",
      value: latestVersion.identifier,
    },
  ]);

  // 4. Map to SkillFile and sort: SKILL.md first, then alphabetically.
  const files: SkillFile[] = fileEntities.map((f) => {
    const path = String(f.properties?.path ?? f.title ?? "");
    const content = String(f.properties?.content ?? "");
    return { id: makeId(), path, content, type: classifyPath(path), entityId: f.identifier };
  });

  return files.sort((a, b) => {
    if (a.type === "skill_md") return -1;
    if (b.type === "skill_md") return 1;
    return a.path.localeCompare(b.path);
  });
}

function pickLatest(versions: PortEntity[]): PortEntity {
  return [...versions].sort((a, b) => {
    const av = String(a.properties?.version ?? a.createdAt ?? "");
    const bv = String(b.properties?.version ?? b.createdAt ?? "");
    return bv.localeCompare(av);
  })[0];
}

/** Create a skill_request entity. Workflow finalizes downstream fields on approval. */
export async function createSkillRequest(
  ctx: ApiContext,
  config: PluginConfig,
  payload: SubmitPayload
): Promise<{ identifier: string }> {
  const now = new Date().toISOString();

  const relations: Record<string, string | string[]> = {};
  if (payload.skillGroupId) relations[REL_SKILL_GROUP] = payload.skillGroupId;
  if (payload.requestType === "update" && payload.targetSkillFileIds.length > 0) {
    relations[REL_TARGET_SKILL_FILES] = payload.targetSkillFileIds;
  }
  if (payload.requesterEmail) relations[REL_REQUESTER] = payload.requesterEmail;

  const properties: Record<string, unknown> = {
    request_type: payload.requestType,
    status: "pending_review",
    skill_name: payload.skillName,
    skill_content: payload.content,
    files: payload.files,
    create_method: payload.createMethod,
    change_summary: payload.changeSummary,
    location: payload.location,
    source: "port_ui",
    version: now,
    submitted_at: now,
  };
  if (payload.aiPrompt) properties.ai_prompt = payload.aiPrompt;

  const body = {
    title: `${payload.requestType === "create" ? "New" : "Update"}: ${payload.skillName}`,
    properties,
    relations,
  };

  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 250));
    return { identifier: `mock-skill-request-${Date.now()}` };
  }

  const res = await fetch(
    `${ctx.baseUrl}/v1/blueprints/${encodeURIComponent(
      config.skillRequestBlueprint
    )}/entities?upsert=true&create_missing_related_entities=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ctx.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Port API ${res.status}:\n${text}`);
  }

  const data = await res.json();
  return { identifier: data?.entity?.identifier ?? "" };
}
