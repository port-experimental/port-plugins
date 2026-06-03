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
      {
        identifier: "has_team",
        title: "Has team",
        level: "Bronze",
        description: "The service must have a responsible team assigned.",
        query: {
          combinator: "and",
          conditions: [{ property: "$team", operator: "isNotEmpty" }],
        },
      },
      {
        identifier: "has_slack",
        title: "Has Slack channel",
        level: "Silver",
        query: {
          combinator: "and",
          conditions: [{ property: "slackChannel", operator: "isNotEmpty" }],
        },
      },
    ],
  },
  {
    identifier: "production_readiness",
    title: "Production readiness",
    rules: [
      {
        identifier: "has_on_call",
        title: "Has on-call",
        level: "Bronze",
        query: {
          combinator: "and",
          conditions: [{ property: "on_call", operator: "isNotEmpty" }],
        },
      },
      {
        identifier: "has_runbook",
        title: "Has runbook",
        level: "Silver",
        query: {
          combinator: "and",
          conditions: [{ property: "runbook_url", operator: "isNotEmpty" }],
        },
      },
      {
        identifier: "has_slo",
        title: "Has SLO",
        level: "Gold",
        query: {
          combinator: "and",
          conditions: [{ property: "slo_defined", operator: "=", value: true }],
        },
      },
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
          {
            identifier: "has_runbook",
            status: "Not passed",
            message: "runbook_url is empty on this service.",
          },
          {
            identifier: "has_slo",
            status: "Not passed",
            message: "slo_defined is false; an SLO must be configured.",
          },
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
          {
            identifier: "has_slack",
            status: "Not passed",
            message: "slackChannel is not set.",
          },
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
