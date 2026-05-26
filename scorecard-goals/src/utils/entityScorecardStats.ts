import type {
  EntityGapSummary,
  EntityScorecardEvaluation,
  FailedRuleInfo,
  PortEntity,
  Scorecard,
  ScorecardComplianceRow,
} from "../types";
import { formatRuleFailureReason } from "./ruleFailureReason";

export function isRulePassed(status: string | boolean | undefined): boolean {
  if (status === true) return true;
  if (status === false) return false;
  if (typeof status !== "string") return false;
  const normalized = status.trim().toLowerCase();
  return (
    normalized === "passed" ||
    normalized === "pass" ||
    normalized === "success" ||
    normalized === "true"
  );
}

/** True when the entity passed every rule defined on the scorecard. */
export function entityPassesAllScorecardRules(
  evaluation: EntityScorecardEvaluation | undefined,
  ruleIds: string[]
): boolean {
  if (ruleIds.length === 0) return true;
  if (!evaluation?.rules?.length) return false;

  return ruleIds.every((ruleId) => {
    const rule = evaluation.rules!.find((r) => r.identifier === ruleId);
    return rule != null && isRulePassed(rule.status);
  });
}

export function computeScorecardCompliance(
  scorecards: Scorecard[],
  entities: PortEntity[]
): ScorecardComplianceRow[] {
  const totalEntities = entities.length;

  return scorecards.map((scorecard) => {
    const ruleIds = scorecard.rules.map((r) => r.identifier);
    let passedEntities = 0;

    for (const entity of entities) {
      const evaluation = entity.scorecards?.[scorecard.identifier];
      if (entityPassesAllScorecardRules(evaluation, ruleIds)) {
        passedEntities += 1;
      }
    }

    const passPercent =
      totalEntities === 0
        ? 0
        : Math.round((passedEntities / totalEntities) * 1000) / 10;

    return {
      scorecardIdentifier: scorecard.identifier,
      scorecardTitle: scorecard.title,
      ruleCount: ruleIds.length,
      totalEntities,
      passedEntities,
      passPercent,
    };
  });
}

export function buildEntityGapsForScorecard(
  scorecard: Scorecard,
  entities: PortEntity[]
): EntityGapSummary[] {
  const ruleTitleById = new Map(
    scorecard.rules.map((r) => [r.identifier, r.title ?? r.identifier])
  );
  const gaps: EntityGapSummary[] = [];

  for (const entity of entities) {
    const evaluation = entity.scorecards?.[scorecard.identifier];
    const failedRules: FailedRuleInfo[] = [];

    for (const rule of scorecard.rules) {
      const result = evaluation?.rules?.find(
        (r) => r.identifier === rule.identifier
      );
      if (isRulePassed(result?.status)) continue;

      failedRules.push({
        ruleIdentifier: rule.identifier,
        ruleTitle: ruleTitleById.get(rule.identifier) ?? rule.identifier,
        scorecardIdentifier: scorecard.identifier,
        scorecardTitle: scorecard.title,
        failureReason: formatRuleFailureReason(rule, result, entity),
      });
    }

    if (failedRules.length > 0) {
      gaps.push({
        identifier: entity.identifier,
        title: entity.title?.trim() || entity.identifier,
        failedRules,
      });
    }
  }

  return gaps.sort((a, b) => a.title.localeCompare(b.title));
}
