import { SPACE_SURVEY } from "../surveys/space";
import type { Entity } from "../types";

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
