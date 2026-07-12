import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentFiles, type SkillSearchResult } from "../api/skills";
import type {
  CreateMethod,
  PluginConfig,
  SkillContext,
  SkillDraft,
  SkillGroupOption,
} from "../types";
import { draftFromFiles, draftFromUpload, emptyDraft } from "../utils/draft";
import { AiPrompt } from "./AiPrompt";
import { LoadingState } from "./LoadingState";
import { ErrorBanner } from "./ErrorBanner";
import { ModePicker } from "./ModePicker";
import { SkillRequestForm } from "./SkillRequestForm";
import { SkillSearch } from "./SkillSearch";

type Props = {
  baseUrl: string;
  token: string;
  config: PluginConfig;
  context: SkillContext;
  skillGroups: SkillGroupOption[];
  requesterEmail?: string;
};

type Phase = "choose" | "ai" | "search" | "loading-skill" | "editor";

/**
 * Dashboard state machine:
 * choose → (ai | search | editor)
 * search → loading-skill → editor (update mode)
 * ai → editor (create mode)
 */
export function CreateFlow({
  baseUrl,
  token,
  config,
  context,
  skillGroups,
  requesterEmail,
}: Props) {
  const [phase, setPhase] = useState<Phase>("choose");
  const [draft, setDraft] = useState<SkillDraft | null>(null);
  const [method, setMethod] = useState<CreateMethod>("write");
  const [aiPrompt, setAiPrompt] = useState<string | undefined>();
  const [selectedSkill, setSelectedSkill] = useState<SkillSearchResult | null>(null);
  const [updateContext, setUpdateContext] = useState<SkillContext | null>(null);

  const ctx = { baseUrl, token };

  const filesQuery = useQuery({
    queryKey: ["skill-files-search", selectedSkill?.identifier, token],
    queryFn: () => fetchCurrentFiles(ctx, selectedSkill!.identifier),
    enabled: phase === "loading-skill" && !!selectedSkill,
    staleTime: 60 * 1000,
  });

  const startCreate = (next: SkillDraft, m: CreateMethod, prompt?: string) => {
    setDraft(next);
    setMethod(m);
    setAiPrompt(prompt);
    setUpdateContext(null);
    setPhase("editor");
  };

  const startUpdate = (skill: SkillSearchResult) => {
    setSelectedSkill(skill);
    setPhase("loading-skill");
  };

  // When files finish loading, transition to editor in update mode.
  if (phase === "loading-skill" && selectedSkill) {
    if (filesQuery.isLoading) {
      return (
        <div>
          <LoadingState label={`Loading files for "${selectedSkill.title}"…`} />
        </div>
      );
    }
    if (filesQuery.isError) {
      return (
        <ErrorBanner
          message={
            filesQuery.error instanceof Error
              ? filesQuery.error.message
              : "Failed to load skill files"
          }
          onRetry={() => void filesQuery.refetch()}
        />
      );
    }
    if (filesQuery.data) {
      const currentFiles = filesQuery.data;
      const skillName = selectedSkill.title;
      const updCtx: SkillContext = {
        requestType: "update",
        skillName,
        currentFiles,
        skillGroupId: selectedSkill.groupIds[0],
        location: (selectedSkill.location as "global" | "project") ?? "project",
        skillPath: selectedSkill.identifier,
      };
      // Move to editor on next render.
      if (!updateContext) {
        setUpdateContext(updCtx);
        setDraft(draftFromFiles(skillName, currentFiles));
        setMethod("write");
        setAiPrompt(undefined);
        setPhase("editor");
      }
    }
  }

  if (phase === "ai") {
    return (
      <AiPrompt
        baseUrl={baseUrl}
        token={token}
        config={config}
        onBack={() => setPhase("choose")}
        onGenerated={(d, prompt) => startCreate(d, "ai", prompt)}
      />
    );
  }

  if (phase === "search") {
    return (
      <SkillSearch
        baseUrl={baseUrl}
        token={token}
        config={config}
        onBack={() => setPhase("choose")}
        onSelect={startUpdate}
      />
    );
  }

  if (phase === "editor" && draft) {
    const editorCtx = updateContext ?? context;
    return (
      <SkillRequestForm
        baseUrl={baseUrl}
        token={token}
        config={config}
        context={editorCtx}
        initialDraft={draft}
        createMethod={method}
        aiPrompt={aiPrompt}
        skillGroups={skillGroups}
        requesterEmail={requesterEmail}
        onBack={() => {
          setUpdateContext(null);
          setSelectedSkill(null);
          setPhase("choose");
        }}
      />
    );
  }

  return (
    <ModePicker
      onWrite={() => startCreate(emptyDraft(), "write")}
      onAi={() => setPhase("ai")}
      onUpload={(content, fileName) =>
        startCreate(draftFromUpload(content, deriveName(fileName)), "upload")
      }
      onUpdate={() => setPhase("search")}
    />
  );
}

function deriveName(fileName: string): string {
  const base = fileName.replace(/\.(md|markdown|txt)$/i, "");
  if (!base || base.toLowerCase() === "skill") return "";
  return base;
}
