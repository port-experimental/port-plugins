import { TechDocEntity } from "../types";

export const MOCK_DOCS: TechDocEntity[] = [
    {
        identifier: "Node-README-md",
        title: "Node Docs",
        updatedAt: "2026-01-15T14:30:00.000Z",
        properties: {
            content: "# Node\n\nRoot documentation for the Node monorepo.\n\n## Getting Started\n\n```bash\nnpm install\nnpm run dev\n```\n",
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
            content: "# Frontend\n\nReact application powering the UI.\n\n## Stack\n\n- React 19\n- TypeScript\n- Vite\n",
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
            content: "# Backend\n\nExpress API server.\n\n## Endpoints\n\n| Method | Path | Description |\n|--------|------|-------------|\n| GET | /health | Health check |\n| POST | /api/data | Submit data |\n",
            filePath: "apps/Backend/README.md",
            folderPath: "apps/Backend",
            url: "https://github.com/example/Node/blob/main/apps/Backend/README.md",
        },
        relations: { repository: "Node", service: "mock-backend-service" },
    },
    {
        identifier: "FlameBot-README-md",
        title: "FlameBot Docs",
        properties: {
            content: "# FlameBot\n\nSlack bot for incident management.\n\n## Configuration\n\nSet `SLACK_TOKEN` in your environment.\n",
            filePath: "README.md",
            folderPath: "",
            url: "https://github.com/example/FlameBot/blob/main/README.md",
        },
        relations: { repository: "FlameBot" },
    },
];

