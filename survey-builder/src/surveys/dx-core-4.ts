import type { Scale, SurveyDefinition } from "../types";

/**
 * DX Core 4 - the unified framework (DORA + SPACE + DevEx) measuring developer
 * productivity across four balanced outcomes: Speed, Effectiveness, Quality,
 * and Impact. See https://docs.getdx.com/dx-core-4/.
 *
 * DX calculates Core 4 from system telemetry where possible; this template is
 * the *self-reported* half - useful for getting started quickly or validating
 * perceptions. Effectiveness is survey-based by design (the DXI captures lived
 * developer experience that systems can't infer).
 */

const LIKERT: Scale = {
  min: 1,
  max: 5,
  minLabel: "Strongly disagree",
  maxLabel: "Strongly agree",
};

export const DX_CORE_4_SURVEY: SurveyDefinition = {
  id: "dx-core-4",
  title: "DX Core 4 Survey",
  framework: "DX Core 4",
  version: "1.0.0",
  anonymous: true,
  description:
    "A self-reported pulse across the four DX Core 4 outcomes - Speed, Effectiveness, Quality, and Impact - balancing delivery pace with developer experience.",
  scale: LIKERT,
  dimensions: [
    {
      id: "speed",
      name: "Speed",
      color: "#10b981",
      description: "Pace of code integration and the ability to ship quickly.",
    },
    {
      id: "effectiveness",
      name: "Effectiveness",
      color: "#6366f1",
      description: "Developer experience: friction, flow, and the tools to do great work.",
    },
    {
      id: "quality",
      name: "Quality",
      color: "#3b82f6",
      description: "Reliability of changes and the rework they create.",
    },
    {
      id: "impact",
      name: "Impact",
      color: "#ec4899",
      description: "Share of effort going to valuable, new-capability work.",
    },
  ],
  questions: [
    // ── Speed ────────────────────────────────────────────────────────────────
    {
      id: "speed_ship",
      dimension: "speed",
      type: "likert",
      required: true,
      text: "I can move a change from idea to production quickly when I need to.",
    },
    {
      id: "speed_throughput",
      dimension: "speed",
      type: "likert",
      required: true,
      text: "My team integrates and merges work at a healthy, steady pace.",
    },
    // ── Effectiveness (DXI) ──────────────────────────────────────────────────
    {
      id: "eff_tools",
      dimension: "effectiveness",
      type: "likert",
      required: true,
      text: "I have the tools, environments, and information I need to be productive.",
    },
    {
      id: "eff_friction",
      dimension: "effectiveness",
      type: "likert",
      required: true,
      reverse: true,
      text: "I lose significant time to friction, waiting, or context switching.",
      helpText: "Reverse-scored: lower agreement contributes a higher effectiveness score.",
    },
    {
      id: "eff_focus",
      dimension: "effectiveness",
      type: "likert",
      required: true,
      text: "I can regularly get into deep focus to do my most important work.",
    },
    // ── Quality ──────────────────────────────────────────────────────────────
    {
      id: "qual_reliable",
      dimension: "quality",
      type: "likert",
      required: true,
      text: "The changes my team ships are reliable and rarely cause incidents.",
    },
    {
      id: "qual_rework",
      dimension: "quality",
      type: "likert",
      required: true,
      reverse: true,
      text: "A large share of our work is fixing defects or reworking recent changes.",
      helpText: "Reverse-scored: lower agreement contributes a higher quality score.",
    },
    // ── Impact ───────────────────────────────────────────────────────────────
    {
      id: "impact_innovation",
      dimension: "impact",
      type: "likert",
      required: true,
      text: "Most of my time goes to building new capabilities rather than maintenance or overhead.",
    },
    {
      id: "impact_value",
      dimension: "impact",
      type: "likert",
      required: true,
      text: "The work I do delivers clear value to our customers or the business.",
    },
    // ── Free text ─────────────────────────────────────────────────────────────
    {
      id: "biggest_improvement",
      type: "text",
      required: false,
      text: "What single change would most improve your effectiveness?",
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
