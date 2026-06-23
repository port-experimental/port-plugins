import type { Benchmark } from "./types";

/**
 * DORA 2025 software delivery benchmark.
 *
 * Source: "State of AI-assisted Software Development" (DORA, 2025), the
 * "How do you compare?" distributions (Figures 11–15). Each metric's `levels`
 * are keyed by the same choice `value`s used in the DORA survey template
 * (survey-builder/src/surveys/dora.ts), so team answers join directly.
 *
 * `atPct` = % of respondents at that exact answer; `topPct` = cumulative % at
 * that answer or better (percentile rank; lower = more elite). Where the
 * report's printed cumulative differs from the sum of `atPct` by ±0.1 due to
 * rounding, the report's printed `topPct` is used verbatim.
 */
export const DORA_2025: Benchmark = {
  id: "dora-2025",
  framework: "DORA",
  source: "DORA - State of AI-assisted Software Development (2025)",
  publishedYear: 2025,
  sampleSize: 5000,
  window: "2025-06-13/2025-07-21",
  url: "https://dora.dev/research/2025/",
  metrics: {
    // Figure 12 - Deployment frequency
    deploy_frequency: {
      betterDirection: "higher",
      levels: {
        on_demand: { atPct: 16.2, topPct: 16.2 },
        hourly_daily: { atPct: 6.5, topPct: 22.7 },
        daily_weekly: { atPct: 21.9, topPct: 44.6 },
        weekly_monthly: { atPct: 31.5, topPct: 76.1 },
        monthly_sixmonth: { atPct: 20.3, topPct: 96.4 },
        lt_sixmonth: { atPct: 3.6, topPct: 100 },
      },
    },
    // Figure 11 - Lead time for changes
    lead_time: {
      betterDirection: "lower",
      levels: {
        lt_hour: { atPct: 9.4, topPct: 9.4 },
        lt_day: { atPct: 15.0, topPct: 24.4 },
        day_week: { atPct: 31.9, topPct: 56.4 },
        week_month: { atPct: 28.3, topPct: 84.7 },
        month_six: { atPct: 13.2, topPct: 98.0 },
        gt_six: { atPct: 2.0, topPct: 100 },
      },
    },
    // Figure 13 - Failed deployment recovery time
    recovery_time: {
      betterDirection: "lower",
      levels: {
        lt_hour: { atPct: 21.3, topPct: 21.3 },
        lt_day: { atPct: 35.3, topPct: 56.5 },
        day_week: { atPct: 28.0, topPct: 84.5 },
        week_month: { atPct: 9.4, topPct: 93.9 },
        month_six: { atPct: 4.9, topPct: 98.8 },
        gt_six: { atPct: 1.0, topPct: 100 },
      },
    },
    // Figure 14 - Change failure rate
    change_failure: {
      betterDirection: "lower",
      levels: {
        cfr_0_2: { atPct: 8.5, topPct: 8.5 },
        cfr_2_4: { atPct: 8.1, topPct: 16.7 },
        cfr_4_8: { atPct: 19.6, topPct: 36.2 },
        cfr_8_16: { atPct: 26.0, topPct: 62.2 },
        cfr_16_32: { atPct: 19.5, topPct: 81.6 },
        cfr_32_64: { atPct: 12.5, topPct: 94.1 },
        cfr_gt_64: { atPct: 5.9, topPct: 100 },
      },
    },
    // Figure 15 - Rework rate
    rework_rate: {
      betterDirection: "lower",
      levels: {
        rwr_0_2: { atPct: 6.9, topPct: 6.9 },
        rwr_2_4: { atPct: 5.8, topPct: 12.8 },
        rwr_4_8: { atPct: 13.7, topPct: 26.5 },
        rwr_8_16: { atPct: 26.1, topPct: 52.6 },
        rwr_16_32: { atPct: 24.7, topPct: 77.3 },
        rwr_32_64: { atPct: 15.4, topPct: 92.7 },
        rwr_gt_64: { atPct: 7.3, topPct: 100 },
      },
    },
  },
};
