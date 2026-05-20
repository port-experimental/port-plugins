/** Normalize ISO / date strings to YYYY-MM-DD in local timezone. */
export function toDateKey(value: unknown): string | null {
  if (value == null || value === "") return null;

  const date =
    value instanceof Date
      ? value
      : typeof value === "number"
        ? new Date(value)
        : new Date(String(value));

  if (Number.isNaN(date.getTime())) return null;

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function sameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export function formatMonthYear(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

/** JS Date.getDay(): Sunday = 0, Monday = 1. */
export const SUNDAY = 0;
export const MONDAY = 1;

export function firstDayOfWeekFromConfig(weekStartsOnMonday: boolean): number {
  return weekStartsOnMonday ? MONDAY : SUNDAY;
}

/** Offset from the 1st of the month to the first cell in the week grid. */
export function monthGridStartOffset(firstOfMonth: Date, firstDayOfWeek: number): number {
  return (firstOfMonth.getDay() - firstDayOfWeek + 7) % 7;
}

export function weekdayLabels(firstDayOfWeek: number): string[] {
  const sunday = new Date(2024, 0, 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + ((firstDayOfWeek + i) % 7));
    return d.toLocaleDateString(undefined, { weekday: "short" });
  });
}
