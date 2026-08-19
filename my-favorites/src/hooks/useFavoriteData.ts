import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchUserEntity, patchUserFavorites } from "../api/user";
import { fetchPages } from "../api/pages";
import { fetchActions } from "../api/actions";
import { fetchBlueprints } from "../api/blueprints";
import type { FavoritesData } from "../types";

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

  const blueprintsQuery = useQuery({
    queryKey: ["blueprints", portToken],
    queryFn: () => fetchBlueprints(portApiBaseUrl!, portToken!),
    enabled,
    staleTime: 10 * 60_000,
  });

  const saveMutation = useMutation({
    mutationFn: ({
      favorites,
      userIdentifier,
    }: {
      favorites: FavoritesData;
      userIdentifier: string;
    }) =>
      patchUserFavorites(
        portApiBaseUrl!,
        portToken!,
        userIdentifier,
        favorites          // pass the object directly
      ),
    onSuccess: (_, { favorites, userIdentifier }) => {
      qc.setQueryData(["userEntity", userEmail], (prev: unknown) => {
        if (!prev || typeof prev !== "object") return prev;
        return {
          ...(prev as object),
          properties: {
            ...((prev as { properties?: Record<string, unknown> }).properties ?? {}),
            favorites,      // store as object in the cache too
          },
        };
      });
      void userIdentifier;
    },
  });

  return {
    userEntityQuery,
    pagesQuery,
    actionsQuery,
    blueprintsQuery,
    saveMutation,
  };
}
