import type { FailedRuleInfo } from "../types";

type FailedRuleChipProps = {
  rule: FailedRuleInfo;
};

export function FailedRuleChip({ rule }: FailedRuleChipProps) {
  const failureReason =
    rule.failureReason?.trim() || "No additional failure details provided.";

  return (
    <button
      type="button"
      className="rule-chip"
      title={failureReason}
      aria-label={`${rule.ruleTitle}: ${failureReason}`}
    >
      <span className="rule-chip__label">{rule.ruleTitle}</span>
      <span className="rule-chip__hint" aria-hidden="true">
        i
      </span>
    </button>
  );
}
