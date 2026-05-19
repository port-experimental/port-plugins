import type { FavoriteAction, FavoriteEntity, FavoritePage } from "../types";

const DEFAULT_PORTAL_ORIGIN = "https://app.port.io";

export function getPortalOrigin(): string {
  try {
    if (document.referrer) {
      return new URL(document.referrer).origin;
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_PORTAL_ORIGIN;
}

export function buildPageUrl(page: Pick<FavoritePage, "identifier" | "pageType">): string {
  const origin = getPortalOrigin();
  if (page.pageType === "home") {
    return `${origin}/organization/home`;
  }
  return `${origin}/${encodeURIComponent(page.identifier)}`;
}

export function buildActionUrl(action: Pick<FavoriteAction, "identifier">): string {
  const origin = getPortalOrigin();
  const qs = new URLSearchParams({ action: action.identifier });
  return `${origin}/self-serve?${qs.toString()}`;
}

export function buildEntityUrl(entity: Pick<FavoriteEntity, "blueprint" | "identifier">): string {
  const origin = getPortalOrigin();
  const path = `${encodeURIComponent(entity.blueprint)}Entity`;
  const qs = new URLSearchParams({ identifier: entity.identifier });
  return `${origin}/${path}?${qs.toString()}`;
}
