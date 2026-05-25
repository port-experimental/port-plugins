import type { BlueprintParam, PortEntity, Scorecard } from "../types";

export const MOCK_BLUEPRINT: BlueprintParam = {
  identifier: "service",
  title: "Service",
};

export const MOCK_SCORECARDS: Scorecard[] = [
  {
    identifier: "ownership",
    title: "Ownership",
    rules: [
      { identifier: "has_team", title: "Has team", level: "Bronze" },
      { identifier: "has_slack", title: "Has Slack channel", level: "Silver" },
    ],
  },
  {
    identifier: "production_readiness",
    title: "Production readiness",
    rules: [
      { identifier: "has_on_call", title: "Has on-call", level: "Bronze" },
      { identifier: "has_runbook", title: "Has runbook", level: "Silver" },
      { identifier: "has_slo", title: "Has SLO", level: "Gold" },
    ],
  },
];

export const MOCK_ENTITIES: PortEntity[] = [
  {
    identifier: "checkout",
    title: "Checkout",
    scorecards: {
      ownership: {
        level: "Silver",
        rules: [
          { identifier: "has_team", status: "Passed" },
          { identifier: "has_slack", status: "Passed" },
        ],
      },
      production_readiness: {
        level: "Bronze",
        rules: [
          { identifier: "has_on_call", status: "Passed" },
          { identifier: "has_runbook", status: "Not passed" },
          { identifier: "has_slo", status: "Not passed" },
        ],
      },
    },
  },
  {
    identifier: "payments",
    title: "Payments",
    scorecards: {
      ownership: {
        level: "Bronze",
        rules: [
          { identifier: "has_team", status: "Passed" },
          { identifier: "has_slack", status: "Not passed" },
        ],
      },
      production_readiness: {
        level: "Basic",
        rules: [
          { identifier: "has_on_call", status: "Not passed" },
          { identifier: "has_runbook", status: "Not passed" },
          { identifier: "has_slo", status: "Not passed" },
        ],
      },
    },
  },
  {
    identifier: "notifications",
    title: "Notifications",
    scorecards: {
      ownership: {
        level: "Silver",
        rules: [
          { identifier: "has_team", status: "Passed" },
          { identifier: "has_slack", status: "Passed" },
        ],
      },
      production_readiness: {
        level: "Gold",
        rules: [
          { identifier: "has_on_call", status: "Passed" },
          { identifier: "has_runbook", status: "Passed" },
          { identifier: "has_slo", status: "Passed" },
        ],
      },
    },
  },
  {
    identifier: "search",
    title: "Search",
    scorecards: {
      ownership: {
        level: "Basic",
        rules: [
          { identifier: "has_team", status: "Not passed" },
          { identifier: "has_slack", status: "Not passed" },
        ],
      },
      production_readiness: {
        level: "Silver",
        rules: [
          { identifier: "has_on_call", status: "Passed" },
          { identifier: "has_runbook", status: "Passed" },
          { identifier: "has_slo", status: "Not passed" },
        ],
      },
    },
  },
];
