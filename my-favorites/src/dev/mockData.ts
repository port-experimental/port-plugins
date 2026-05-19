import type {
  FavoritesData,
  PortActionSummary,
  PortBlueprintSummary,
  PortEntitySummary,
  PortPageSummary,
} from "../types";

export const MOCK_USER_EMAIL = "alice@example.com";
export const MOCK_USER_ENTITY_ID = "alice@example.com";

export const MOCK_PAGES: PortPageSummary[] = [
  {
    identifier: "services",
    title: "Services",
    type: "blueprint-entities",
    blueprint: "service",
    sidebarType: "page",
  },
  {
    identifier: "plan_my_day",
    title: "Plan my day",
    type: "dashboard",
    sidebarType: "page",
  },
];

export const MOCK_ACTIONS: PortActionSummary[] = [
  {
    identifier: "deploy_service",
    title: "Deploy service",
    description: "Deploy a service to the cluster",
    trigger: { type: "self-service" },
  },
  {
    identifier: "create_repo",
    title: "Create repository",
    description: "Scaffold a new repository",
    trigger: { type: "self-service" },
  },
];

export const MOCK_BLUEPRINTS: PortBlueprintSummary[] = [
  { identifier: "service", title: "Service" },
  { identifier: "githubRepository", title: "Repository" },
];

export const MOCK_ENTITIES: PortEntitySummary[] = [
  {
    identifier: "payments-api",
    title: "Payments API",
    blueprint: "service",
  },
  {
    identifier: "checkout-ui",
    title: "Checkout UI",
    blueprint: "service",
  },
  {
    identifier: "port-plugins",
    title: "port-plugins",
    blueprint: "githubRepository",
  },
];

export const MOCK_FAVORITES: FavoritesData = {
  pages: [
    {
      identifier: "services",
      title: "Services",
      pageType: "blueprint-entities",
    },
  ],
  actions: [],
  entities: [],
};
