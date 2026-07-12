/**
 * Fixed blueprint identifiers for the skill model (live in Port).
 *
 * These are stable in this org's catalog and are not exposed as params
 * (documented in README → Prerequisites). The three blueprints an operator
 * can re-point live in upload-params.json (skill_request, skill, skill_group).
 */
export const SKILL_VERSION_BLUEPRINT = "skillVersion";
export const SKILL_FILE_BLUEPRINT = "skillFile";

/** Relation on skillFile → skillVersion. */
export const REL_FILE_TO_VERSION = "skillVersion";

/** Relation on skillVersion → skill. */
export const REL_VERSION_TO_SKILL = "skill";

/** Relation keys on skill_request. */
export const REL_TARGET_SKILL_FILES = "target_skill_files";
export const REL_SKILL_GROUP = "skill_group";
export const REL_REQUESTER = "requester";

/** Relation key on skill → skill_group (many). */
export const REL_SKILL_TO_GROUP = "skill_to_skill_group";

/** Default fallbacks for the configurable blueprint params. */
export const DEFAULT_SKILL_REQUEST_BLUEPRINT = "skill_request";
export const DEFAULT_SKILL_BLUEPRINT = "skill";
export const DEFAULT_SKILL_GROUP_BLUEPRINT = "skill_group";

/** Human labels + default folder for each supporting-file type. */
export const FILE_TYPE_META: Record<
  "reference" | "script" | "asset" | "other",
  { label: string; plural: string; folder: string }
> = {
  reference: { label: "Reference", plural: "References", folder: "references" },
  script: { label: "Script", plural: "Scripts", folder: "scripts" },
  asset: { label: "Asset", plural: "Assets", folder: "assets" },
  other: { label: "Other", plural: "Other files", folder: "" },
};

/**
 * JSON Schema handed to Port AI so it returns a structured skill draft instead
 * of free-form text. See README → "Create with AI".
 */
export const AI_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    skill_name: {
      type: "string",
      description: "Short kebab-case name for the skill, e.g. 'deploy-staging'",
    },
    skill_md: {
      type: "string",
      description:
        "The full SKILL.md content, including YAML frontmatter (name + description) and a markdown body.",
    },
    files: {
      type: "array",
      description:
        "Optional supporting files: references, scripts, or assets the skill needs.",
      items: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description:
              "Relative path inside the skill, e.g. 'references/api.md' or 'scripts/run.sh'",
          },
          content: { type: "string" },
          type: {
            type: "string",
            enum: ["reference", "script", "asset", "other"],
          },
        },
        required: ["path", "content", "type"],
      },
    },
  },
  required: ["skill_name", "skill_md"],
} as const;

export const AI_SYSTEM_PROMPT = `You are a skill authoring assistant for an AI coding agent platform.
A "skill" is a reusable instruction package: a SKILL.md file (with YAML frontmatter containing 'name' and 'description', followed by a markdown body) plus optional supporting files grouped as references, scripts, or assets.
Write a clear, well-scoped SKILL.md whose description states exactly when the agent should use the skill. Keep instructions concrete and actionable.
Only create supporting files when they genuinely help (e.g. a reference doc the body links to, or a helper script). Return your answer using the provided output schema.`;

/** Restrict the tools the AI may call while drafting (read-only catalog lookups). */
export const AI_TOOLS = ["^(list|search|describe|get)_.*"];

/** Starter SKILL.md scaffold for brand-new skills. */
export const SKILL_TEMPLATE = `---
name: my-new-skill
description: >-
  One or two sentences describing what this skill does and when the model
  should use it. Be specific about triggers and scope.
---

# My New Skill

## When to use this skill

Describe the situations where this skill applies.

## Steps

1. First step
2. Second step
3. Third step

## Notes

Any caveats, constraints, or links to references.
`;
