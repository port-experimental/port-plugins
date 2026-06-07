import { TechDocEntity } from "../types";

export const MOCK_DOCS: TechDocEntity[] = [
  {
    identifier: "Node-hello-md",
    title: "hello",
    properties: {
      content: `# hello

\`\`\`mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Do something]
    B -->|No| D[Do something else]
\`\`\`
`,
      filePath: "hello.md",
      folderPath: "",
      url: "https://github.com/example/Node/blob/main/hello.md",
    },
    relations: { repository: "Node" },
  },
  {
    identifier: "Node-README-md",
    title: "Node Docs",
    updatedAt: "2026-01-15T14:30:00.000Z",
    properties: {
      content: `# Node

Root documentation for the Node monorepo.

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Internal navigation (dev mocks)

These links stay inside TechDocs instead of opening in Port:

- [Frontend app](apps/Frontend/README.md)

External links still open via Port: [Port documentation](https://docs.getport.io).
`,
      filePath: "README.md",
      folderPath: "",
      url: "https://github.com/example/Node/blob/main/README.md",
      lastUpdated: "2026-01-10T09:00:00Z",
    },
    relations: { repository: "Node" },
  },
  {
    identifier: "Node-apps-Frontend-README-md",
    title: "Frontend Docs",
    properties: {
      content: `# Frontend

React application powering the UI.

## Stack

- React 19
- TypeScript
- Vite

## Related docs

- [Repository root](../../README.md) — repo root (\`apps/Frontend\` → \`../..\`)
- [React docs](https://react.dev) — external; opens via Port link bridge

`,
      filePath: "apps/Frontend/README.md",
      folderPath: "apps/Frontend",
      url: "https://github.com/example/Node/blob/main/apps/Frontend/README.md",
    },
    relations: { repository: "Node" },
  },
  {
    identifier: "Node-apps-Backend-README-md",
    title: "Backend Docs",
    properties: {
      content: `# Backend

Express API server.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /health | Health check |
| POST | /api/data | Submit data |

## Related docs

- [Frontend UI](../Frontend/README.md) — sibling under \`apps/\`
- [Root README](../../README.md) — repo root from \`apps/Backend\`
- [Test area](/test/README2.md) — absolute from repo root (leading \`/\`)
`,
      filePath: "apps/Backend/README.md",
      folderPath: "apps/Backend",
      url: "https://github.com/example/Node/blob/main/apps/Backend/README.md",
    },
    relations: { repository: "Node", service: "mock-backend-service" },
  },
  {
    identifier: "Node-test-README2-md",
    title: "Test README",
    properties: {
      content: `# Test area

Secondary markdown file under \`test/\` (not the default README name).

## Navigation examples

- [Root README](../README.md) — one level up to repo root
- [Frontend app](../apps/Frontend/README.md)
- [Backend API](../apps/Backend/README.md)
- [Same-folder link](./README2.md) — stays on this page
`,
      filePath: "test/README2.md",
      folderPath: "test",
      url: "https://github.com/example/Node/blob/main/test/README2.md",
    },
    relations: { repository: "Node" },
  },
  {
    identifier: "FlameBot-README-md",
    title: "FlameBot Docs",
    properties: {
      content: `# FlameBot

Slack bot for incident management.

## Configuration

Set \`SLACK_TOKEN\` in your environment.

## Note on cross-repo links

This repo is **FlameBot**, not **Node**. A link like [Node root README](../README.md) resolves to \`FlameBot/README.md\` (this page), not the Node monorepo — internal links only match docs in the **same** \`repository\` relation.
`,
      filePath: "README.md",
      folderPath: "",
      url: "https://github.com/example/FlameBot/blob/main/README.md",
    },
    relations: { repository: "FlameBot" },
  },
];
