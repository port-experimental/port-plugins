import type { BooleanDisplayMode } from "../types";

const STORAGE_PREFIX = "entity-cards-view-boolean-display:";

export function readBooleanDisplayModes(
  blueprintIdentifier: string
): Record<string, BooleanDisplayMode> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + blueprintIdentifier);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }
    const out: Record<string, BooleanDisplayMode> = {};
    for (const [key, value] of Object.entries(parsed)) {
      if (value === "pill" || value === "labeled") {
        out[key] = value;
      }
    }
    return out;
  } catch {
    return {};
  }
}

export function writeBooleanDisplayModes(
  blueprintIdentifier: string,
  modes: Record<string, BooleanDisplayMode>
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

export function getBooleanDisplayMode(
  propertyId: string,
  modes: Record<string, BooleanDisplayMode>
): BooleanDisplayMode {
  return modes[propertyId] ?? "labeled";
}
