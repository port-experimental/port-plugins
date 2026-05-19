import { DEV_MOCK } from "../hooks/usePostMessageData";
import type { FavoritesData } from "../types";
import { MOCK_FAVORITES, MOCK_USER_ENTITY_ID } from "../dev/mockData";
import { portFetch } from "./portFetch";

const EMPTY_FAVORITES: FavoritesData = {
  pages: [],
  actions: [],
  entities: [],
};

function normalizeFavorites(raw: unknown): FavoritesData {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY_FAVORITES };
  }
  const data = raw as Partial<FavoritesData>;
  return {
    pages: Array.isArray(data.pages) ? data.pages : [],
    actions: Array.isArray(data.actions) ? data.actions : [],
    entities: Array.isArray(data.entities) ? data.entities : [],
  };
}

type EntityResponse = {
  entity?: {
    identifier: string;
    properties?: Record<string, unknown>;
  };
};

export async function resolveUserEntityId(
  baseUrl: string,
  token: string,
  userBlueprint: string,
  email: string
): Promise<string | null> {
  if (DEV_MOCK) {
    return MOCK_USER_ENTITY_ID;
  }

  const encoded = encodeURIComponent(email);
  try {
    const direct = await portFetch<EntityResponse>(
      baseUrl,
      token,
      `/v1/blueprints/${encodeURIComponent(userBlueprint)}/entities/${encoded}`
    );
    if (direct.entity?.identifier) {
      return direct.entity.identifier;
    }
  } catch {
    /* fall through to search */
  }

  const search = await portFetch<{ entities?: Array<{ identifier: string }> }>(
    baseUrl,
    token,
    `/v1/blueprints/${encodeURIComponent(userBlueprint)}/entities/search`,
    {
      method: "POST",
      body: JSON.stringify({
        query: {
          combinator: "and",
          rules: [{ property: "$identifier", operator: "=", value: email }],
        },
        limit: 1,
      }),
    }
  );

  return search.entities?.[0]?.identifier ?? null;
}

export async function loadFavorites(
  baseUrl: string,
  token: string,
  userBlueprint: string,
  userEntityId: string,
  propertyKey: string
): Promise<FavoritesData> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 100));
    return structuredClone(MOCK_FAVORITES);
  }

  const data = await portFetch<EntityResponse>(
    baseUrl,
    token,
    `/v1/blueprints/${encodeURIComponent(userBlueprint)}/entities/${encodeURIComponent(userEntityId)}`
  );

  return normalizeFavorites(data.entity?.properties?.[propertyKey]);
}

export async function saveFavorites(
  baseUrl: string,
  token: string,
  userBlueprint: string,
  userEntityId: string,
  propertyKey: string,
  favorites: FavoritesData
): Promise<void> {
  if (DEV_MOCK) {
    await new Promise((r) => setTimeout(r, 120));
    Object.assign(MOCK_FAVORITES, favorites);
    return;
  }

  await portFetch(
    baseUrl,
    token,
    `/v1/blueprints/${encodeURIComponent(userBlueprint)}/entities/${encodeURIComponent(userEntityId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        properties: { [propertyKey]: favorites },
      }),
    }
  );
}
