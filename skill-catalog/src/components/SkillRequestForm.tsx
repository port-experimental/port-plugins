import React, { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  FileUp,
  PencilLine,
  Send,
  Sparkles,
} from "lucide-react";
import { createSkillRequest } from "../api/skills";
import type {
  CreateMethod,
  PluginConfig,
  SkillContext,
  SkillDraft,
  SkillFile,
  SkillFileType,
  SkillGroupOption,
} from "../types";
import { buildEntityPageUrl } from "../utils/portalUrl";
import {
  defaultPath,
  makeFile,
  skillMdFile,
  toSubmitPayload,
} from "../utils/draft";
import { MarkdownEditor } from "./MarkdownEditor";
import { DiffView } from "./DiffView";
import { FileManager } from "./FileManager";

type Props = {
  baseUrl: string;
  token: string;
  config: PluginConfig;
  context: SkillContext;
  initialDraft: SkillDraft;
  createMethod: CreateMethod;
  aiPrompt?: string;
  skillGroups: SkillGroupOption[];
  requesterEmail?: string;
  onBack?: () => void;
};

type Tab = "edit" | "diff";

const METHOD_BADGE: Record<CreateMethod, { label: string; icon: typeof Sparkles }> = {
  ai: { label: "Drafted with AI", icon: Sparkles },
  write: { label: "Written manually", icon: PencilLine },
  upload: { label: "Uploaded file", icon: FileUp },
};

export function SkillRequestForm({
  baseUrl,
  token,
  config,
  context,
  initialDraft,
  createMethod,
  aiPrompt,
  skillGroups,
  requesterEmail,
  onBack,
}: Props) {
  const isUpdate = context.requestType === "update";

  const [draft, setDraft] = useState<SkillDraft>(initialDraft);
  const [selectedId, setSelectedId] = useState<string>(
    () => skillMdFile(initialDraft).id
  );
  const [changeSummary, setChangeSummary] = useState("");
  const [location, setLocation] = useState(context.location);
  const [skillGroupId, setSkillGroupId] = useState(context.skillGroupId ?? "");
  const [tab, setTab] = useState<Tab>("edit");

  const selected =
    draft.files.find((f) => f.id === selectedId) ?? skillMdFile(draft);

  const baselineByPath = useMemo(() => {
    const map = new Map<string, string>();
    for (const f of context.currentFiles) map.set(f.path, f.content);
    return map;
  }, [context.currentFiles]);

  const mutation = useMutation({
    mutationFn: () =>
      createSkillRequest(
        { baseUrl, token },
        config,
        toSubmitPayload(draft, {
          requestType: context.requestType,
          createMethod,
          aiPrompt,
          changeSummary: changeSummary.trim(),
          location,
          skillGroupId: skillGroupId || undefined,
          requesterEmail,
        })
      ),
  });

  const mdContent = skillMdFile(draft).content;
  const dirty = isUpdate
    ? filesChanged(draft.files, context.currentFiles)
    : mdContent.trim().length > 0;
  const canSubmit =
    draft.skillName.trim().length > 0 &&
    mdContent.trim().length > 0 &&
    dirty &&
    !mutation.isPending;

  const updateSelected = (patch: Partial<SkillFile>) => {
    setDraft((d) => ({
      ...d,
      files: d.files.map((f) => (f.id === selected.id ? { ...f, ...patch } : f)),
    }));
  };

  const addFile = (type: Exclude<SkillFileType, "skill_md">) => {
    const file = makeFile(type, defaultPath(type, draft.files), "");
    setDraft((d) => ({ ...d, files: [...d.files, file] }));
    setSelectedId(file.id);
    setTab("edit");
  };

  const removeFile = (id: string) => {
    setDraft((d) => ({ ...d, files: d.files.filter((f) => f.id !== id) }));
    if (selectedId === id) setSelectedId(skillMdFile(draft).id);
  };

  const createdUrl = useMemo(() => {
    if (!mutation.data?.identifier) return null;
    return buildEntityPageUrl(config.skillRequestBlueprint, mutation.data.identifier);
  }, [mutation.data, config.skillRequestBlueprint]);

  if (mutation.isSuccess) {
    return (
      <div className="success">
        <CheckCircle2 size={28} aria-hidden className="success-icon" />
        <h2 className="success-title">Request submitted for review</h2>
        <p className="muted-block">
          The skill owners have been notified. You can track the status of your
          request below.
        </p>
        {createdUrl && (
          <a className="btn btn-primary" href={createdUrl} target="_blank" rel="noreferrer">
            View request <ExternalLink size={14} aria-hidden />
          </a>
        )}
      </div>
    );
  }

  const Badge = METHOD_BADGE[createMethod];
  const isMd = selected.type === "skill_md";
  const baselineContent = baselineByPath.get(selected.path) ?? "";

  return (
    <form
      className="form"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) mutation.mutate();
      }}
    >
      <div className="form-top">
        {onBack && (
          <button type="button" className="btn btn-ghost back-btn" onClick={onBack}>
            <ArrowLeft size={15} aria-hidden /> Back
          </button>
        )}
        {!isUpdate && (
          <span className="method-badge">
            <Badge.icon size={13} aria-hidden /> {Badge.label}
          </span>
        )}
      </div>

      <div className="field-row">
        <label className="field">
          <span className="field-label">Skill name</span>
          <input
            className="text-input"
            value={draft.skillName}
            onChange={(e) => setDraft((d) => ({ ...d, skillName: e.target.value }))}
            readOnly={isUpdate}
            placeholder="e.g. debug-rider-api"
            required
          />
        </label>

        <label className="field">
          <span className="field-label">Skill group</span>
          <select
            className="text-input"
            value={skillGroupId}
            onChange={(e) => setSkillGroupId(e.target.value)}
          >
            <option value="">Select a group…</option>
            {skillGroups.map((g) => (
              <option key={g.identifier} value={g.identifier}>
                {g.title}
              </option>
            ))}
          </select>
        </label>

        <label className="field field-narrow">
          <span className="field-label">Location</span>
          <select
            className="text-input"
            value={location}
            onChange={(e) => setLocation(e.target.value as "global" | "project")}
          >
            <option value="project">project</option>
            <option value="global">global</option>
          </select>
        </label>
      </div>

      <div className="editor-layout">
        <FileManager
          files={draft.files}
          selectedId={selected.id}
          onSelect={(id) => {
            setSelectedId(id);
            setTab("edit");
          }}
          onAdd={addFile}
          onRemove={removeFile}
        />

        <div className="content-block">
          <div className="content-head">
            {isMd ? (
              <span className="file-path-static">SKILL.md</span>
            ) : (
              <input
                className="file-path-input"
                value={selected.path}
                onChange={(e) => updateSelected({ path: e.target.value })}
                aria-label="File path"
                placeholder="references/example.md"
              />
            )}
            <div className="tabs" role="tablist" aria-label="Content view">
              <button
                type="button"
                role="tab"
                aria-selected={tab === "edit"}
                className={tab === "edit" ? "tab active" : "tab"}
                onClick={() => setTab("edit")}
              >
                Edit
              </button>
              {isUpdate && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={tab === "diff"}
                  className={tab === "diff" ? "tab active" : "tab"}
                  onClick={() => setTab("diff")}
                >
                  Changes
                </button>
              )}
            </div>
          </div>

          {tab === "edit" ? (
            <MarkdownEditor
              key={selected.id}
              value={selected.content}
              onChange={(content) => updateSelected({ content })}
              placeholder={
                isMd
                  ? "Write your SKILL.md content here…"
                  : `Contents of ${selected.path || "this file"}…`
              }
              ariaLabel={selected.path || "file content"}
            />
          ) : (
            <DiffView oldText={baselineContent} newText={selected.content} />
          )}
        </div>
      </div>

      <label className="field">
        <span className="field-label">
          What changed?{!isUpdate && <span className="optional"> (optional)</span>}
        </span>
        <input
          className="text-input"
          value={changeSummary}
          onChange={(e) => setChangeSummary(e.target.value)}
          placeholder={
            isUpdate
              ? "Briefly describe your update for the reviewer"
              : "Briefly describe what this skill does"
          }
        />
      </label>

      {mutation.isError && (
        <p className="inline-error" role="alert">
          {mutation.error instanceof Error
            ? mutation.error.message
            : "Failed to submit request"}
        </p>
      )}

      <div className="actions-bar">
        {!dirty && isUpdate && (
          <span className="muted-inline">Make an edit to enable submission.</span>
        )}
        <button type="submit" className="btn btn-primary" disabled={!canSubmit}>
          <Send size={15} aria-hidden />
          {mutation.isPending ? "Submitting…" : "Submit for review"}
        </button>
      </div>
    </form>
  );
}

/** True if the editable files differ from the baseline (content, additions, removals). */
function filesChanged(current: SkillFile[], baseline: SkillFile[]): boolean {
  const norm = (fs: SkillFile[]) =>
    fs
      .filter((f) => f.type === "skill_md" || f.content.trim().length > 0)
      .map((f) => `${f.path}\u0000${f.content}`)
      .sort();
  const a = norm(current);
  const b = norm(baseline);
  if (a.length !== b.length) return true;
  return a.some((v, i) => v !== b[i]);
}
