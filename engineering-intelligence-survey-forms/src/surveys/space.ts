import type { Scale, SurveyDefinition } from "../types";

/**
 * SPACE - the flagship built-in survey template.
 *
 * SPACE (Forsgren, Storey, Maddila, Zimmermann, Houck, Butler - Microsoft
 * Research / GitHub / University of Victoria) measures developer productivity
 * across five complementary dimensions. Survey signal is the *subjective* half
 * of SPACE; pair it with delivery metrics (DORA, etc.) for the full picture.
 *
 * This object is the single source of truth shipped in the build. The same
 * shape can live on a `survey` entity's `definition` property - when present
 * there, it overrides this template so questions/scales change with no rebuild.
 */

const LIKERT: Scale = {
  min: 1,
  max: 5,
  minLabel: "Strongly disagree",
  maxLabel: "Strongly agree",
};

export const SPACE_SURVEY: SurveyDefinition = {
  id: "space",
  title: "SPACE Developer Experience Survey",
  framework: "SPACE",
  version: "1.0.0",
  anonymous: true,
  description:
    "A research-backed pulse across the five SPACE dimensions: Satisfaction & well-being, Performance, Activity, Communication & collaboration, and Efficiency & flow.",
  scale: LIKERT,
  dimensions: [
    {
      id: "satisfaction",
      name: "Satisfaction & well-being",
      color: "#6366f1",
      description: "How fulfilled, healthy, and supported developers feel.",
    },
    {
      id: "performance",
      name: "Performance",
      color: "#10b981",
      description: "Perceived quality and outcomes of the work delivered.",
    },
    {
      id: "activity",
      name: "Activity",
      color: "#f59e0b",
      description: "Ability to get a healthy amount of meaningful work done.",
    },
    {
      id: "collaboration",
      name: "Communication & collaboration",
      color: "#3b82f6",
      description: "How effectively people share knowledge and work together.",
    },
    {
      id: "efficiency",
      name: "Efficiency & flow",
      color: "#ec4899",
      description:
        "Ability to make progress with minimal friction and interruptions.",
    },
  ],
  questions: [
    {
      id: "sat_satisfied",
      dimension: "satisfaction",
      type: "likert",
      required: true,
      text: "I am satisfied with my work as a developer on this team.",
    },
    {
      id: "sat_exhausted",
      dimension: "satisfaction",
      type: "likert",
      required: true,
      reverse: true,
      text: "I often feel emotionally or physically exhausted by my work.",
      helpText:
        "Reverse-scored: lower agreement contributes a higher well-being score.",
    },
    {
      id: "perf_quality",
      dimension: "performance",
      type: "likert",
      required: true,
      text: "The software my team produces is high quality and reliable.",
    },
    {
      id: "perf_commitments",
      dimension: "performance",
      type: "likert",
      required: true,
      text: "My team consistently delivers on the commitments it makes.",
    },
    {
      id: "act_meaningful",
      dimension: "activity",
      type: "likert",
      required: true,
      text: "I am able to complete a healthy amount of meaningful work each week.",
    },
    {
      id: "act_routine",
      dimension: "activity",
      type: "likert",
      required: true,
      text: "Routine tasks (builds, reviews, deployments) are easy to get done.",
    },
    {
      id: "collab_knowledge",
      dimension: "collaboration",
      type: "likert",
      required: true,
      text: "Information and knowledge are shared effectively within my team.",
    },
    {
      id: "collab_reviews",
      dimension: "collaboration",
      type: "likert",
      required: true,
      text: "Code reviews on my team are timely and constructive.",
    },
    {
      id: "eff_flow",
      dimension: "efficiency",
      type: "likert",
      required: true,
      text: "I can regularly get into a state of focus and flow during my workday.",
    },
    {
      id: "eff_blocked",
      dimension: "efficiency",
      type: "likert",
      required: true,
      reverse: true,
      text: "I am frequently blocked waiting on other people, teams, or systems.",
      helpText:
        "Reverse-scored: lower agreement contributes a higher flow score.",
    },
    {
      id: "biggest_improvement",
      type: "text",
      required: false,
      text: "What is the single biggest change that would improve your effectiveness?",
      helpText: "Optional - free text.",
    },
    {
      id: "additional_comments",
      type: "text",
      required: false,
      text: "Additional feedback and comments",
      helpText: "Optional - anything else you would like to share.",
    },
  ],
};
