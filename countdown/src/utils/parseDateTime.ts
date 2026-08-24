export const DATE_TIME_PARAM_EXAMPLE = "2026-12-31T23:59:59Z";

export const DATE_TIME_PARAM_LABEL = `Target datetime (e.g. ${DATE_TIME_PARAM_EXAMPLE})`;

export const DATE_TIME_FORMAT_HINT =
  `ISO 8601 datetime — e.g. ${DATE_TIME_PARAM_EXAMPLE}`;

export const DATE_TIME_EXAMPLES = [
  { value: DATE_TIME_PARAM_EXAMPLE, note: "UTC (recommended)" },
  { value: "2026-06-15T14:30:00", note: "Local timezone" },
  { value: "2026-06-15T14:30:00+03:00", note: "With offset" },
] as const;

export function parseTargetDateTime(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed;
}

export function formatTargetLabel(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "full",
    timeStyle: "short",
  }).format(date);
}

export function formatTargetShort(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}
