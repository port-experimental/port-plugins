/**
 * Maps Port colour names (scorecard.levels[].color) to hex values.
 * Used to resolve dynamic level colours at runtime.
 */
export const PORT_COLOR_HEX: Record<string, string> = {
  red: "#EF4444",
  orange: "#F97316",
  yellow: "#EAB308",
  green: "#22C55E",
  blue: "#3B82F6",
  purple: "#8B5CF6",
  pink: "#EC4899",
  turquoise: "#06B6D4",
  bronze: "#CD7F32",
  silver: "#94A3B8",
  gold: "#EAB308",
  lightGray: "#94A3B8",
  darkGray: "#475569",
  paleBlue: "#93C5FD",
  lime: "#84CC16",
  olive: "#84CC16",
  brown: "#92400E",
};


export const DEFAULT_POLL_SECONDS = 60;

/** Convert a 6-digit hex colour to rgba(r,g,b,alpha). */
export function hexToRgba(hex: string, alpha: number): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}
