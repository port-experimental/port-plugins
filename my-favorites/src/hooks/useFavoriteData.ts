import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { fetchUserEntity, patchUserEntityProperties } from "../api/user";
import { fetchPages, fetchPageByIdentifier } from "../api/pages";
import { fetchActions, fetchActionByIdentifier } from "../api/actions";
import {
  fetchSelfServiceWorkflowTriggers,
  fetchWorkflowByIdentifier,
} from "../api/workflows";
import { fetchBlueprints, fetchBlueprintByIdentifier } from "../api/blueprints";
import { fetchEntityByIdentifier } from "../api/entities";
import {
  reconcileFavorites,
  favoritesEqual,
  type RefreshFetchResults,
} from "../utils/reconcileFavorites";
import type { FavoritesData } from "../types";
import {
  buildUserFavoritesProperties,
  userBlueprintHasFavoritesIdentifiers,
} from "../utils/favoritesIdentifiers";

const DEFAULT_TAB_ORDER: import("../types").TabKey[] = ["pages", "entities", "selfService"];

export function parseFavorites(raw: unknown): FavoritesData {
  const empty: FavoritesData = { pages: [], selfService: [], entities: [] };
  if (!raw) return empty;
  try {
    const parsed =
      typeof raw === "string"
        ? (JSON.parse(raw) as Partial<FavoritesData>)
        : (raw as Partial<FavoritesData>);

    const tabOrder =
      Array.isArray(parsed.tabOrder) && parsed.tabOrder.length === 3
        ? parsed.tabOrder
        : DEFAULT_TAB_ORDER;

    return {
      pages:    Array.isArray(parsed.pages)    ? parsed.pages    : [],
      selfService: Array.isArray(parsed.selfService) ? parsed.selfService : [],
      entities: Array.isArray(parsed.entities) ? parsed.entities : [],
      tabOrder,
    };
  } catch {
    return empty;
  }
}

async function fetchRefreshData(
  baseUrl: string,
  token: string,
  favorites: FavoritesData
): Promise<RefreshFetchResults> {
  const pageEntries = await Promise.all(
    favorites.pages.map(async (page) =>
      [page.identifier, await fetchPageByIdentifier(baseUrl, token, page.identifier)] as const
    )
  );

  const actionFavorites = favorites.selfService.filter((item) => item.type === "action");
  const actionEntries = await Promise.all(
    actionFavorites.map(async (item) =>
      [item.identifier, await fetchActionByIdentifier(baseUrl, token, item.identifier)] as const
    )
  );

  const workflowFavorites = favorites.selfService.filter((item) => item.type === "workflow");
  const workflowEntries = await Promise.all(
    workflowFavorites.map(async (item) =>
      [item.identifier, await fetchWorkflowByIdentifier(baseUrl, token, item.identifier)] as const
    )
  );

  const entityEntries = await Promise.all(
    favorites.entities.map(async (entity) => {
      const key = `${entity.blueprint}:${entity.identifier}`;
      const fetched = await fetchEntityByIdentifier(
        baseUrl,
        token,
        entity.blueprint,
        entity.identifier
      );
      return [key, fetched] as const;
    })
  );

  const blueprintIds = [...new Set(favorites.entities.map((entity) => entity.blueprint))];
  const blueprintEntries = await Promise.all(
    blueprintIds.map(async (blueprintId) =>
      [
        blueprintId,
        await fetchBlueprintByIdentifier(baseUrl, token, blueprintId),
      ] as const
    )
  );

  return {
    pages: new Map(pageEntries),
    actions: new Map(actionEntries),
    workflows: new Map(workflowEntries),
    entities: new Map(entityEntries),
    blueprints: new Map(blueprintEntries),
  };
}

export function useFavoriteData(
  portToken: string | null,
  portApiBaseUrl: string | null,
  userEmail: string | undefined
) {
  const qc = useQueryClient();
  const enabled = !!portToken && !!portApiBaseUrl;

  const userEntityQuery = useQuery({
    queryKey: ["userEntity", userEmail],
    queryFn: () => fetchUserEntity(portApiBaseUrl!, portToken!, userEmail!),
    enabled: enabled && !!userEmail,
    staleTime: 5 * 60_000,
  });

  const pagesQuery = useQuery({
    queryKey: ["pages", portToken],
    queryFn: () => fetchPages(portApiBaseUrl!, portToken!),
    enabled,
    staleTime: 10 * 60_000,
  });

  const actionsQuery = useQuery({
    queryKey: ["actions", portToken],
    queryFn: () => fetchActions(portApiBaseUrl!, portToken!),
    enabled,
    staleTime: 10 * 60_000,
  });

  const workflowsQuery = useQuery({
    queryKey: ["workflows", portToken],
    queryFn: () => fetchSelfServiceWorkflowTriggers(portApiBaseUrl!, portToken!),
    enabled,
    staleTime: 10 * 60_000,
  });

  const blueprintsQuery = useQuery({
    queryKey: ["blueprints", portToken],
    queryFn: () => fetchBlueprints(portApiBaseUrl!, portToken!),
    enabled,
    staleTime: 10 * 60_000,
  });

  const userBlueprintQuery = useQuery({
    queryKey: ["userBlueprint", portToken],
    queryFn: () => fetchBlueprintByIdentifier(portApiBaseUrl!, portToken!, "_user"),
    enabled,
    staleTime: 10 * 60_000,
  });

  const supportsFavoritesIdentifiers = userBlueprintHasFavoritesIdentifiers(
    userBlueprintQuery.data
  );

  const saveMutation = useMutation({
    mutationFn: ({
      favorites,
      userIdentifier,
      syncIdentifiers,
    }: {
      favorites: FavoritesData;
      userIdentifier: string;
      syncIdentifiers: boolean;
    }) =>
      patchUserEntityProperties(
        portApiBaseUrl!,
        portToken!,
        userIdentifier,
        buildUserFavoritesProperties(favorites, syncIdentifiers)
      ),
    onSuccess: (_, { favorites, syncIdentifiers }) => {
      const properties = buildUserFavoritesProperties(favorites, syncIdentifiers);
      qc.setQueryData(["userEntity", userEmail], (prev: unknown) => {
        if (!prev || typeof prev !== "object") return prev;
        return {
          ...(prev as object),
          properties: {
            ...((prev as { properties?: Record<string, unknown> }).properties ?? {}),
            ...properties,
          },
        };
      });
    },
  });

  const refreshFavorites = useCallback(async (): Promise<{
    reconciled: FavoritesData;
    changed: boolean;
  }> => {
    if (!portApiBaseUrl || !portToken || !userEmail) {
      throw new Error("Port context is not ready");
    }

    const userResult = await qc.fetchQuery({
      queryKey: ["userEntity", userEmail],
      queryFn: () => fetchUserEntity(portApiBaseUrl, portToken, userEmail),
    });

    if (!userResult) {
      throw new Error("User profile not found");
    }

    const parsed = parseFavorites(userResult.properties?.favorites);
    const fetched = await fetchRefreshData(portApiBaseUrl, portToken, parsed);
    const reconciled = reconcileFavorites(parsed, fetched);
    return {
      reconciled,
      changed: !favoritesEqual(parsed, reconciled),
    };
  }, [qc, portApiBaseUrl, portToken, userEmail]);

  return {
    userEntityQuery,
    pagesQuery,
    actionsQuery,
    workflowsQuery,
    blueprintsQuery,
    userBlueprintQuery,
    supportsFavoritesIdentifiers,
    saveMutation,
    refreshFavorites,
  };
}
