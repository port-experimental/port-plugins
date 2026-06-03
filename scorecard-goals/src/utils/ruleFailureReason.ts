import type {
  PortEntity,
  ScorecardRule,
  ScorecardRuleQuery,
  ScorecardRuleResult,
} from "../types";

type ScorecardCondition = NonNullable<ScorecardRuleQuery["conditions"]>[number];

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function formatProperty(property: string): string {
  if (property.startsWith("$")) {
    const meta: Record<string, string> = {
      $team: "Team",
      $identifier: "Identifier",
      $title: "Title",
      $blueprint: "Blueprint",
    };
    return meta[property] ?? property.slice(1);
  }
  return property;
}

function formatValue(value: unknown): string {
  if (value === undefined || value === null) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function conditionToText(condition: ScorecardCondition): string {
  const property = formatProperty(condition.property ?? "property");
  const operator = condition.operator ?? "";
  const value = condition.value;

  switch (operator) {
    case "isNotEmpty":
      return `${property} must be set`;
    case "isEmpty":
      return `${property} must be empty`;
    case "=":
      return `${property} must equal ${formatValue(value)}`;
    case "!=":
      return `${property} must not equal ${formatValue(value)}`;
    case ">":
      return `${property} must be greater than ${formatValue(value)}`;
    case ">=":
      return `${property} must be at least ${formatValue(value)}`;
    case "<":
      return `${property} must be less than ${formatValue(value)}`;
    case "<=":
      return `${property} must be at most ${formatValue(value)}`;
    case "contains":
      return `${property} must contain ${formatValue(value)}`;
    case "doesNotContains":
      return `${property} must not contain ${formatValue(value)}`;
    case "containsAny":
      return `${property} must include one of: ${formatValue(value)}`;
    case "beginsWith":
      return `${property} must start with ${formatValue(value)}`;
    case "endsWith":
      return `${property} must end with ${formatValue(value)}`;
    case "doesNotBeginsWith":
      return `${property} must not start with ${formatValue(value)}`;
    case "doesNotEndsWith":
      return `${property} must not end with ${formatValue(value)}`;
    default:
      return `${property} must satisfy ${operator || "the rule"}${value !== undefined ? ` (${formatValue(value)})` : ""}`;
  }
}

function queryToText(query: ScorecardRuleQuery | undefined): string | undefined {
  const conditions = query?.conditions?.filter(
    (c) => c.property || c.operator
  );
  if (!conditions?.length) return undefined;

  const parts = conditions.map(conditionToText);
  const combinator =
    query?.combinator?.toLowerCase() === "or" ? " or " : " and ";
  return parts.join(combinator);
}

function apiFailureMessage(result: ScorecardRuleResult | undefined): string | undefined {
  if (!result || typeof result !== "object") return undefined;

  const record = result as Record<string, unknown>;
  const candidates = [
    record.message,
    record.reason,
    record.statusMessage,
    record.failureMessage,
    record.failureReason,
    record.description,
  ];

  for (const value of candidates) {
    const text = readString(value);
    if (text) return text;
  }

  return undefined;
}

/** Human-readable explanation for why an entity failed a scorecard rule. */
export function formatRuleFailureReason(
  rule: ScorecardRule,
  result: ScorecardRuleResult | undefined,
  _entity: PortEntity
): string {
  const fromApi = apiFailureMessage(result);
  if (fromApi) return fromApi;

  if (rule.description) return rule.description;

  const requirement = queryToText(rule.query);
  if (requirement) {
    return `This entity did not meet the rule requirement: ${requirement}.`;
  }

  const status =
    result?.status === undefined || result?.status === null
      ? "Not passed"
      : String(result.status);

  const title = rule.title ?? rule.identifier;
  return `Rule "${title}" did not pass (status: ${status}). Update the entity so it satisfies this scorecard check.`;
}
