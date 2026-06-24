import type { Scale, SurveyDefinition } from "../types";

/**
 * AI Adoption & Impact - a built-in survey template focused on the *outcomes*
 * of AI tooling: is it actually helping teams ship faster, reclaim time, and
 * raise quality, and how broadly has it been adopted.
 *
 * The framing is deliberately ROI-leaning. The five dimensions trace the value
 * chain of an AI investment: you can only get impact from tools people actually
 * use (Adoption), the value shows up first as Velocity and Time saved, has to
 * clear a Quality bar to count, and ultimately should free people for higher
 * Impact work. Pair the subjective signal here with hard delivery metrics
 * (DORA, cycle time, tool telemetry) for the full picture.
 *
 * Kept in sync with the runner plugin's copy. At runtime a `survey` entity's
 * own `definition` property overrides this template, so this is mostly a
 * source-of-truth / fallback.
 */

const LIKERT: Scale = {
  min: 1,
  max: 5,
  minLabel: "Strongly disagree",
  maxLabel: "Strongly agree",
};

export const AI_ADOPTION_SURVEY: SurveyDefinition = {
  id: "ai-adoption",
  title: "AI Adoption & Impact Survey",
  framework: "AI Adoption",
  version: "1.0.0",
  anonymous: true,
  description:
    "An outcome-focused pulse on how AI tooling is helping the team: how broadly it is adopted and the impact it has on velocity, time saved, quality, and high-value work.",
  scale: LIKERT,
  dimensions: [
    {
      id: "adoption",
      name: "Adoption & reach",
      color: "#8b5cf6",
      description:
        "How regularly and broadly AI tools are woven into day-to-day work.",
    },
    {
      id: "velocity",
      name: "Velocity",
      color: "#10b981",
      description: "Whether AI helps work get completed and shipped faster.",
    },
    {
      id: "time_saved",
      name: "Time & toil saved",
      color: "#f59e0b",
      description: "Hours reclaimed from repetitive, manual work.",
    },
    {
      id: "quality",
      name: "Quality & rework",
      color: "#3b82f6",
      description:
        "AI's effect on output quality and the review/rework it creates.",
    },
    {
      id: "impact",
      name: "Focus & business impact",
      color: "#ec4899",
      description:
        "Whether AI shifts effort toward high-value work and faster delivery.",
    },
  ],
  questions: [
    // ── Adoption & reach ────────────────────────────────────────────────────
    {
      id: "adopt_frequency",
      dimension: "adoption",
      type: "single_choice",
      required: true,
      text: "How often do you use AI tools (coding assistants, chat, agents) in your work?",
      choices: [
        { value: "never", label: "Never", shortLabel: "Never", score: 0 },
        { value: "monthly", label: "A few times a month", shortLabel: "Monthly", score: 1 },
        { value: "weekly", label: "A few times a week", shortLabel: "Weekly", score: 2 },
        { value: "daily", label: "Daily", shortLabel: "Daily", score: 3 },
        { value: "constant", label: "Many times a day", shortLabel: "Constant", score: 4 },
      ],
    },
    {
      id: "adopt_breadth",
      dimension: "adoption",
      type: "likert",
      required: true,
      text: "I rely on AI across many parts of my work - coding, testing, reviews, docs, and debugging.",
    },
    // ── Velocity ──────────────────────────────────────────────────────────────
    {
      id: "vel_faster",
      dimension: "velocity",
      type: "likert",
      required: true,
      text: "AI tools help me complete my tasks noticeably faster.",
    },
    {
      id: "vel_ship",
      dimension: "velocity",
      type: "likert",
      required: true,
      text: "My team ships work sooner because of AI assistance.",
    },
    // ── Time & toil saved ──────────────────────────────────────────────────────
    {
      id: "time_toil",
      dimension: "time_saved",
      type: "likert",
      required: true,
      text: "AI removes a meaningful amount of repetitive, manual work from my week.",
    },
    {
      id: "time_hours",
      dimension: "time_saved",
      type: "single_choice",
      required: true,
      text: "Roughly how much time does AI save you in a typical week?",
      choices: [
        { value: "none", label: "None", shortLabel: "None", score: 0 },
        { value: "lt1", label: "Less than 1 hour", shortLabel: "<1h", score: 1 },
        { value: "1to3", label: "1–3 hours", shortLabel: "1–3h", score: 2 },
        { value: "3to6", label: "3–6 hours", shortLabel: "3–6h", score: 3 },
        { value: "gt6", label: "More than 6 hours", shortLabel: ">6h", score: 4 },
      ],
    },
    // ── Quality & rework ────────────────────────────────────────────────────────
    {
      id: "qual_better",
      dimension: "quality",
      type: "likert",
      required: true,
      text: "The quality and reliability of the work I produce has improved with AI.",
    },
    {
      id: "qual_rework",
      dimension: "quality",
      type: "likert",
      required: true,
      reverse: true,
      text: "I spend significant extra time reviewing or correcting AI-generated output.",
      helpText:
        "Reverse-scored: lower agreement contributes a higher quality score.",
    },
    // ── Focus & business impact ──────────────────────────────────────────────────
    {
      id: "impact_highvalue",
      dimension: "impact",
      type: "likert",
      required: true,
      text: "AI frees me to spend more time on high-value, complex, or creative work.",
    },
    {
      id: "impact_customer",
      dimension: "impact",
      type: "likert",
      required: true,
      text: "AI assistance helps my team deliver value to customers faster.",
    },
    // ── Tooling mix, free text ───────────────────────────────────────────────────
    {
      id: "tools_used",
      type: "multi_choice",
      required: false,
      text: "Which AI tools do you regularly use?",
      helpText: "Select all that apply.",
      choices: [
        { value: "github-copilot", label: "GitHub Copilot" },
        { value: "cursor", label: "Cursor" },
        { value: "claude-code", label: "Claude Code / claude.ai" },
        { value: "chatgpt", label: "ChatGPT" },
        { value: "jetbrains-ai", label: "JetBrains AI Assistant" },
        { value: "internal", label: "Internal / custom tooling" },
        { value: "none", label: "None yet" },
      ],
    },
    {
      id: "ai_value",
      type: "text",
      required: false,
      text: "Where has AI delivered the most value for you - and where could it deliver more?",
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
