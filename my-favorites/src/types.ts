export type TabKey = "pages" | "actions" | "entities";

export type Page = {
  identifier?: string;
  pageFilters?: unknown;
};

export type User = {
  firstName?: string;
  lastName?: string;
  email?: string;
  picture?: string;
};

export type Entity = {
  identifier: string;
  title?: string;
  icon?: string;
  blueprint?: string;
  properties?: Record<string, unknown>;
  relations?: Record<string, unknown>;
};

export type ParamValue = { type?: string; value?: unknown };
export type Params = Record<string, ParamValue>;

export type PluginConfig = Record<string, never>;

// Favorites data stored in _user.properties.favorites (as JSON string)
export type FavoritePage = {
  identifier: string;
  title: string;
  type?: string;
  icon?: string;
};

export type FavoriteAction = {
  identifier: string;
  title: string;
  description?: string;
  blueprint?: string;
};

export type FavoriteEntity = {
  identifier: string;
  title: string;
  blueprint: string;
  blueprintTitle?: string;
};

export type FavoritesData = {
  pages: FavoritePage[];
  actions: FavoriteAction[];
  entities: FavoriteEntity[];
  tabOrder?: TabKey[];
};

// Port API response shapes
export type PortPage = {
  identifier: string;
  title: string;
  type?: string;
  icon?: string;
  blueprint?: string;
  showInSidebar?: boolean;
};

export type PortAction = {
  identifier: string;
  title: string;
  description?: string;
  blueprint?: string;
  trigger?: {
    type: string;
    blueprintIdentifier?: string;
  };
};

export type PortBlueprint = {
  identifier: string;
  title: string;
  icon?: string;
  description?: string;
};

export type PortEntity = {
  identifier: string;
  title?: string;
  blueprint?: string;
  properties?: Record<string, unknown>;
  relations?: Record<string, unknown>;
};
