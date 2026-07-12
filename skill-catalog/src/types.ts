export type ParamValue = {
  type?: string;
  value?: unknown;
  identifier?: string;
};

export type Params = Record<string, ParamValue | undefined>;

export type Page = {
  identifier?: string;
  pageFilters?: unknown;
};

export type User = {
  firstName?: string;
  lastName?: string;
  email?: string;
  picture?: string;
};

export type Entity = {
  identifier: string;
  title?: string;
  icon?: string;
  blueprint?: string;
  properties?: Record<string, unknown>;
  relations?: Record<string, unknown>;
};

/** A `blueprint` param is delivered as an object, not a raw string. */
export type BlueprintParam = { identifier: string; title?: string };

/**
 * Derived from upload-params.json.
 * Blueprint identifiers for the rest of the skill model (skill_version,
 * skill_file) are fixed code constants — see constants.ts and README.
 */
export type PluginConfig = {
  skillRequestBlueprint: string;
  skillBlueprint: string;
  skillGroupBlueprint: string;
  /** Optional: route AI drafting through a specific agent instead of /v1/ai/invoke. */
  aiAgentIdentifier: string;
};

export type RequestType = "create" | "update";

/** How the author produced the draft. */
export type CreateMethod = "ai" | "write" | "upload";

/** A file's role within a skill. SKILL.md is the primary "skill_md" file. */
export type SkillFileType =
  | "skill_md"
  | "reference"
  | "script"
  | "asset"
  | "other";

export type SkillFile = {
  /** Stable client id for list keys / selection. */
  id: string;
  path: string;
  content: string;
  type: SkillFileType;
  /** Port entity identifier of this skill_file (set in update mode, empty for new files). */
  entityId?: string;
};

/** Full editable skill: the SKILL.md plus any supporting files. */
export type SkillDraft = {
  skillName: string;
  files: SkillFile[];
};

export type SkillGroupOption = {
  identifier: string;
  title: string;
};

/** Minimal Port entity shape returned by search/get. */
export type PortEntity = {
  identifier: string;
  title?: string;
  blueprint?: string;
  properties?: Record<string, unknown>;
  relations?: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type SkillContext = {
  /** "create" on a dashboard, "update" on a skill entity page. */
  requestType: RequestType;
  skillName: string;
  /** Existing files (update mode) — SKILL.md first, then supporting files. */
  currentFiles: SkillFile[];
  /** Pre-selected skill group (inherited from the skill in update mode). */
  skillGroupId?: string;
  location: "global" | "project";
  /** Path of the existing skill (gitlab path or port URI). */
  skillPath?: string;
};

export type SubmitPayload = {
  requestType: RequestType;
  createMethod: CreateMethod;
  aiPrompt?: string;
  skillName: string;
  /** SKILL.md content. */
  content: string;
  /** Supporting files (everything except SKILL.md). */
  files: { path: string; content: string; type: Exclude<SkillFileType, "skill_md"> }[];
  changeSummary: string;
  location: "global" | "project";
  skillGroupId?: string;
  /** Identifiers of the existing skill_file entities being updated. */
  targetSkillFileIds: string[];
  requesterEmail?: string;
};

/** Structured result the AI returns when drafting a skill. */
export type AiSkillDraft = {
  skill_name?: string;
  skill_md?: string;
  files?: { path?: string; content?: string; type?: string }[];
};

/** Progress callback payload while streaming an AI invocation. */
export type AiProgress = {
  kind: "status" | "tool" | "text";
  text: string;
};
