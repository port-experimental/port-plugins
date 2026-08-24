import type {
  FavoritesData,
  PortPage,
  PortAction,
  PortBlueprint,
  PortEntity,
} from "../types";

import { buildFavoritesIdentifiers } from "../utils/favorites/favoritesIdentifiers";

export const MOCK_FAVORITES: FavoritesData = {
  pages: [
    { identifier: "services-page", title: "Services", type: "blueprint-entities" },
    { identifier: "overview-page", title: "Overview", type: "dashboard" },
  ],
  selfService: [
    {
      type: "action",
      identifier: "scaffold_service",
      title: "Scaffold Service",
      description: "Create a new service",
      blueprint: "service",
    },
    {
      type: "workflow",
      identifier: "deploy-service",
      triggerIdentifier: "trigger",
      title: "Deploy Service",
      description: "Deploy a service to an environment",
    },
  ],
  entities: [
    {
      identifier: "my-service",
      title: "My Service",
      blueprint: "service",
      blueprintTitle: "Service",
    },
  ],
};

export const MOCK_USER_BLUEPRINT: PortBlueprint = {
  identifier: "_user",
  title: "User",
  schema: {
    properties: {
      favorites: { type: "object" },
      favorites_identifiers: { type: "array" },
    },
  },
};

let mockUserEntity: PortEntity = {
  identifier: "developer@example.com",
  title: "Dev User",
  blueprint: "_user",
  properties: {
    port_role: "Admin",
    status: "Active",
    port_type: "Standard",
    favorites: JSON.stringify(MOCK_FAVORITES),
    favorites_identifiers: buildFavoritesIdentifiers(MOCK_FAVORITES.entities),
  },
};

export const MOCK_USER_ENTITY: PortEntity = mockUserEntity;

export function getMockUserEntity(): PortEntity {
  return mockUserEntity;
}

export function setMockUserEntityProperties(properties: Record<string, unknown>): void {
  mockUserEntity = {
    ...mockUserEntity,
    properties: {
      ...mockUserEntity.properties,
      ...properties,
    },
  };
};

export const MOCK_PAGES: PortPage[] = [
  { identifier: "services-page", title: "Services", type: "blueprint-entities" },
  { identifier: "overview-page", title: "Overview", type: "dashboard" },
  { identifier: "pull-requests-page", title: "Pull Requests", type: "blueprint-entities" },
  { identifier: "environments-page", title: "Environments", type: "blueprint-entities" },
  { identifier: "tech-radar-page", title: "Tech Radar", type: "dashboard" },
  { identifier: "teams-page", title: "Teams", type: "blueprint-entities" },
];

export const MOCK_ACTIONS: PortAction[] = [
  {
    identifier: "scaffold_service",
    title: "Scaffold Service",
    description: "Create a new service from a template",
    blueprint: "service",
    trigger: { type: "self-service", operation: "CREATE" },
  },
  {
    identifier: "deploy_service",
    title: "Deploy to Production",
    description: "Trigger a production deployment",
    blueprint: "service",
    trigger: { type: "self-service", operation: "DAY-2" },
  },
  {
    identifier: "create_jira_bug",
    title: "Create Bug",
    description: "Open a new Jira bug ticket",
    blueprint: "jira_bug",
    trigger: { type: "self-service", operation: "CREATE" },
  },
  {
    identifier: "add_team_member",
    title: "Add Team Member",
    description: "Onboard a new team member",
    blueprint: "_team",
    trigger: { type: "self-service", operation: "DAY-2" },
  },
  {
    identifier: "run_security_scan",
    title: "Run Security Scan",
    description: "Trigger a Snyk security scan",
    blueprint: "service",
    trigger: { type: "self-service", operation: "DAY-2" },
  },
];

export const MOCK_WORKFLOW_TRIGGERS = [
  {
    workflowIdentifier: "deploy-service",
    triggerIdentifier: "trigger",
    title: "Deploy Service",
    description: "Deploy a service to staging or production",
    category: "Deployments",
  },
  {
    workflowIdentifier: "onboard-developer",
    triggerIdentifier: "self_serve",
    title: "Onboard Developer",
    description: "Provision accounts and access for a new developer",
    category: "People",
  },
  {
    workflowIdentifier: "incident-response",
    triggerIdentifier: "create_incident",
    title: "Create Incident",
    description: "Open an incident and notify on-call",
    category: "Operations",
  },
];

export const MOCK_BLUEPRINTS: PortBlueprint[] = [
  { identifier: "service", title: "Service" },
  { identifier: "task", title: "Task" },
  { identifier: "githubRepository", title: "Repository" },
  { identifier: "githubPullRequest", title: "Pull Request" },
  { identifier: "githubTeam", title: "GitHub Team" },
  { identifier: "environment", title: "Environment" },
];

export const MOCK_ENTITIES: Record<string, PortEntity[]> = {
  service: [
    { identifier: "entity-1", title: "Entity 1", blueprint: "service" },
    { identifier: "entity-2", title: "Entity 2", blueprint: "service" },
    { identifier: "my-service", title: "My Service", blueprint: "service" },
    { identifier: "auth-service", title: "Auth Service", blueprint: "service" },
  ],
  task: [
    { identifier: "entity-3", title: "Entity 3", blueprint: "task" },
    { identifier: "entity-4", title: "Entity 4", blueprint: "task" },
  ],
  githubRepository: [
    { identifier: "repo-frontend", title: "Frontend Repo", blueprint: "githubRepository" },
    { identifier: "repo-backend", title: "Backend Repo", blueprint: "githubRepository" },
  ],
  environment: [
    { identifier: "prod", title: "Production", blueprint: "environment" },
    { identifier: "staging", title: "Staging", blueprint: "environment" },
  ],
};
