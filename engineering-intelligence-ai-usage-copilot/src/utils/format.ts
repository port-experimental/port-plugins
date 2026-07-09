/** Integer with thousands separators. */
export function fmtInt(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

/** Compact large numbers: 1234 → "1.2k", 4012251 → "4M". */
export function fmtCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs < 1000) return fmtInt(n);
  if (abs < 1_000_000) return `${(n / 1000).toFixed(abs < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(abs < 10_000_000 ? 1 : 0)}M`;
}

/** Ratio 0..1 → percentage string, e.g. 0.188 → "18.8%". */
export function fmtPct(ratio: number | null, digits = 1): string {
  if (ratio == null || !Number.isFinite(ratio)) return "–";
  return `${(ratio * 100).toFixed(digits)}%`;
}

/** Minutes → "7.1h" or "43m". */
export function fmtMinutes(min: number): string {
  if (!Number.isFinite(min) || min <= 0) return "–";
  if (min < 90) return `${Math.round(min)}m`;
  return `${(min / 60).toFixed(1)}h`;
}

/** Safe division returning null on a zero denominator. */
export function ratio(num: number, den: number): number | null {
  return den > 0 ? num / den : null;
}

/** "2026-07-05" → "Jul 5". */
export function fmtDayShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
