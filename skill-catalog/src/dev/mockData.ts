import type { SkillSearchResult } from "../api/skills";
import type { AiSkillDraft, PortEntity, SkillFile, SkillGroupOption } from "../types";

export const MOCK_SKILL_GROUPS: SkillGroupOption[] = [
  { identifier: "via-demo/skills-global", title: "skills-global" },
  { identifier: "via-demo/skills-team-bff", title: "skills-team-bff" },
  {
    identifier: "via-demo/skills-group-engineering",
    title: "skills-group-engineering",
  },
];

export const MOCK_CURRENT_CONTENT = `---
name: debug-rider-api
description: >-
  Debug the rider API service. Use when investigating 5xx errors,
  latency spikes, or failed deployments on rider-service.
---

# Debug Rider API

## When to use this skill

When the rider-service is returning errors or behaving unexpectedly.

## Steps

1. Check the service logs
2. Inspect recent deployments
3. Review the CI/CD pipeline status
`;

export const MOCK_SKILL_SEARCH_RESULTS: SkillSearchResult[] = [
  { identifier: "rider-service-debug-rider-api", title: "debug rider api", location: "project", groupIds: ["via-demo/skills-global"] },
  { identifier: "rider-service-deploy-staging", title: "deploy staging", location: "global", groupIds: ["via-demo/skills-team-bff"] },
  { identifier: "rider-service-onboard-service", title: "onboard service", location: "global", groupIds: [] },
];

/**
 * Current files as returned by fetchCurrentFiles in update mode.
 * Every file in the skill bundle is a skill_file entity.
 */
export const MOCK_CURRENT_FILES: SkillFile[] = [
  { id: "mock-md", type: "skill_md", path: "SKILL.md", content: MOCK_CURRENT_CONTENT },
  {
    id: "mock-ref",
    type: "reference",
    path: "references/runbook.md",
    content: "# Rider API Runbook\n\nDashboards, alert thresholds, and escalation paths.\n",
  },
  {
    id: "mock-script",
    type: "script",
    path: "scripts/tail-logs.sh",
    content: "#!/usr/bin/env bash\nkubectl logs -l app=rider-service --tail=200 -f\n",
  },
];

/** A structured draft, as Port AI would return it via outputSchema. */
export const MOCK_AI_DRAFT: AiSkillDraft = {
  skill_name: "rollback-deployment",
  skill_md: `---
name: rollback-deployment
description: >-
  Roll back a service to its previous healthy deployment. Use when a release
  has caused elevated error rates, failed health checks, or a production incident.
---

# Rollback Deployment

## When to use this skill

When a recent deployment is suspected of causing a regression and you need to
restore the last known-good version quickly.

## Steps

1. Identify the current and previous deployment from the service page.
2. Run \`scripts/rollback.sh <service> <previous-sha>\`.
3. Verify health checks recover and error rates return to baseline.
4. Open an incident note documenting the rollback.

## Notes

See \`references/rollback-policy.md\` for approval requirements.
`,
  files: [
    {
      type: "script",
      path: "scripts/rollback.sh",
      content:
        "#!/usr/bin/env bash\nset -euo pipefail\nSERVICE=$1\nSHA=$2\nkubectl set image deployment/$SERVICE $SERVICE=$SHA\n",
    },
    {
      type: "reference",
      path: "references/rollback-policy.md",
      content:
        "# Rollback Policy\n\nRollbacks during business hours require a +1 from the on-call lead.\n",
    },
  ],
};

/** A skill_version entity related to the current skill. */
export const MOCK_SKILL_VERSION: PortEntity = {
  identifier: "rider-service-debug-rider-api",
  title: "debug rider api",
  blueprint: "skill_version",
  properties: { version: "1.0.0", description: "Debug the rider API service." },
  relations: {
    skill_version_to_skill: "rider-service-debug-rider-api",
  },
};

/** A skill_file entity (the SKILL.md) for the version above. */
export const MOCK_SKILL_FILE: PortEntity = {
  identifier: "rider-service-debug-rider-api-file",
  title: "debug-rider-api (SKILL.md)",
  blueprint: "skill_file",
  properties: {
    path: ".cursor/skills/port/debug-rider-api/SKILL.md",
    content: MOCK_CURRENT_CONTENT,
  },
  relations: { skill_file_to_skill_version: "rider-service-debug-rider-api" },
};
