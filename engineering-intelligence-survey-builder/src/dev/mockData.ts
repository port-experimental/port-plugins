import type { Entity } from "../types";
import type { Campaign } from "../api/campaigns";
import { SPACE_SURVEY } from "../surveys/space";
import { AI_ADOPTION_SURVEY } from "../surveys/ai-adoption";

/** A couple of existing survey entities so the dashboard list has content in dev. */
export const MOCK_SURVEYS: Entity[] = [
  {
    identifier: "space-q2-2026",
    title: "SPACE - Q2 2026",
    blueprint: "survey",
    properties: {
      framework: "SPACE",
      status: "active",
      cadence: "quarterly",
      description: SPACE_SURVEY.description,
      definition: SPACE_SURVEY,
    },
  },
  {
    identifier: "ai-q1-2026",
    title: "AI Adoption - Q1 2026",
    blueprint: "survey",
    properties: {
      framework: "AI Adoption",
      status: "closed",
      cadence: "quarterly",
      description: AI_ADOPTION_SURVEY.description,
      definition: AI_ADOPTION_SURVEY,
    },
  },
];

/**
 * Existing campaigns keyed by survey id, so the Share drawer's "Shared with"
 * panel has something to show in dev. `space-q2-2026` is shared; everything
 * else reads as "Not shared yet".
 */
export const MOCK_CAMPAIGNS: Record<string, Campaign> = {
  "space-q2-2026": {
    audience: "teams",
    status: "active",
    deadline: null,
    reminderCadence: "every-3-days",
    channel: "email",
    reminderCount: 2,
    lastNudgedAt: "2026-06-15T09:00:00.000Z",
    teams: ["platform", "mobile"],
  },
};
