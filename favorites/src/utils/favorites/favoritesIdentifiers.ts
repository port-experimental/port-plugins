import type { FavoriteEntity, FavoritesData, PortBlueprint } from "../../types";

export function userBlueprintHasFavorites(
  blueprint: PortBlueprint | null | undefined
): boolean {
  const property = blueprint?.schema?.properties?.favorites;
  return property?.type === "object";
}

export function userBlueprintHasFavoritesIdentifiers(
  blueprint: PortBlueprint | null | undefined
): boolean {
  const property = blueprint?.schema?.properties?.favorites_identifiers;
  return property?.type === "array";
}

export function buildFavoritesIdentifiers(entities: FavoriteEntity[]): string[] {
  return [...new Set(entities.map((entity) => entity.identifier))].sort((a, b) =>
    a.localeCompare(b)
  );
}

export function buildUserFavoritesProperties(
  favorites: FavoritesData,
  syncIdentifiers: boolean
): Record<string, unknown> {
  const properties: Record<string, unknown> = { favorites };
  if (syncIdentifiers) {
    properties.favorites_identifiers = buildFavoritesIdentifiers(favorites.entities);
  }
  return properties;
}
