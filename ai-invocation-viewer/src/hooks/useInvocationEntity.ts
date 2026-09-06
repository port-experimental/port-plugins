import { useQuery } from "@tanstack/react-query";
import { fetchInvocationEntity } from "../api/fetchInvocationEntity";
import { DEV_MOCK } from "./usePostMessageData";
import type { Entity } from "../types";

const INVOCATION_BLUEPRINT = "_ai_invocations";
const CONVERSATION_BLUEPRINT = "_ai_conversation";

function relationIdentifier(rel: unknown): string | null {
  if (typeof rel === "string" && rel.trim()) return rel.trim();
  if (rel && typeof rel === "object") {
    const id = (rel as { identifier?: unknown }).identifier;
    if (typeof id === "string" && id.trim()) return id.trim();
  }
  return null;
}

function isInvocationEntity(entity: Entity): boolean {
  if (entity.blueprint === INVOCATION_BLUEPRINT) return true;
  // SDK sometimes omits blueprint; execution_logs is invocation-only.
  return entity.properties?.execution_logs != null;
}

function isConversationEntity(entity: Entity): boolean {
  if (entity.blueprint === CONVERSATION_BLUEPRINT) return true;
  return (
    !isInvocationEntity(entity) &&
    relationIdentifier(entity.relations?.latest_invocation) != null
  );
}

export type InvocationSource = "invocation" | "conversation" | "unknown";

export function useInvocationEntity(
  pageEntity: Entity | undefined,
  portToken: string | null,
  portApiBaseUrl: string | null
) {
  const source: InvocationSource = !pageEntity?.identifier
    ? "unknown"
    : isInvocationEntity(pageEntity)
      ? "invocation"
      : isConversationEntity(pageEntity)
        ? "conversation"
        : "unknown";

  const latestInvocationId =
    source === "conversation"
      ? relationIdentifier(pageEntity?.relations?.latest_invocation)
      : null;

  const query = useQuery({
    queryKey: [
      "ai-invocation-viewer",
      "latest-invocation",
      portApiBaseUrl,
      latestInvocationId,
    ],
    queryFn: () =>
      fetchInvocationEntity(
        portApiBaseUrl!,
        portToken!,
        latestInvocationId!
      ),
    enabled:
      !DEV_MOCK &&
      source === "conversation" &&
      Boolean(portApiBaseUrl && portToken && latestInvocationId),
  });

  if (source === "invocation") {
    return {
      source,
      entity: pageEntity,
      isLoading: false,
      error: null as Error | null,
      missingLatestInvocation: false,
    };
  }

  if (source === "conversation") {
    return {
      source,
      entity: query.data,
      isLoading:
        query.isPending || query.isLoading || query.isFetching,
      error: (query.error as Error | null) ?? null,
      missingLatestInvocation: !latestInvocationId,
    };
  }

  return {
    source,
    entity: undefined,
    isLoading: false,
    error: null as Error | null,
    missingLatestInvocation: false,
  };
}
