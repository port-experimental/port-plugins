import type { Entity, Params } from "../types";

// Params passed to the widget in local dev (outside Port's iframe).
export const MOCK_PARAMS: Params = {
  copilotOrgUsageBlueprint: {
    type: "blueprint",
    value: { identifier: "organization-usage-metrics", title: "Org usage metrics" },
  },
  licensedSeats: { type: "number", value: 20 },
  dayProp: { type: "string", value: "day" },
};

// ── Synthetic daily records ───────────────────────────────────────────────────
// Generated relative to "today" so the default 30-day window always has data,
// with a gentle upward adoption trend and deterministic day-to-day variation.

const DAYS = 45;

function isoDay(offsetFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetFromToday);
  return d.toISOString().slice(0, 10);
}

/** Deterministic wobble in [-1, 1] so charts look organic without Math.random. */
function wobble(i: number, seed: number): number {
  return Math.sin(i * 0.7 + seed) * 0.5 + Math.sin(i * 0.29 + seed * 2) * 0.5;
}

function activity(i: number): { gen: number; acc: number } {
  const ramp = 0.55 + 0.45 * (i / (DAYS - 1)); // adoption grows over the window
  const gen = Math.round((150 + 140 * ramp) * (1 + 0.18 * wobble(i, 1)));
  const acc = Math.round(gen * (0.17 + 0.06 * ramp) * (1 + 0.1 * wobble(i, 3)));
  return { gen: Math.max(0, gen), acc: Math.max(0, acc) };
}

function makeDay(i: number, orgSlug = "my-github-org", orgId = "97434394", dauScale = 1): Entity {
  const day = isoDay(-(DAYS - 1 - i));
  const ramp = i / (DAYS - 1);
  const { gen, acc } = activity(i);

  const dau = Math.max(1, Math.round((5 + 8 * ramp + 1.5 * wobble(i, 5)) * dauScale));
  const wau = Math.round(dau * 1.9 + 1);
  const mau = Math.min(Math.round(20 * dauScale), Math.round(dau * 2.3 + 2));

  const locSuggested = Math.round(gen * dauScale * 1.25);
  const locAdded = Math.round(acc * dauScale * 1.5);

  const langSplit = [
    { language: "typescript", w: 0.42 },
    { language: "python", w: 0.28 },
    { language: "markdown", w: 0.16 },
    { language: "go", w: 0.09 },
    { language: "java", w: 0.05 },
  ];

  const cliInteractions = Math.max(0, Math.round(4 + 3 * wobble(i, 7)));

  const gen2 = Math.round(gen * dauScale);
  const acc2 = Math.round(acc * dauScale);

  return {
    identifier: `oum-${orgSlug}-${day}`,
    title: orgSlug,
    blueprint: "githubCopilotOrganizationUsage",
    properties: {
      record_date: `${day}T00:00:00Z`,
      organization_id: orgId,
      organization_name: orgSlug,
      enterprise_id: "232528",

      daily_active_users: dau,
      daily_active_cli_users: Math.max(1, Math.round(dau * 0.4)),
      daily_active_copilot_cloud_agent_users: Math.max(0, Math.round(dau * 0.5)),
      weekly_active_users: wau,
      weekly_active_copilot_cloud_agent_users: Math.round(wau * 0.55),
      monthly_active_users: mau,
      monthly_active_chat_users: Math.round(mau * 0.3),
      monthly_active_agent_users: Math.round(mau * 0.2),
      monthly_active_copilot_cloud_agent_users: Math.round(mau * 0.5),

      user_initiated_interaction_count: cliInteractions,
      code_generation_activity_count: gen2,
      code_acceptance_activity_count: acc2,
      loc_suggested_to_add_sum: locSuggested,
      loc_suggested_to_delete_sum: 0,
      loc_added_sum: locAdded,
      loc_deleted_sum: 0,

      daily_active_copilot_code_review_users: Math.max(0, Math.round(dau * 0.15)),
      weekly_active_copilot_code_review_users: Math.max(0, Math.round(wau * 0.15)),
      monthly_active_copilot_code_review_users: Math.max(1, Math.round(mau * 0.25)),
      daily_passive_copilot_code_review_users: Math.max(0, Math.round(dau * 0.5)),
      weekly_passive_copilot_code_review_users: Math.max(1, Math.round(wau * 0.45)),
      monthly_passive_copilot_code_review_users: Math.max(1, Math.round(mau * 0.4)),

      totals_by_ide: [
        {
          ide: "vscode",
          code_generation_activity_count: Math.round(gen2 * 0.6),
          code_acceptance_activity_count: Math.round(acc2 * 0.62),
          loc_added_sum: Math.round(locAdded * 0.62),
          loc_suggested_to_add_sum: Math.round(locSuggested * 0.6),
        },
        {
          ide: "neovim",
          code_generation_activity_count: Math.round(gen2 * 0.28),
          code_acceptance_activity_count: Math.round(acc2 * 0.26),
          loc_added_sum: Math.round(locAdded * 0.26),
          loc_suggested_to_add_sum: Math.round(locSuggested * 0.28),
        },
        {
          ide: "webstorm",
          code_generation_activity_count: Math.round(gen2 * 0.12),
          code_acceptance_activity_count: Math.round(acc2 * 0.12),
          loc_added_sum: Math.round(locAdded * 0.12),
          loc_suggested_to_add_sum: Math.round(locSuggested * 0.12),
        },
      ],
      totals_by_feature: [
        {
          feature: "code_completion",
          code_generation_activity_count: gen2,
          code_acceptance_activity_count: acc2,
          loc_added_sum: locAdded,
          loc_suggested_to_add_sum: locSuggested,
        },
        {
          feature: "copilot_cli",
          user_initiated_interaction_count: cliInteractions,
          code_generation_activity_count: 0,
          code_acceptance_activity_count: 0,
          loc_added_sum: 0,
          loc_suggested_to_add_sum: 0,
        },
      ],
      totals_by_language_feature: langSplit.map((l) => ({
        language: l.language,
        feature: "code_completion",
        code_generation_activity_count: Math.round(gen2 * l.w),
        code_acceptance_activity_count: Math.round(acc2 * l.w),
        loc_added_sum: Math.round(locAdded * l.w),
        loc_suggested_to_add_sum: Math.round(locSuggested * l.w),
      })),
      totals_by_language_model: [
        { language: "others", model: "others", code_generation_activity_count: 0 },
      ],
      totals_by_model_feature: [
        {
          model: "gpt-4o",
          feature: "code_completion",
          code_generation_activity_count: Math.round(gen2 * 0.7),
          code_acceptance_activity_count: Math.round(acc2 * 0.7),
          loc_added_sum: Math.round(locAdded * 0.7),
        },
        {
          model: "gpt-5.2",
          feature: "copilot_cli",
          user_initiated_interaction_count: cliInteractions,
          code_generation_activity_count: Math.round(gen2 * 0.3),
          code_acceptance_activity_count: Math.round(acc2 * 0.3),
          loc_added_sum: Math.round(locAdded * 0.3),
        },
      ],
      totals_by_ai_adoption_phase: [
        {
          phase: "No Cohort",
          phase_number: 0,
          total_engaged_users: Math.max(1, Math.round(mau * 0.2)),
        },
        {
          phase: "Phase 1",
          phase_number: 1,
          total_engaged_users: Math.max(1, Math.round(mau * 0.25)),
        },
        {
          phase: "Phase 2",
          phase_number: 2,
          total_engaged_users: Math.max(1, Math.round(mau * 0.25)),
        },
        {
          phase: "Phase 3",
          phase_number: 3,
          total_engaged_users: Math.max(1, Math.round(mau * 0.3)),
        },
      ],

      pull_requests: {
        total_reviewed: Math.max(1, Math.round(3 + 4 * wobble(i, 9) + 3)),
        total_created: Math.max(1, Math.round(4 + 3 * wobble(i, 11) + 3)),
        total_created_by_copilot: Math.round(ramp * 2),
        total_reviewed_by_copilot: Math.max(0, Math.round(1 + 2 * ramp)),
        total_merged: Math.round(2 + 2 * ramp),
        median_minutes_to_merge: Math.max(60, Math.round(300 + 200 * wobble(i, 13))),
        total_suggestions: Math.round(2 + 3 * ramp),
        total_applied_suggestions: Math.round(ramp),
        total_copilot_suggestions: Math.round(1 + 2 * ramp),
        total_copilot_applied_suggestions: Math.round(ramp),
        copilot_suggestions_by_comment_type: [
          { comment_type: "bug", total_copilot_suggestions: 1, total_copilot_applied_suggestions: 0 },
          { comment_type: "security", total_copilot_suggestions: 1, total_copilot_applied_suggestions: 0 },
        ],
      },
      totals_by_cli: {
        session_count: Math.max(1, Math.round(2 + 3 * ramp)),
        request_count: Math.round(40 + 60 * ramp),
        prompt_count: cliInteractions,
        token_usage: {
          output_tokens_sum: Math.round(30000 + 40000 * ramp),
          prompt_tokens_sum: Math.round(2_000_000 + 2_500_000 * ramp),
          avg_tokens_per_request: Math.round(35000 + 15000 * wobble(i, 15)),
        },
      },
    },
  };
}

// Two synthetic orgs so the org filter is exercisable in local dev.
export const MOCK_METRIC_ENTITIES: Entity[] = [
  ...Array.from({ length: DAYS }, (_, i) =>
    makeDay(i, "my-github-org", "97434394", 1)
  ),
  ...Array.from({ length: DAYS }, (_, i) =>
    makeDay(i, "acme-engineering", "88812345", 0.6)
  ),
];
