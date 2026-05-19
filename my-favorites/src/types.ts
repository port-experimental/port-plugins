export type BlueprintParam = { identifier?: string; title?: string };

export type Params = Record<
  string,
  { type: string; value: unknown } | undefined
>;

export type PluginConfig = {
  favoritesProperty: string;
  userBlueprint: string;
};

export type User = {
  firstName?: string;
  lastName?: string;
  email?: string;
  picture?: string;
};

export type Page = { identifier?: string; pageFilters?: unknown };

export type FavoriteTab = "pages" | "actions" | "entities";

export type FavoritePage = {
  identifier: string;
  title: string;
  pageType: string;
};

export type FavoriteAction = {
  identifier: string;
  title: string;
  description?: string;
};

export type FavoriteEntity = {
  identifier: string;
  title: string;
  blueprint: string;
};

export type FavoritesData = {
  pages: FavoritePage[];
  actions: FavoriteAction[];
  entities: FavoriteEntity[];
};

export const DEFAULT_FAVORITES_PROPERTY = "myFavorites";
export const DEFAULT_USER_BLUEPRINT = "_user";

export type PortPageSummary = {
  identifier: string;
  title: string;
  type: string;
  blueprint?: string;
  sidebarType?: string;
};

export type PortActionSummary = {
  identifier: string;
  title: string;
  description?: string;
  trigger?: { type?: string };
};

export type PortBlueprintSummary = {
  identifier: string;
  title: string;
};

export type PortEntitySummary = {
  identifier: string;
  title?: string;
  blueprint: string;
};
