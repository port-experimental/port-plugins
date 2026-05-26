import "./App.css";
import { CommentEditor } from "./components/CommentEditor";
import { CommentThreadBlock } from "./components/CommentThread";
import { useCommentBlueprint } from "./hooks/useCommentBlueprint";
import { useComments } from "./hooks/useComments";
import { usePostMessageData } from "./hooks/usePostMessageData";
import { configFromParams } from "./utils/config";

export function App() {
  const { entity, user, params, portToken, portApiBaseUrl } =
    usePostMessageData();
  const config = configFromParams(params);
  const commentBlueprintId = config.entityCommentBlueprint.identifier;

  const {
    subject,
    isLoading: blueprintLoading,
    isError: blueprintError,
    error: blueprintErr,
    missingRelation,
    subjectBlueprintId,
  } = useCommentBlueprint(
    entity,
    commentBlueprintId,
    portToken,
    portApiBaseUrl
  );

  const {
    threads,
    isLoading: commentsLoading,
    isError: commentsError,
    error: commentsErr,
    postComment,
    setThreadStatus,
  } = useComments(
    subject,
    commentBlueprintId,
    portToken,
    portApiBaseUrl
  );

  const authorEmail = user?.email ?? "";
  const loading = blueprintLoading || commentsLoading;

  if (!portApiBaseUrl || !portToken) {
    return (
      <div className="shell">
        <p className="muted">
          Waiting for Port context… Open this widget on an entity page in Port.
        </p>
      </div>
    );
  }

  if (!entity?.identifier || !subjectBlueprintId) {
    return (
      <div className="shell">
        <p className="muted">
          Add this widget to an <strong>entity page</strong> so it can load
          comments for the current entity.
        </p>
      </div>
    );
  }

  if (blueprintError) {
    return (
      <div className="shell">
        <pre className="error" role="alert">
          {blueprintErr instanceof Error
            ? blueprintErr.message
            : "Failed to load comment blueprint"}
        </pre>
      </div>
    );
  }

  if (missingRelation) {
    return (
      <div className="shell">
        <p className="setup-hint">
          Could not match a relation on <code>{commentBlueprintId}</code> to{" "}
          <code>{subjectBlueprintId}</code>. If the relation exists in Port,
          rebuild and re-upload the widget. Otherwise add a relation on the
          comment blueprint targeting this entity type (see plugin README).
        </p>
      </div>
    );
  }

  return (
    <div className="shell shell--with-composer">
      <div className="thread-list-scroll" role="region" aria-label="Comments">
        {loading && <p className="status">Loading comments…</p>}

        {commentsError && (
          <pre className="error" role="alert">
            {commentsErr instanceof Error
              ? commentsErr.message
              : "Failed to load comments"}
          </pre>
        )}

        {!loading && !commentsError && threads.length === 0 && (
          <p className="empty-state">
            No comments yet. Start the conversation below.
          </p>
        )}

        {!loading && !commentsError && (
          <div className="thread-list">
            {threads.map((thread) => (
              <CommentThreadBlock
                key={thread.root.identifier}
                thread={thread}
                portApiBaseUrl={portApiBaseUrl}
                portToken={portToken}
                currentUserEmail={authorEmail}
                onPostReply={async (parentCommentId, body, mentions) => {
                  await postComment.mutateAsync({
                    body,
                    author: authorEmail,
                    mentions,
                    parentCommentId,
                  });
                }}
                onToggleStatus={async (rootId, status) => {
                  await setThreadStatus.mutateAsync({
                    rootCommentId: rootId,
                    threadStatus: status,
                  });
                }}
              />
            ))}
          </div>
        )}
      </div>

      <section className="new-thread" aria-label="New comment">
        <h3 className="section-label">Add comment</h3>
        {!authorEmail ? (
          <p className="muted-inline">
            Your Port user email is required to post comments.
          </p>
        ) : (
          <CommentEditor
            portApiBaseUrl={portApiBaseUrl}
            portToken={portToken}
            disabled={postComment.isPending || loading}
            onSubmit={async (body, mentions) => {
              await postComment.mutateAsync({
                body,
                author: authorEmail,
                mentions,
              });
            }}
          />
        )}
        {postComment.isError && (
          <pre className="error" role="alert">
            {postComment.error instanceof Error
              ? postComment.error.message
              : "Failed to post comment"}
          </pre>
        )}
      </section>
    </div>
  );
}
