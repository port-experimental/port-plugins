import type {
  FavoritesData,
  PortPage,
  PortAction,
  PortBlueprint,
  PortEntity,
} from "../types";

export const MOCK_FAVORITES: FavoritesData = {
  pages: [
    { identifier: "services-page", title: "Services", type: "blueprint-entities" },
    { identifier: "overview-page", title: "Overview", type: "dashboard" },
  ],
  selfService: [
    {
      identifier: "scaffold_service",
      title: "Scaffold Service",
      description: "Create a new service",
      blueprint: "service",
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

export const MOCK_USER_ENTITY: PortEntity = {
  identifier: "developer@example.com",
  title: "Dev User",
  blueprint: "_user",
  properties: {
    port_role: "Admin",
    status: "Active",
    port_type: "Standard",
    favorites: JSON.stringify(MOCK_FAVORITES),
  },
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
  },
  {
    identifier: "deploy_service",
    title: "Deploy to Production",
    description: "Trigger a production deployment",
    blueprint: "service",
  },
  {
    identifier: "create_jira_bug",
    title: "Create Bug",
    description: "Open a new Jira bug ticket",
    blueprint: "jira_bug",
  },
  {
    identifier: "add_team_member",
    title: "Add Team Member",
    description: "Onboard a new team member",
    blueprint: "_team",
  },
  {
    identifier: "run_security_scan",
    title: "Run Security Scan",
    description: "Trigger a Snyk security scan",
    blueprint: "service",
  },
];

export const MOCK_BLUEPRINTS: PortBlueprint[] = [
  { identifier: "service", title: "Service" },
  { identifier: "githubRepository", title: "Repository" },
  { identifier: "githubPullRequest", title: "Pull Request" },
  { identifier: "githubTeam", title: "GitHub Team" },
  { identifier: "environment", title: "Environment" },
];

export const MOCK_ENTITIES: Record<string, PortEntity[]> = {
  service: [
    { identifier: "my-service", title: "My Service", blueprint: "service" },
    { identifier: "auth-service", title: "Auth Service", blueprint: "service" },
    { identifier: "api-gateway", title: "API Gateway", blueprint: "service" },
    { identifier: "payment-service", title: "Payment Service", blueprint: "service" },
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
