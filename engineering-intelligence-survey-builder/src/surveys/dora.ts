import type { Scale, SurveyDefinition } from "../types";

/**
 * DORA - the software delivery metrics as a *self-reported* pulse, aligned to
 * the 2025 DORA report ("State of AI-assisted Software Development").
 *
 * The 2025 report groups delivery performance into two factors:
 *   • Throughput  - lead time for changes, deployment frequency, and failed
 *                   deployment recovery time.
 *   • Instability - change failure rate and rework rate (lower is better).
 *
 * The answer buckets below mirror the report's survey questions exactly so each
 * response joins 1:1 to the published benchmark distribution (Figures 11–15).
 * Each single-choice item is scored best…worst and carries a `benchmark` tag
 * (`source: "dora-2025"`) that the analytics "Benchmark" view resolves to the
 * reference percentiles. Dimensions are scored 0–100 where higher = better, so
 * the instability metrics are scored inverted (a low change-failure rate earns
 * the top score) and the dimension reads as "Stability".
 *
 * System telemetry is the better source for DORA when you have it - treat this
 * survey as a fast way to baseline perception or fill gaps in coverage.
 */

const LIKERT: Scale = {
  min: 1,
  max: 5,
  minLabel: "Strongly disagree",
  maxLabel: "Strongly agree",
};

const SOURCE = "dora-2025";

export const DORA_SURVEY: SurveyDefinition = {
  id: "dora",
  title: "DORA Delivery Performance Survey",
  framework: "DORA",
  // Report alignment lives in the version (surfaced as a read-only year badge);
  // `framework` stays "DORA" so surveys across years trend together.
  version: "2025.1",
  anonymous: true,
  description:
    "A self-reported read on DORA's software delivery metrics, aligned to the 2025 DORA report: deployment frequency, lead time for changes, and failed deployment recovery time (throughput), plus change failure rate and rework rate (stability).",
  scale: LIKERT,
  dimensions: [
    {
      id: "throughput",
      name: "Throughput",
      color: "#10b981",
      description:
        "How quickly and how often the team gets changes to production - lead time, deployment frequency, and recovery time.",
    },
    {
      id: "stability",
      name: "Stability",
      color: "#3b82f6",
      description:
        "How reliably changes land - DORA's instability factors (change failure rate and rework rate), scored so higher = more stable.",
    },
  ],
  questions: [
    {
      id: "deploy_frequency",
      dimension: "throughput",
      type: "single_choice",
      required: true,
      text: "How often does your team deploy code to production or release it to end users?",
      benchmark: { source: SOURCE, metric: "deploy_frequency" },
      choices: [
        { value: "on_demand", label: "On demand (multiple deploys per day)", shortLabel: "On-demand", score: 5 },
        { value: "hourly_daily", label: "Between once per hour and once per day", shortLabel: "Hourly–daily", score: 4 },
        { value: "daily_weekly", label: "Between once per day and once per week", shortLabel: "Daily–weekly", score: 3 },
        { value: "weekly_monthly", label: "Between once per week and once per month", shortLabel: "Weekly–monthly", score: 2 },
        { value: "monthly_sixmonth", label: "Between once per month and once every six months", shortLabel: "Monthly–6mo", score: 1 },
        { value: "lt_sixmonth", label: "Fewer than once per six months", shortLabel: "<1/6mo", score: 0 },
      ],
    },
    {
      id: "lead_time",
      dimension: "throughput",
      type: "single_choice",
      required: true,
      text: "What is your lead time for changes - how long does it take to go from code committed to code successfully running in production?",
      benchmark: { source: SOURCE, metric: "lead_time" },
      choices: [
        { value: "lt_hour", label: "Less than one hour", shortLabel: "<1h", score: 5 },
        { value: "lt_day", label: "Less than one day", shortLabel: "<1d", score: 4 },
        { value: "day_week", label: "Between one day and one week", shortLabel: "1d–1wk", score: 3 },
        { value: "week_month", label: "Between one week and one month", shortLabel: "1wk–1mo", score: 2 },
        { value: "month_six", label: "Between one month and six months", shortLabel: "1–6mo", score: 1 },
        { value: "gt_six", label: "More than six months", shortLabel: ">6mo", score: 0 },
      ],
    },
    {
      id: "recovery_time",
      dimension: "throughput",
      type: "single_choice",
      required: true,
      text: "How long does it generally take to restore service after a failed deployment - a change to production that degrades service and requires remediation (hotfix, rollback, fix forward, or patch)?",
      benchmark: { source: SOURCE, metric: "recovery_time" },
      choices: [
        { value: "lt_hour", label: "Less than one hour", shortLabel: "<1h", score: 5 },
        { value: "lt_day", label: "Less than one day", shortLabel: "<1d", score: 4 },
        { value: "day_week", label: "Between one day and one week", shortLabel: "1d–1wk", score: 3 },
        { value: "week_month", label: "Between one week and one month", shortLabel: "1wk–1mo", score: 2 },
        { value: "month_six", label: "Between one month and six months", shortLabel: "1–6mo", score: 1 },
        { value: "gt_six", label: "More than six months", shortLabel: ">6mo", score: 0 },
      ],
    },
    {
      id: "change_failure",
      dimension: "stability",
      type: "single_choice",
      required: true,
      text: "When your team ships a change to production, how often does it cause a problem that needs a fix (hotfix, rollback, or patch)?",
      helpText: "A rough estimate is fine. If unsure, think back over your last 10 to 20 changes. Lower is better.",
      benchmark: { source: SOURCE, metric: "change_failure" },
      choices: [
        { value: "cfr_0_2", label: "Almost never (0–2%)", shortLabel: "0–2%", score: 6 },
        { value: "cfr_2_4", label: "Very rarely (2–4%)", shortLabel: "2–4%", score: 5 },
        { value: "cfr_4_8", label: "Rarely (4–8%)", shortLabel: "4–8%", score: 4 },
        { value: "cfr_8_16", label: "Sometimes (8–16%)", shortLabel: "8–16%", score: 3 },
        { value: "cfr_16_32", label: "Fairly often (16–32%)", shortLabel: "16–32%", score: 2 },
        { value: "cfr_32_64", label: "Often (32–64%)", shortLabel: "32–64%", score: 1 },
        { value: "cfr_gt_64", label: "Most of the time (over 64%)", shortLabel: ">64%", score: 0 },
      ],
    },
    {
      id: "rework_rate",
      dimension: "stability",
      type: "single_choice",
      required: true,
      text: "How often is one of your team's deployments an unplanned fix for a user-facing bug, rather than planned work?",
      helpText: "A rough estimate is fine. Think of your deployments over the last few months. Lower is better.",
      benchmark: { source: SOURCE, metric: "rework_rate" },
      choices: [
        { value: "rwr_0_2", label: "Almost never (0–2%)", shortLabel: "0–2%", score: 6 },
        { value: "rwr_2_4", label: "Very rarely (2–4%)", shortLabel: "2–4%", score: 5 },
        { value: "rwr_4_8", label: "Rarely (4–8%)", shortLabel: "4–8%", score: 4 },
        { value: "rwr_8_16", label: "Sometimes (8–16%)", shortLabel: "8–16%", score: 3 },
        { value: "rwr_16_32", label: "Fairly often (16–32%)", shortLabel: "16–32%", score: 2 },
        { value: "rwr_32_64", label: "Often (32–64%)", shortLabel: "32–64%", score: 1 },
        { value: "rwr_gt_64", label: "Most of the time (over 64%)", shortLabel: ">64%", score: 0 },
      ],
    },
    {
      id: "delivery_confidence",
      dimension: "stability",
      type: "likert",
      required: true,
      text: "I am confident that our delivery process catches problems before they reach customers.",
    },
    {
      id: "delivery_friction",
      type: "text",
      required: false,
      text: "What is the single biggest source of friction in getting changes to production?",
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
