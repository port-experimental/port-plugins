import { DEV_MOCK } from "../hooks/usePostMessageData";

export type SkillFile = {
  path: string;
  content: string;
  type: "skill_md" | "reference" | "script" | "asset" | "other";
};

type ApiContext = { baseUrl: string; token: string };

const SKILL_VERSION_BLUEPRINT = "_skill_version";
const SKILL_FILE_BLUEPRINT = "_skill_file";
const REL_VERSION_TO_SKILL = "skill_version_to_skill";
const REL_FILE_TO_VERSION = "skill_file_to_skill_version";

type PortEntity = {
  identifier: string;
  title?: string;
  properties?: Record<string, unknown>;
  createdAt?: string;
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
  if (!res.ok) throw new Error(`Port API ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  return (data.entities ?? []) as PortEntity[];
}

function classifyPath(path: string): SkillFile["type"] {
  const p = path.toLowerCase();
  if (p.endsWith("skill.md")) return "skill_md";
  if (p.includes("/references/") || p.startsWith("references/")) return "reference";
  if (p.includes("/scripts/") || p.startsWith("scripts/")) return "script";
  if (p.includes("/assets/") || p.startsWith("assets/")) return "asset";
  return "other";
}

function pickLatest(versions: PortEntity[]): PortEntity {
  return [...versions].sort((a, b) => {
    const av = String(a.properties?.version ?? a.createdAt ?? "");
    const bv = String(b.properties?.version ?? b.createdAt ?? "");
    return bv.localeCompare(av);
  })[0];
}

const MOCK_CONTENT = `---
name: example-skill
description: >-
  Example skill loaded in dev mode.
---

# Example Skill

## When to use

Use this skill as a placeholder when developing the view widget locally.

## Steps

1. Step one
2. Step two
3. Step three
`;

export async function fetchSkillFiles(
  ctx: ApiContext,
  skillId: string
): Promise<SkillFile[]> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return [{ path: "SKILL.md", content: MOCK_CONTENT, type: "skill_md" }];
  }

  const versions = await searchEntities(ctx, SKILL_VERSION_BLUEPRINT, [
    { relation: REL_VERSION_TO_SKILL, operator: "=", value: skillId },
  ]);
  if (versions.length === 0) return [];

  const latest = pickLatest(versions);

  const fileEntities = await searchEntities(ctx, SKILL_FILE_BLUEPRINT, [
    { relation: REL_FILE_TO_VERSION, operator: "=", value: latest.identifier },
  ]);

  const files: SkillFile[] = fileEntities.map((f) => ({
    path: String(f.properties?.path ?? f.title ?? ""),
    content: String(f.properties?.content ?? ""),
    type: classifyPath(String(f.properties?.path ?? f.title ?? "")),
  }));

  return files.sort((a, b) => {
    if (a.type === "skill_md") return -1;
    if (b.type === "skill_md") return 1;
    return a.path.localeCompare(b.path);
  });
}
