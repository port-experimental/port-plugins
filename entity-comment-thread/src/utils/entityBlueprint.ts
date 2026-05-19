import type { Entity } from "../types";

/** Normalize PLUGIN_DATA.entity.blueprint (string or { identifier }). */
export function getEntityBlueprintId(entity: Entity): string | null {
  const raw = entity.blueprint as unknown;
  if (typeof raw === "string" && raw.trim()) return raw.trim();
  if (raw && typeof raw === "object") {
    const id = (raw as { identifier?: string }).identifier;
    if (typeof id === "string" && id.trim()) return id.trim();
  }
  return blueprintIdFromReferrer();
}

/** Entity pages: /{blueprint}Entity?identifier=… */
export function blueprintIdFromReferrer(): string | null {
  try {
    if (!document.referrer) return null;
    const { pathname } = new URL(document.referrer);
    const match = pathname.match(/\/([^/]+)Entity\/?$/i);
    if (!match?.[1]) return null;
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
