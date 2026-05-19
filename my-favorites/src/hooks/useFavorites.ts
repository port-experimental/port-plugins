import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  loadFavorites,
  resolveUserEntityId,
  saveFavorites,
} from "../api/favorites";
import type { FavoritesData, PluginConfig } from "../types";

export function useFavorites(
  config: PluginConfig,
  userEmail: string | undefined,
  portToken: string | null,
  portApiBaseUrl: string | null
) {
  const queryClient = useQueryClient();

  const userEntityQuery = useQuery({
    queryKey: ["userEntity", config.userBlueprint, userEmail],
    queryFn: () =>
      resolveUserEntityId(
        portApiBaseUrl!,
        portToken!,
        config.userBlueprint,
        userEmail!
      ),
    enabled: !!portToken && !!portApiBaseUrl && !!userEmail,
  });

  const favoritesQuery = useQuery({
    queryKey: [
      "favorites",
      config.userBlueprint,
      userEntityQuery.data,
      config.favoritesProperty,
    ],
    queryFn: () =>
      loadFavorites(
        portApiBaseUrl!,
        portToken!,
        config.userBlueprint,
        userEntityQuery.data!,
        config.favoritesProperty
      ),
    enabled:
      !!portToken &&
      !!portApiBaseUrl &&
      !!userEntityQuery.data &&
      userEntityQuery.isSuccess,
  });

  const saveMutation = useMutation({
    mutationFn: (next: FavoritesData) =>
      saveFavorites(
        portApiBaseUrl!,
        portToken!,
        config.userBlueprint,
        userEntityQuery.data!,
        config.favoritesProperty,
        next
      ),
    onMutate: async (next) => {
      const key = [
        "favorites",
        config.userBlueprint,
        userEntityQuery.data,
        config.favoritesProperty,
      ];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<FavoritesData>(key);
      queryClient.setQueryData(key, next);
      return { previous, key };
    },
    onError: (_err, _next, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [
          "favorites",
          config.userBlueprint,
          userEntityQuery.data,
          config.favoritesProperty,
        ],
      });
    },
  });

  return {
    favorites: favoritesQuery.data,
    isLoading: userEntityQuery.isLoading || favoritesQuery.isLoading,
    isError: userEntityQuery.isError || favoritesQuery.isError,
    error: userEntityQuery.error ?? favoritesQuery.error,
    missingUserEntity: userEntityQuery.isSuccess && !userEntityQuery.data,
    saveFavorites: saveMutation.mutateAsync,
    isSaving: saveMutation.isPending,
    saveError: saveMutation.error,
  };
}
