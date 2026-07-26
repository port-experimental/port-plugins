import type { ReactNode } from "react";
import "./App.css";
import { usePostMessageData } from "./hooks/usePostMessageData";
import { useComments } from "./hooks/useComments";
import { usePortUsers } from "./hooks/usePortUsers";
import { configFromParams } from "./utils/config";
import { resolveHostSubject } from "./utils/resolveHostEntity";
import { LoadingState } from "./components/LoadingState";
import { ErrorBanner } from "./components/ErrorBanner";
import { CommentThread } from "./components/CommentThread";

function ShellMessage({ children }: { children: ReactNode }) {
  return (
    <div className="shell shell--message">
      <p className="muted">{children}</p>
    </div>
  );
}

export function App() {
  const { params, entity, portToken, portApiBaseUrl, user } =
    usePostMessageData();
  const config = configFromParams(params);
  const host = resolveHostSubject(entity);

  const commentBlueprintId = config?.commentBlueprint.identifier ?? "";

  // All hooks must be called before any early return
  // subjectBlueprintId is inferred from the host entity — no param needed
  const { query, createMutation, editMutation, statusMutation, deleteMutation } = useComments(
    {
      baseUrl: portApiBaseUrl,
      token: portToken,
      commentBlueprintId,
      subjectBlueprintId: host?.blueprint ?? "",
      subjectIdentifier: host?.identifier ?? "",
    }
  );

  const usersQuery = usePortUsers(portApiBaseUrl, portToken);

  if (!portApiBaseUrl || !portToken) {
    return (
      <ShellMessage>
        Waiting for Port context… If this stays blank, check the browser
        console.
      </ShellMessage>
    );
  }

  if (!config) {
    return (
      <ShellMessage>
        Configure the required widget parameter (Comment blueprint) in Port.
      </ShellMessage>
    );
  }

  if (!host) {
    return (
      <ShellMessage>
        Place this widget on an entity page so Port can provide the host entity.
      </ShellMessage>
    );
  }

  // `user.email` is stored directly in the `author` property (format: user)
  const currentUserEmail = user?.email ?? "";
  const comments = query.data ?? [];
  const portUsers = usersQuery.data ?? [];
  const showLoading = query.isPending || query.isLoading;

  return (
    <div className="shell">
      <main className="main">
        {query.isError && (
          <ErrorBanner
            message={`Failed to load comments: ${(query.error as Error).message}`}
            onRetry={() => void query.refetch()}
          />
        )}

        {showLoading ? (
          <LoadingState />
        ) : (
          <CommentThread
            comments={comments}
            currentUserEmail={currentUserEmail}
            users={portUsers}
            onAddComment={(body, mentions) => {
              createMutation.mutate({
                body,
                authorEmail: currentUserEmail || null,
                subjectBlueprint: host.blueprint,
                subjectIdentifier: host.identifier,
                mentions,
                status: "open",
              });
            }}
            onReply={(parentId, body, mentions) => {
              createMutation.mutate({
                body,
                authorEmail: currentUserEmail || null,
                subjectBlueprint: host.blueprint,
                subjectIdentifier: host.identifier,
                parentCommentId: parentId,
                mentions,
              });
            }}
            onEdit={(commentId, newBody) => {
              editMutation.mutate({ commentIdentifier: commentId, body: newBody });
            }}
            onToggleStatus={(commentId, status) => {
              statusMutation.mutate({ commentIdentifier: commentId, status });
            }}
            onDelete={(commentId) => {
              deleteMutation.mutate(commentId);
            }}
            isSubmitting={createMutation.isPending}
            isTogglingStatus={statusMutation.isPending}
            isDeletingId={
              deleteMutation.isPending
                ? (deleteMutation.variables ?? null)
                : null
            }
            isEditingId={
              editMutation.isPending
                ? (editMutation.variables?.commentIdentifier ?? null)
                : null
            }
          />
        )}
      </main>
    </div>
  );
}
