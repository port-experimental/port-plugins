export function percentTier(
  percent: number
): "high" | "medium" | "low" | "none" {
  if (percent >= 80) return "high";
  if (percent >= 50) return "medium";
  if (percent > 0) return "low";
  return "none";
}
