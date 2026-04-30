const SIDEBAR_KEY = "techdocs-sidebar-width";

function readInt(key: string, fallback: number, min: number, max: number): number {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function readSidebarWidth(): number {
  return readInt(SIDEBAR_KEY, 272, 180, 560);
}

export function writeSidebarWidth(px: number): void {
  try {
    localStorage.setItem(SIDEBAR_KEY, String(Math.round(px)));
  } catch {
    /* ignore */
  }
}
