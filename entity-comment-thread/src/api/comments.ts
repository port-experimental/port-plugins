import { parsePortError } from "./portError";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import { MOCK_COMMENTS } from "../dev/mockData";
import {
  PARENT_COMMENT_RELATION,
  type CommentEntity,
  type SubjectContext,
  type ThreadStatus,
} from "../types";

type SearchResponse = { entities?: CommentEntity[] };

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

export async function searchCommentsForSubject(
  baseUrl: string,
  token: string,
  commentBlueprintId: string,
  subject: SubjectContext
): Promise<CommentEntity[]> {
  if (DEV_MOCK) return MOCK_COMMENTS;

  const res = await fetch(
    `${baseUrl}/v1/blueprints/${encodeURIComponent(commentBlueprintId)}/entities/search`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: {
          combinator: "and",
          rules: [
            {
              operator: "relatedTo",
              blueprint: subject.blueprint,
              value: subject.identifier,
            },
          ],
        },
      }),
    }
  );

  if (!res.ok) await parsePortError(res);
  const data = (await res.json()) as SearchResponse;
  return data.entities ?? [];
}

export type CreateCommentInput = {
  body: string;
  author: string;
  mentions: string[];
  subject: SubjectContext;
  parentCommentId?: string;
  threadStatus?: ThreadStatus;
};

export async function createComment(
  baseUrl: string,
  token: string,
  commentBlueprintId: string,
  input: CreateCommentInput
): Promise<CommentEntity> {
  if (DEV_MOCK) {
    const id = `mock-${Date.now()}`;
    return {
      identifier: id,
      blueprint: commentBlueprintId,
      title: input.body.slice(0, 60),
      createdAt: new Date().toISOString(),
      properties: {
        body: input.body,
        author: input.author,
        mentions: input.mentions,
        threadStatus: input.threadStatus ?? "open",
      },
      relations: {
        [input.subject.subjectRelationKey]: input.subject.identifier,
        ...(input.parentCommentId
          ? { [PARENT_COMMENT_RELATION]: input.parentCommentId }
          : {}),
      },
    };
  }

  const identifier = `${slugify(input.subject.identifier)}-${Date.now()}`;
  const relations: Record<string, string> = {
    [input.subject.subjectRelationKey]: input.subject.identifier,
  };
  if (input.parentCommentId) {
    relations[PARENT_COMMENT_RELATION] = input.parentCommentId;
  }

  const properties: Record<string, unknown> = {
    body: input.body,
    author: input.author,
    mentions: input.mentions,
  };
  if (!input.parentCommentId) {
    properties.threadStatus = input.threadStatus ?? "open";
  }

  const res = await fetch(
    `${baseUrl}/v1/blueprints/${encodeURIComponent(commentBlueprintId)}/entities`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier,
        title: input.body.trim().slice(0, 80) || "Comment",
        properties,
        relations,
      }),
    }
  );

  if (!res.ok) await parsePortError(res);
  return (await res.json()) as CommentEntity;
}

export async function updateThreadStatus(
  baseUrl: string,
  token: string,
  commentBlueprintId: string,
  rootCommentId: string,
  threadStatus: ThreadStatus
): Promise<CommentEntity> {
  if (DEV_MOCK) {
    const existing = MOCK_COMMENTS.find((c) => c.identifier === rootCommentId);
    return {
      ...(existing ?? MOCK_COMMENTS[0]),
      properties: {
        ...(existing?.properties ?? {}),
        threadStatus,
      },
    };
  }

  const res = await fetch(
    `${baseUrl}/v1/blueprints/${encodeURIComponent(commentBlueprintId)}/entities/${encodeURIComponent(rootCommentId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: { threadStatus },
      }),
    }
  );

  if (!res.ok) await parsePortError(res);
  return (await res.json()) as CommentEntity;
}
