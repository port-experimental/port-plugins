import {
  COMMENT_BLUEPRINT,
  PARENT_COMMENT_RELATION,
  type CommentEntity,
  type CommentThread,
  type ThreadStatus,
} from "../types";

function parentId(comment: CommentEntity): string | undefined {
  const rel = comment.relations?.[PARENT_COMMENT_RELATION];
  if (typeof rel === "string" && rel) return rel;
  if (Array.isArray(rel) && rel[0]) return rel[0];
  return undefined;
}

function threadStatus(comment: CommentEntity): ThreadStatus {
  const status = comment.properties?.threadStatus;
  return status === "resolved" ? "resolved" : "open";
}

export function buildCommentThreads(comments: CommentEntity[]): CommentThread[] {
  const roots = comments.filter((c) => !parentId(c));
  const byParent = new Map<string, CommentEntity[]>();

  for (const c of comments) {
    const pid = parentId(c);
    if (!pid) continue;
    const list = byParent.get(pid) ?? [];
    list.push(c);
    byParent.set(pid, list);
  }

  const sortByTime = (a: CommentEntity, b: CommentEntity) => {
    const ta = Date.parse(a.createdAt ?? "") || 0;
    const tb = Date.parse(b.createdAt ?? "") || 0;
    return ta - tb;
  };

  return roots
    .sort(sortByTime)
    .map((root) => {
      const replies = collectReplies(root.identifier, byParent);
      replies.sort(sortByTime);
      return {
        root,
        replies,
        status: threadStatus(root),
      };
    });
}

function collectReplies(
  rootId: string,
  byParent: Map<string, CommentEntity[]>
): CommentEntity[] {
  const direct = byParent.get(rootId) ?? [];
  const nested: CommentEntity[] = [];
  for (const reply of direct) {
    nested.push(reply);
    nested.push(...collectReplies(reply.identifier, byParent));
  }
  return nested;
}

export function rootCommentId(comment: CommentEntity): string {
  return parentId(comment) ?? comment.identifier;
}

export function commentBlueprintMatches(
  comment: CommentEntity,
  blueprint: string
): boolean {
  return (comment.blueprint ?? COMMENT_BLUEPRINT) === blueprint;
}
