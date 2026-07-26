import type { Comment, PortUser } from "../types";

export const MOCK_SUBJECT_BLUEPRINT = "service";
export const MOCK_SUBJECT_IDENTIFIER = "payment-service";

export const MOCK_USERS: PortUser[] = [
  {
    identifier: "alice-chen",
    title: "Alice Chen",
    properties: { email: "alice@example.com" },
  },
  {
    identifier: "bob-smith",
    title: "Bob Smith",
    properties: { email: "bob@example.com" },
  },
  {
    identifier: "carol-jones",
    title: "Carol Jones",
    properties: { email: "carol@example.com" },
  },
];

export const MOCK_COMMENTS: Comment[] = [
  {
    identifier: "comment-001",
    title: "Need to review the auth flow",
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    properties: {
      body: "Need to review the **auth flow** before the next release. See the config below:\n```yaml\nauth:\n  provider: oauth2\n  timeout: 30s\n```\ncc @carol@example.com",
      author: "alice@example.com",
      status: "open",
      subjectBlueprint: MOCK_SUBJECT_BLUEPRINT,
      subjectIdentifier: MOCK_SUBJECT_IDENTIFIER,
      mentions: ["carol@example.com"],
    },
    relations: { parentComment: null },
  },
  {
    identifier: "comment-002",
    title: "Re: auth flow",
    createdAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    properties: {
      body: "I took a look — the `timeout` should be `60s` for production. Will fix in the next PR.",
      author: "bob@example.com",
      subjectBlueprint: MOCK_SUBJECT_BLUEPRINT,
      subjectIdentifier: MOCK_SUBJECT_IDENTIFIER,
      mentions: [],
    },
    relations: { parentComment: "comment-001" },
  },
  {
    identifier: "comment-003",
    title: "DB migration plan",
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    properties: {
      body: "The DB migration is scheduled for Friday night. Steps:\n1. Backup prod\n2. Run `./migrate.sh --env prod`\n3. Validate with smoke tests",
      author: "bob@example.com",
      status: "resolved",
      subjectBlueprint: MOCK_SUBJECT_BLUEPRINT,
      subjectIdentifier: MOCK_SUBJECT_IDENTIFIER,
      mentions: [],
    },
    relations: { parentComment: null },
  },
];
