import type {
  FavoritesData,
  FavoritePage,
  FavoriteAction,
  FavoriteEntity,
  PortPage,
  PortAction,
  PortBlueprint,
  PortEntity,
} from "../types";
import type { SelfServiceWorkflowPickerItem } from "../api/workflows";

export type RefreshFetchResults = {
  pages: Map<string, PortPage | null>;
  actions: Map<string, PortAction | null>;
  workflows: Map<string, SelfServiceWorkflowPickerItem | null>;
  entities: Map<string, PortEntity | null>;
  blueprints: Map<string, PortBlueprint | null>;
};

function pageFavoriteType(page: PortPage): FavoritePage["type"] {
  return page.type === "blueprint-entities" ? "catalog" : page.type;
}

function pageFavoriteIcon(page: PortPage): FavoritePage["icon"] {
  return page.type === "blueprint-entities" ? "table-2" : "layout-dashboard";
}

function entityKey(blueprint: string, identifier: string): string {
  return `${blueprint}:${identifier}`;
}

function reconcilePages(
  favorites: FavoritePage[],
  pages: Map<string, PortPage | null>
): FavoritePage[] {
  return favorites.flatMap((favorite) => {
    const page = pages.get(favorite.identifier);
    if (!page) return [];
    return [
      {
        ...favorite,
        title: page.title ?? page.identifier,
        type: pageFavoriteType(page),
        icon: pageFavoriteIcon(page),
      },
    ];
  });
}

function reconcileSelfService(
  favorites: FavoriteAction[],
  actions: Map<string, PortAction | null>,
  workflows: Map<string, SelfServiceWorkflowPickerItem | null>
): FavoriteAction[] {
  return favorites.flatMap((favorite) => {
    if (favorite.type === "workflow") {
      const workflow = workflows.get(favorite.identifier);
      if (!workflow) return [];
      return [
        {
          ...favorite,
          title: workflow.title,
          description: workflow.description,
          triggerIdentifier: workflow.triggerIdentifier,
        },
      ];
    }

    const action = actions.get(favorite.identifier);
    if (!action) return [];
    return [
      {
        ...favorite,
        title: action.title ?? action.identifier,
        description: action.description,
        blueprint: action.blueprint,
      },
    ];
  });
}

function reconcileEntities(
  favorites: FavoriteEntity[],
  entities: Map<string, PortEntity | null>,
  blueprints: Map<string, PortBlueprint | null>
): FavoriteEntity[] {
  return favorites.flatMap((favorite) => {
    const entity = entities.get(entityKey(favorite.blueprint, favorite.identifier));
    if (!entity) return [];
    const blueprint = blueprints.get(favorite.blueprint);
    return [
      {
        ...favorite,
        title: entity.title ?? entity.identifier,
        blueprintTitle: blueprint?.title ?? favorite.blueprintTitle,
      },
    ];
  });
}

export function reconcileFavorites(
  favorites: FavoritesData,
  fetched: RefreshFetchResults
): FavoritesData {
  return {
    tabOrder: favorites.tabOrder,
    pages: reconcilePages(favorites.pages, fetched.pages),
    selfService: reconcileSelfService(
      favorites.selfService,
      fetched.actions,
      fetched.workflows
    ),
    entities: reconcileEntities(
      favorites.entities,
      fetched.entities,
      fetched.blueprints
    ),
  };
}

export function favoritesEqual(a: FavoritesData, b: FavoritesData): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}
