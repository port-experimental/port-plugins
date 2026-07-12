import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentFiles, fetchSkillGroups } from "./api/skills";
import { CreateFlow } from "./components/CreateFlow";
import { ErrorBanner } from "./components/ErrorBanner";
import { LoadingState } from "./components/LoadingState";
import { SkillRequestForm } from "./components/SkillRequestForm";
import { REL_SKILL_TO_GROUP } from "./constants";
import { usePostMessageData } from "./hooks/usePostMessageData";
import type { SkillContext, SkillGroupOption } from "./types";
import { configFromParams } from "./utils/config";
import { draftFromFiles } from "./utils/draft";
import "./App.css";

function firstRelationId(value: unknown): string | undefined {
  if (Array.isArray(value)) return value.length ? String(value[0]) : undefined;
  if (typeof value === "string" && value) return value;
  return undefined;
}

export function App() {
  const { params, user, entity, portToken, portApiBaseUrl } = usePostMessageData();
  const config = useMemo(() => configFromParams(params), [params]);

  const isUpdate = entity?.blueprint === config.skillBlueprint && !!entity?.identifier;
  const targetSkillId = isUpdate ? entity?.identifier : undefined;

  const ctx = useMemo(
    () => ({ baseUrl: portApiBaseUrl ?? "", token: portToken ?? "" }),
    [portApiBaseUrl, portToken]
  );
  const ready = !!portApiBaseUrl && !!portToken;

  const groupsQuery = useQuery({
    queryKey: ["skill-groups", config.skillGroupBlueprint, portToken],
    queryFn: () => fetchSkillGroups(ctx, config),
    enabled: ready,
    staleTime: 5 * 60 * 1000,
  });

  const filesQuery = useQuery({
    queryKey: ["skill-files", targetSkillId, portToken],
    queryFn: () => fetchCurrentFiles(ctx, targetSkillId as string),
    enabled: ready && isUpdate && !!targetSkillId,
    staleTime: 60 * 1000,
  });

  if (!ready) {
    return (
      <div className="shell">
        <p className="muted">
          Waiting for Port context… Embed this widget on a dashboard (to create a
          skill) or on a skill entity page (to propose an update).
        </p>
      </div>
    );
  }

  const loading = groupsQuery.isLoading || (isUpdate && filesQuery.isLoading);
  if (loading) {
    return (
      <div className="shell">
        <LoadingState label="Loading skill catalog…" />
      </div>
    );
  }

  const error = groupsQuery.error ?? filesQuery.error;
  if (error) {
    return (
      <div className="shell">
        <ErrorBanner
          message={error instanceof Error ? error.message : "Failed to load data"}
          onRetry={() => {
            void groupsQuery.refetch();
            if (isUpdate) void filesQuery.refetch();
          }}
        />
      </div>
    );
  }

  const skillGroups: SkillGroupOption[] = groupsQuery.data ?? [];

  if (isUpdate) {
    const inheritedGroup = firstRelationId(entity?.relations?.[REL_SKILL_TO_GROUP]);
    const currentFiles = filesQuery.data ?? [];
    const skillName = entity?.title ?? entity?.identifier ?? "";
    const context: SkillContext = {
      requestType: "update",
      skillName,
      currentFiles,
      skillGroupId: inheritedGroup,
      location: (entity?.properties?.location as "global" | "project") ?? "project",
      skillPath: entity?.identifier,
    };

    return (
      <div className="shell">
        <SkillRequestForm
          baseUrl={ctx.baseUrl}
          token={ctx.token}
          config={config}
          context={context}
          initialDraft={draftFromFiles(skillName, currentFiles)}
          createMethod="write"
          skillGroups={skillGroups}
          requesterEmail={user?.email}
        />
      </div>
    );
  }

  const context: SkillContext = {
    requestType: "create",
    skillName: "",
    currentFiles: [],
    location: "project",
  };

  return (
    <div className="shell">
      <CreateFlow
        baseUrl={ctx.baseUrl}
        token={ctx.token}
        config={config}
        context={context}
        skillGroups={skillGroups}
        requesterEmail={user?.email}
      />
    </div>
  );
}
