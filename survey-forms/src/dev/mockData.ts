import { SPACE_SURVEY } from "../surveys/space";
import type { Entity, SurveyResponseRecord } from "../types";

/**
 * Small local-dev fixtures (skill: implementation.md → Local dev mocks).
 * Active only when DEV_MOCK is true (npm run dev, outside Port's iframe).
 */

export const MOCK_SURVEY_ID = "space-sample";

/** Host entity used in dev to simulate landing on a `survey` entity page. */
export const MOCK_SURVEY_ENTITY: Entity = {
  identifier: MOCK_SURVEY_ID,
  blueprint: "survey",
  title: "SPACE Developer Survey - Sample",
  properties: {
    framework: "SPACE",
    status: "active",
    // Inline definition - proves the entity-driven abstraction in local dev.
    definition: SPACE_SURVEY as unknown as Record<string, unknown>,
  },
};

export const MOCK_SURVEYS: Entity[] = [MOCK_SURVEY_ENTITY];

export const MOCK_RESPONSES: SurveyResponseRecord[] = [
  {
    identifier: "r1",
    respondent: "anonymous",
    submittedAt: "2026-06-10T10:00:00Z",
    dimensionScores: {
      satisfaction: 72,
      performance: 80,
      activity: 65,
      collaboration: 78,
      efficiency: 60,
    },
    overallScore: 71,
  },
  {
    identifier: "r2",
    respondent: "anonymous",
    submittedAt: "2026-06-11T11:00:00Z",
    dimensionScores: {
      satisfaction: 60,
      performance: 70,
      activity: 55,
      collaboration: 65,
      efficiency: 50,
    },
    overallScore: 60,
  },
  {
    identifier: "r3",
    respondent: "anonymous",
    submittedAt: "2026-06-12T09:00:00Z",
    dimensionScores: {
      satisfaction: 85,
      performance: 88,
      activity: 80,
      collaboration: 90,
      efficiency: 75,
    },
    overallScore: 84,
  },
];
