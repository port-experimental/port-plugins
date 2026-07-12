import React from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { fetchCurrentFiles } from "../api/skills";
import type { PluginConfig, SkillContext, SkillGroupOption } from "../types";
import { draftFromFiles } from "../utils/draft";
import { LoadingState } from "./LoadingState";
import { ErrorBanner } from "./ErrorBanner";
import { SkillRequestForm } from "./SkillRequestForm";

type SkillRef = {
  identifier: string;
  title: string;
  location?: string;
  groupId?: string;
};

type Props = {
  baseUrl: string;
  token: string;
  config: PluginConfig;
  skill: SkillRef;
  skillGroups: SkillGroupOption[];
  requesterEmail?: string;
  onClose: () => void;
};

export function UpdateFlow({
  baseUrl,
  token,
  config,
  skill,
  skillGroups,
  requesterEmail,
  onClose,
}: Props) {
  const ctx = { baseUrl, token };

  const filesQuery = useQuery({
    queryKey: ["skill-files-catalog", skill.identifier, token],
    queryFn: () => fetchCurrentFiles(ctx, skill.identifier),
    staleTime: 60 * 1000,
  });

  if (filesQuery.isLoading) {
    return (
      <div className="modal-inner">
        <div className="modal-inner-header">
          <span />
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <X size={18} aria-hidden />
          </button>
        </div>
        <LoadingState label={`Loading files for "${skill.title}"…`} />
      </div>
    );
  }

  if (filesQuery.isError) {
    return (
      <div className="modal-inner">
        <div className="modal-inner-header">
          <span />
          <button type="button" className="modal-close" aria-label="Close" onClick={onClose}>
            <X size={18} aria-hidden />
          </button>
        </div>
        <ErrorBanner
          message={
            filesQuery.error instanceof Error
              ? filesQuery.error.message
              : "Failed to load skill files"
          }
          onRetry={() => void filesQuery.refetch()}
        />
      </div>
    );
  }

  const currentFiles = filesQuery.data ?? [];
  const context: SkillContext = {
    requestType: "update",
    skillName: skill.title,
    currentFiles,
    skillGroupId: skill.groupId,
    location: (skill.location as "global" | "project") ?? "project",
    skillPath: skill.identifier,
  };

  return (
    <SkillRequestForm
      baseUrl={baseUrl}
      token={token}
      config={config}
      context={context}
      initialDraft={draftFromFiles(skill.title, currentFiles)}
      createMethod="write"
      skillGroups={skillGroups}
      requesterEmail={requesterEmail}
      onBack={onClose}
    />
  );
}
