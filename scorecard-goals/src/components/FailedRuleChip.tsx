import type { FailedRuleInfo } from "../types";

type FailedRuleChipProps = {
  rule: FailedRuleInfo;
  entityKey: string;
};

export function FailedRuleChip({ rule, entityKey }: FailedRuleChipProps) {
  const hintId = `rule-failure-${entityKey}-${rule.ruleIdentifier}`;
  const failureReason =
    rule.failureReason?.trim() || "No additional failure details provided.";

  return (
    <span className="rule-chip">
      <span className="rule-chip__label">{rule.ruleTitle}</span>
      <button
        type="button"
        className="rule-chip__hint"
        aria-label={`Why ${rule.ruleTitle} did not pass`}
        aria-describedby={hintId}
        title={failureReason}
      >
        i
      </button>
      <span id={hintId} className="sr-only">
        {failureReason}
      </span>
    </span>
  );
}
