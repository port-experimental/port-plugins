import { SPACE_SURVEY } from "../surveys/space";
import type { AnalyticsResponse, Params, SurveyMeta } from "../types";

export const MOCK_PARAMS: Params = {
  surveyBlueprint: { type: "blueprint", value: { identifier: "survey" } },
  responseBlueprint: { type: "blueprint", value: { identifier: "surveyResponse" } },
};

const makeDefinition = (title: string) => ({
  ...SPACE_SURVEY,
  title,
});

const TARGETS = { platform: 8, backend: 6, frontend: 10, data: 5 };

export const MOCK_SURVEYS: SurveyMeta[] = [
  {
    identifier: "space-q2-2026",
    title: "SPACE Survey - Q2 2026",
    framework: "SPACE",
    status: "active",
    createdAt: "2026-04-01T00:00:00Z",
    targetRespondents: TARGETS,
    definition: makeDefinition("SPACE Survey - Q2 2026"),
  },
  {
    identifier: "space-q1-2026",
    title: "SPACE Survey - Q1 2026",
    framework: "SPACE",
    status: "closed",
    createdAt: "2026-01-01T00:00:00Z",
    targetRespondents: TARGETS,
    definition: makeDefinition("SPACE Survey - Q1 2026"),
  },
  {
    identifier: "space-q4-2025",
    title: "SPACE Survey - Q4 2025",
    framework: "SPACE",
    status: "closed",
    createdAt: "2025-10-01T00:00:00Z",
    targetRespondents: TARGETS,
    definition: makeDefinition("SPACE Survey - Q4 2025"),
  },
];

const makeResponse = (
  id: string,
  surveyId: string,
  team: string,
  date: string,
  scores: Record<string, number>,
  overall: number,
  enps: number
): AnalyticsResponse => ({
  identifier: id,
  respondent: "anonymous",
  submittedAt: date,
  team,
  surveyId,
  dimensionScores: scores,
  overallScore: overall,
  answers: {
    sat_satisfied: Math.round(scores.satisfaction / 25) + 1,
    sat_exhausted: 5 - Math.round(scores.satisfaction / 25),
    perf_quality: Math.round(scores.performance / 25) + 1,
    perf_commitments: Math.round(scores.performance / 25) + 1,
    act_meaningful: Math.round(scores.activity / 25) + 1,
    act_routine: Math.round(scores.activity / 25) + 1,
    collab_knowledge: Math.round(scores.collaboration / 25) + 1,
    collab_reviews: Math.round(scores.collaboration / 25) + 1,
    eff_flow: Math.round(scores.efficiency / 25) + 1,
    eff_blocked: 5 - Math.round(scores.efficiency / 25),
    enps: enps === 100 ? 9 : enps === 0 ? 7 : 4,
    ...(team === "platform" ? { biggest_improvement: "Reduce on-call toil" } : {}),
  },
});

export const MOCK_RESPONSES_BY_SURVEY: Record<string, AnalyticsResponse[]> = {
  "space-q2-2026": [
    makeResponse("r1", "space-q2-2026", "platform", "2026-04-10T10:00:00Z", { satisfaction: 72, performance: 80, activity: 65, collaboration: 78, efficiency: 60 }, 71, 100),
    makeResponse("r2", "space-q2-2026", "platform", "2026-04-11T11:00:00Z", { satisfaction: 60, performance: 70, activity: 55, collaboration: 65, efficiency: 50 }, 60, 0),
    makeResponse("r3", "space-q2-2026", "platform", "2026-04-12T09:00:00Z", { satisfaction: 85, performance: 88, activity: 80, collaboration: 90, efficiency: 75 }, 84, 100),
    makeResponse("r4", "space-q2-2026", "backend", "2026-04-10T14:00:00Z", { satisfaction: 68, performance: 75, activity: 70, collaboration: 72, efficiency: 65 }, 70, 0),
    makeResponse("r5", "space-q2-2026", "backend", "2026-04-13T10:00:00Z", { satisfaction: 90, performance: 85, activity: 82, collaboration: 88, efficiency: 80 }, 85, 100),
    makeResponse("r6", "space-q2-2026", "frontend", "2026-04-11T16:00:00Z", { satisfaction: 55, performance: 60, activity: 50, collaboration: 58, efficiency: 45 }, 54, -100),
    makeResponse("r7", "space-q2-2026", "frontend", "2026-04-14T09:00:00Z", { satisfaction: 78, performance: 72, activity: 68, collaboration: 75, efficiency: 70 }, 73, 100),
    makeResponse("r8", "space-q2-2026", "frontend", "2026-04-15T11:00:00Z", { satisfaction: 82, performance: 78, activity: 75, collaboration: 80, efficiency: 72 }, 77, 0),
    // "data" team - only 2 responses → below anonymity floor, scores hidden.
    makeResponse("r9", "space-q2-2026", "data", "2026-04-12T13:00:00Z", { satisfaction: 70, performance: 74, activity: 66, collaboration: 72, efficiency: 64 }, 69, 0),
    makeResponse("r10", "space-q2-2026", "data", "2026-04-16T10:00:00Z", { satisfaction: 75, performance: 78, activity: 70, collaboration: 76, efficiency: 68 }, 73, 100),
  ],
  "space-q1-2026": [
    makeResponse("q1r1", "space-q1-2026", "platform", "2026-01-15T10:00:00Z", { satisfaction: 65, performance: 72, activity: 60, collaboration: 70, efficiency: 55 }, 64, 0),
    makeResponse("q1r2", "space-q1-2026", "platform", "2026-01-16T11:00:00Z", { satisfaction: 55, performance: 62, activity: 50, collaboration: 60, efficiency: 48 }, 55, -100),
    makeResponse("q1r3", "space-q1-2026", "backend", "2026-01-15T14:00:00Z", { satisfaction: 60, performance: 68, activity: 62, collaboration: 65, efficiency: 58 }, 63, 0),
    makeResponse("q1r4", "space-q1-2026", "backend", "2026-01-17T10:00:00Z", { satisfaction: 82, performance: 80, activity: 78, collaboration: 85, efficiency: 75 }, 80, 100),
    makeResponse("q1r5", "space-q1-2026", "frontend", "2026-01-16T16:00:00Z", { satisfaction: 50, performance: 55, activity: 45, collaboration: 52, efficiency: 40 }, 48, -100),
    makeResponse("q1r6", "space-q1-2026", "frontend", "2026-01-18T09:00:00Z", { satisfaction: 70, performance: 65, activity: 62, collaboration: 68, efficiency: 62 }, 65, 0),
  ],
  "space-q4-2025": [
    makeResponse("q4r1", "space-q4-2025", "platform", "2025-10-10T10:00:00Z", { satisfaction: 58, performance: 65, activity: 55, collaboration: 62, efficiency: 50 }, 58, -100),
    makeResponse("q4r2", "space-q4-2025", "backend", "2025-10-11T11:00:00Z", { satisfaction: 72, performance: 75, activity: 70, collaboration: 78, efficiency: 68 }, 73, 100),
    makeResponse("q4r3", "space-q4-2025", "frontend", "2025-10-12T09:00:00Z", { satisfaction: 48, performance: 52, activity: 44, collaboration: 50, efficiency: 38 }, 46, -100),
  ],
};
