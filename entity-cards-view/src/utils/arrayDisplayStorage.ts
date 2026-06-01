import type { ArrayDisplayMode } from "../types";

const STORAGE_PREFIX = "entity-cards-view-array-display:";

export function readArrayDisplayModes(
  blueprintIdentifier: string
): Record<string, ArrayDisplayMode> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + blueprintIdentifier);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: Record<string, ArrayDisplayMode> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (value === "count" || value === "items") {
        out[key] = value;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function writeArrayDisplayModes(
  blueprintIdentifier: string,
  modes: Record<string, ArrayDisplayMode>
): void {
  try {
    localStorage.setItem(
      STORAGE_PREFIX + blueprintIdentifier,
      JSON.stringify(modes)
    );
  } catch {
    /* ignore */
  }
}

export function getArrayDisplayMode(
  propertyId: string,
  modes: Record<string, ArrayDisplayMode>
): ArrayDisplayMode {
  return modes[propertyId] ?? "count";
}
