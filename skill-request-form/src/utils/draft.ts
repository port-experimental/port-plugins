import { FILE_TYPE_META, SKILL_TEMPLATE } from "../constants";
import type {
  AiSkillDraft,
  SkillDraft,
  SkillFile,
  SkillFileType,
  SubmitPayload,
} from "../types";

let idCounter = 0;
export function makeId(): string {
  idCounter += 1;
  return `f${Date.now().toString(36)}-${idCounter}`;
}

const SKILL_MD_PATH = "SKILL.md";

export function isSkillMd(file: SkillFile): boolean {
  return file.type === "skill_md";
}

/** The SKILL.md file in a draft (always present; created if missing). */
export function skillMdFile(draft: SkillDraft): SkillFile {
  return draft.files.find(isSkillMd) ?? makeFile("skill_md", SKILL_MD_PATH, "");
}

export function makeFile(
  type: SkillFileType,
  path: string,
  content: string
): SkillFile {
  return { id: makeId(), type, path, content };
}

/** Infer a file's role from its path. */
export function classifyPath(path: string): SkillFileType {
  const lower = path.toLowerCase();
  if (lower.endsWith("skill.md")) return "skill_md";
  if (lower.includes("/references/") || lower.startsWith("references/")) return "reference";
  if (lower.includes("/scripts/") || lower.startsWith("scripts/")) return "script";
  if (lower.includes("/assets/") || lower.startsWith("assets/")) return "asset";
  return "other";
}

/** A fresh draft for the "write it" path: SKILL.md seeded with the template. */
export function emptyDraft(skillName = ""): SkillDraft {
  return {
    skillName,
    files: [makeFile("skill_md", SKILL_MD_PATH, SKILL_TEMPLATE)],
  };
}

/** Build a draft from an uploaded SKILL.md string. */
export function draftFromUpload(content: string, skillName = ""): SkillDraft {
  return {
    skillName,
    files: [makeFile("skill_md", SKILL_MD_PATH, content)],
  };
}

/** Build an editable draft from existing skill_file entities (update mode). */
export function draftFromFiles(skillName: string, files: SkillFile[]): SkillDraft {
  const cloned = files.map((f) => ({ ...f, id: makeId() }));
  if (!cloned.some(isSkillMd)) {
    cloned.unshift(makeFile("skill_md", SKILL_MD_PATH, SKILL_TEMPLATE));
  }
  return { skillName, files: cloned };
}

/** Map a Port AI structured response into an editable draft. */
export function draftFromAi(ai: AiSkillDraft): SkillDraft {
  const files: SkillFile[] = [
    makeFile("skill_md", SKILL_MD_PATH, ai.skill_md ?? SKILL_TEMPLATE),
  ];
  for (const f of ai.files ?? []) {
    if (!f?.content) continue;
    const type = normalizeType(f.type);
    files.push(makeFile(type, f.path?.trim() || defaultPath(type, files), f.content));
  }
  return { skillName: ai.skill_name?.trim() ?? "", files };
}

/** Suggest a path for a newly added supporting file of a given type. */
export function defaultPath(
  type: Exclude<SkillFileType, "skill_md">,
  existing: SkillFile[]
): string {
  const folder = FILE_TYPE_META[type].folder;
  const count = existing.filter((f) => f.type === type).length + 1;
  const ext = type === "script" ? "sh" : type === "asset" ? "txt" : "md";
  const base = `${FILE_TYPE_META[type].label.toLowerCase()}-${count}.${ext}`;
  return folder ? `${folder}/${base}` : base;
}

function normalizeType(raw: string | undefined): Exclude<SkillFileType, "skill_md"> {
  switch (raw) {
    case "reference":
    case "script":
    case "asset":
      return raw;
    default:
      return "other";
  }
}

/** Convert a draft + form fields into the entity-creation payload. */
export function toSubmitPayload(
  draft: SkillDraft,
  base: Omit<SubmitPayload, "content" | "files" | "skillName" | "targetSkillFileIds">
): SubmitPayload {
  const md = skillMdFile(draft);
  const files = draft.files
    .filter((f) => !isSkillMd(f) && f.content.trim().length > 0)
    .map((f) => ({
      path: f.path.trim(),
      content: f.content,
      type: f.type as Exclude<SkillFileType, "skill_md">,
    }));

  const targetSkillFileIds = draft.files
    .filter((f) => !!f.entityId)
    .map((f) => f.entityId as string);

  return {
    ...base,
    skillName: draft.skillName.trim(),
    content: md.content,
    files,
    targetSkillFileIds,
  };
}
