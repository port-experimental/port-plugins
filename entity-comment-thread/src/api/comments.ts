import { DEV_MOCK } from "../hooks/usePostMessageData";
import {
  MOCK_COMMENTS,
  MOCK_SUBJECT_BLUEPRINT,
  MOCK_SUBJECT_IDENTIFIER,
} from "../dev/mockData";
import type { Comment } from "../types";

function generateId(): string {
  return `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function apiRequest<T>(url: string, options: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Port API ${res.status}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export async function searchComments(
  baseUrl: string,
  token: string,
  commentBlueprintId: string,
  subjectBlueprintId: string,
  subjectIdentifier: string
): Promise<Comment[]> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 250));
    return MOCK_COMMENTS.filter(
      (c) =>
        c.properties.subjectBlueprint === MOCK_SUBJECT_BLUEPRINT &&
        c.properties.subjectIdentifier === MOCK_SUBJECT_IDENTIFIER
    );
  }

  const result = await apiRequest<{ entities: Comment[] }>(
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
              property: "subjectBlueprint",
              operator: "=",
              value: subjectBlueprintId,
            },
            {
              property: "subjectIdentifier",
              operator: "=",
              value: subjectIdentifier,
            },
          ],
        },
      }),
    }
  );
  return result.entities ?? [];
}

export interface CreateCommentInput {
  body: string;
  /** User's email — stored in the `author` property (format: user) */
  authorEmail?: string | null;
  subjectBlueprint: string;
  subjectIdentifier: string;
  /** Parent comment entity identifier — null / undefined for top-level */
  parentCommentId?: string | null;
  mentions?: string[];
  status?: "open" | "resolved";
}

export async function createComment(
  baseUrl: string,
  token: string,
  commentBlueprintId: string,
  input: CreateCommentInput
): Promise<Comment> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 200));
    const newComment: Comment = {
      identifier: generateId(),
      title: input.body.slice(0, 50),
      createdAt: new Date().toISOString(),
      properties: {
        body: input.body,
        author: input.authorEmail ?? null,
        status: input.parentCommentId ? undefined : (input.status ?? "open"),
        subjectBlueprint: input.subjectBlueprint,
        subjectIdentifier: input.subjectIdentifier,
        mentions: input.mentions ?? [],
      },
      relations: {
        parentComment: input.parentCommentId ?? null,
      },
    };
    MOCK_COMMENTS.push(newComment);
    return newComment;
  }

  const identifier = generateId();
  const properties: Record<string, unknown> = {
    body: input.body,
    subjectBlueprint: input.subjectBlueprint,
    subjectIdentifier: input.subjectIdentifier,
    mentions: input.mentions ?? [],
  };
  if (input.authorEmail) {
    properties.author = input.authorEmail;
  }
  if (!input.parentCommentId) {
    properties.status = input.status ?? "open";
  }

  const relations: Record<string, string | null> = {};
  if (input.parentCommentId) {
    relations.parentComment = input.parentCommentId;
  }

  const result = await apiRequest<{ entity: Comment }>(
    `${baseUrl}/v1/blueprints/${encodeURIComponent(commentBlueprintId)}/entities`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        identifier,
        title: input.body.slice(0, 50),
        properties,
        relations,
      }),
    }
  );
  return result.entity;
}

export async function updateCommentBody(
  baseUrl: string,
  token: string,
  commentBlueprintId: string,
  commentIdentifier: string,
  body: string
): Promise<void> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    const c = MOCK_COMMENTS.find((x) => x.identifier === commentIdentifier);
    if (c) {
      c.properties.body = body;
      c.updatedAt = new Date().toISOString();
    }
    return;
  }

  await apiRequest(
    `${baseUrl}/v1/blueprints/${encodeURIComponent(commentBlueprintId)}/entities/${encodeURIComponent(commentIdentifier)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties: { body } }),
    }
  );
}

export async function updateCommentStatus(
  baseUrl: string,
  token: string,
  commentBlueprintId: string,
  commentIdentifier: string,
  status: "open" | "resolved"
): Promise<void> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    const c = MOCK_COMMENTS.find((x) => x.identifier === commentIdentifier);
    if (c) c.properties.status = status;
    return;
  }

  await apiRequest(
    `${baseUrl}/v1/blueprints/${encodeURIComponent(commentBlueprintId)}/entities/${encodeURIComponent(commentIdentifier)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ properties: { status } }),
    }
  );
}

export async function deleteComment(
  baseUrl: string,
  token: string,
  commentBlueprintId: string,
  commentIdentifier: string
): Promise<void> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 150));
    const idx = MOCK_COMMENTS.findIndex(
      (x) => x.identifier === commentIdentifier
    );
    if (idx !== -1) MOCK_COMMENTS.splice(idx, 1);
    return;
  }

  await apiRequest(
    `${baseUrl}/v1/blueprints/${encodeURIComponent(commentBlueprintId)}/entities/${encodeURIComponent(commentIdentifier)}?delete_dependents=false`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    }
  );
}
