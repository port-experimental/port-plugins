import type { CommentEntity, PortUser } from "../types";

export const MOCK_SUBJECT = {
  blueprint: "service",
  identifier: "payments-api",
  title: "Payments API",
};

export const MOCK_USERS: PortUser[] = [
  {
    identifier: "alice@example.com",
    title: "Alice Example",
    properties: { status: "Active", port_role: "Member" },
  },
  {
    identifier: "bob@example.com",
    title: "Bob Example",
    properties: { status: "Active", port_role: "Admin" },
  },
];

export const MOCK_COMMENTS: CommentEntity[] = [
  {
    identifier: "comment-root-1",
    blueprint: "entityComment",
    title: "Deployment checklist",
    createdAt: "2026-05-18T10:00:00.000Z",
    properties: {
      body: "Please confirm **staging** is green before prod.\n\n```bash\nkubectl rollout status deploy/payments\n```",
      author: "alice@example.com",
      threadStatus: "open",
      mentions: [],
    },
    relations: { service: MOCK_SUBJECT.identifier },
  },
  {
    identifier: "comment-reply-1",
    blueprint: "entityComment",
    title: "Re: Deployment checklist",
    createdAt: "2026-05-18T11:30:00.000Z",
    properties: {
      body: "Staging looks good — @bob@example.com can you approve?",
      author: "alice@example.com",
      mentions: ["bob@example.com"],
    },
    relations: {
      service: MOCK_SUBJECT.identifier,
      parentComment: "comment-root-1",
    },
  },
];
