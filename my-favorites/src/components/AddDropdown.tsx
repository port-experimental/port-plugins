import { SearchIcon, CheckIcon } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { fetchEntitiesForBlueprint } from "../api/entities";
import { LoadingDots } from "./LoadingState";
import { TabTypeIcon } from "./TabTypeIcon";
import { BlueprintLabel } from "./BlueprintLabel";
import type {
  TabKey,
  PortPage,
  PortAction,
  PortBlueprint,
  PortEntity,
  FavoritePage,
  FavoriteAction,
  FavoriteEntity,
} from "../types";

type Props = {
  tab: TabKey;
  pages: PortPage[];
  actions: PortAction[];
  blueprints: PortBlueprint[];
  alreadyAdded: Set<string>;
  portToken: string;
  portApiBaseUrl: string;
  search: string;
  onSearchReset: () => void;
  onSearchChange: (value: string) => void;
  onAdd: (item: FavoritePage | FavoriteAction | FavoriteEntity) => void;
  onClose: () => void;
};

type ListItem = {
  identifier: string;
  title: string;
  subtitle?: string;
};

type EntityGroup = {
  blueprint: PortBlueprint;
  entities: PortEntity[];
};

function entityFavoriteKey(blueprintId: string, entityId: string) {
  return `${blueprintId}:${entityId}`;
}

function entityMatchesSearch(
  blueprint: PortBlueprint,
  entity: PortEntity,
  query: string
) {
  if (!query) return true;
  const fields = [
    entity.title,
    entity.identifier,
    blueprint.title,
    blueprint.identifier,
  ];
  return fields.some((value) => (value ?? "").toLowerCase().includes(query));
}

export function AddDropdown({
  tab,
  pages,
  actions,
  blueprints,
  alreadyAdded,
  portToken,
  portApiBaseUrl,
  search,
  onSearchChange,
  onAdd,
}: Props) {
  const entityQueries = useQueries({
    queries: blueprints.map((bp) => ({
      queryKey: ["entities", bp.identifier, portToken],
      queryFn: () =>
        fetchEntitiesForBlueprint(portApiBaseUrl, portToken, bp.identifier),
      enabled: tab === "entities",
      staleTime: 60_000,
    })),
  });

  function buildPageItems(): ListItem[] {
    return pages
      .filter((p) => p.type !== "entity" && p.showInSidebar !== false)
      .map((p) => ({
        identifier: p.identifier,
        title: p.title ?? p.identifier,
        subtitle: p.type === "blueprint-entities" ? "catalog" : p.type,
      }));
  }

  function buildActionItems(): ListItem[] {
    return actions.map((a) => ({
      identifier: a.identifier,
      title: a.title ?? a.identifier,
      subtitle: a.description,
    }));
  }

  function buildEntityGroups(): EntityGroup[] {
    return blueprints
      .map((blueprint, index) => ({
        blueprint,
        entities: entityQueries[index]?.data ?? [],
      }))
      .filter((group) => group.entities.length > 0);
  }

  const q = search.trim().toLowerCase();

  const filteredPageItems = buildPageItems().filter((item) => {
    if (!q) return true;
    return (
      (item.title ?? "").toLowerCase().includes(q) ||
      (item.identifier ?? "").toLowerCase().includes(q) ||
      ((item.subtitle ?? "").toLowerCase().includes(q))
    );
  });

  const filteredActionItems = buildActionItems().filter((item) => {
    if (!q) return true;
    return (
      (item.title ?? "").toLowerCase().includes(q) ||
      (item.identifier ?? "").toLowerCase().includes(q) ||
      ((item.subtitle ?? "").toLowerCase().includes(q))
    );
  });

  const filteredEntityGroups = buildEntityGroups()
    .map((group) => ({
      ...group,
      entities: group.entities.filter((entity) =>
        entityMatchesSearch(group.blueprint, entity, q)
      ),
    }))
    .filter((group) => group.entities.length > 0);

  function handlePageSelect(identifier: string) {
    const page = pages.find((p) => p.identifier === identifier);
    if (page)
      onAdd({
        identifier: page.identifier,
        title: page.title,
        type: page.type === "blueprint-entities" ? "catalog" : page.type,
        icon: page.type === "blueprint-entities" ? "table-2" : "layout-dashboard",
      } satisfies FavoritePage);
  }

  function handleActionSelect(identifier: string) {
    const action = actions.find((a) => a.identifier === identifier);
    if (action)
      onAdd({
        identifier: action.identifier,
        title: action.title,
        description: action.description,
        blueprint: action.blueprint,
      } satisfies FavoriteAction);
  }

  function handleEntitySelect(blueprint: PortBlueprint, entity: PortEntity) {
    onAdd({
      identifier: entity.identifier,
      title: entity.title ?? entity.identifier,
      blueprint: blueprint.identifier,
      blueprintTitle: blueprint.title,
    } satisfies FavoriteEntity);
  }

  const isEntityLoading =
    tab === "entities" &&
    entityQueries.some((query) => query.isPending || query.isLoading);

  const entityGroupCount = filteredEntityGroups.reduce(
    (count, group) => count + group.entities.length,
    0
  );

  const isEmpty =
    tab === "pages"
      ? filteredPageItems.length === 0
      : tab === "selfService"
      ? filteredActionItems.length === 0
      : !isEntityLoading && entityGroupCount === 0;

  return (
    <div className="add-panel">
      <div className="add-panel-search">
        <div className="add-search-shell">
          <SearchIcon size={15} className="add-search-icon" aria-hidden />
          <input
            type="text"
            className="add-search-input"
            placeholder={
              tab === "pages"
                ? "Search pages"
                : tab === "selfService"
                ? "Search actions"
                : "Search entities"
            }
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Search items to add"
          />
        </div>
      </div>

      <ul className="add-panel-list" role="listbox">
        {tab === "entities" && isEntityLoading ? (
          <li className="add-panel-status">
            <LoadingDots />
          </li>
        ) : isEmpty ? (
          <li className="add-panel-status add-panel-empty">No matching items</li>
        ) : tab === "pages" ? (
          filteredPageItems.map((item) => {
            const isAdded = alreadyAdded.has(item.identifier);
            return (
              <li key={item.identifier} role="option" aria-selected={false}>
                <button
                  type="button"
                  disabled={isAdded}
                  className={[
                    "add-panel-item",
                    isAdded ? "add-panel-item--added" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => !isAdded && handlePageSelect(item.identifier)}
                >
                  <span className="add-item-icon" aria-hidden>
                    <TabTypeIcon tab="pages" size={16} />
                  </span>
                  <span className="add-item-title">{item.title}</span>
                  {isAdded ? (
                    <CheckIcon size={13} className="add-item-check" aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })
        ) : tab === "selfService" ? (
          filteredActionItems.map((item) => {
            const isAdded = alreadyAdded.has(item.identifier);
            return (
              <li key={item.identifier} role="option" aria-selected={false}>
                <button
                  type="button"
                  disabled={isAdded}
                  className={[
                    "add-panel-item",
                    isAdded ? "add-panel-item--added" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => !isAdded && handleActionSelect(item.identifier)}
                >
                  <span className="add-item-icon" aria-hidden>
                    <TabTypeIcon tab="selfService" size={16} />
                  </span>
                  <span className="add-item-title">{item.title}</span>
                  {isAdded ? (
                    <CheckIcon size={13} className="add-item-check" aria-hidden />
                  ) : null}
                </button>
              </li>
            );
          })
        ) : (
          filteredEntityGroups.flatMap((group) => [
            <li
              key={`header-${group.blueprint.identifier}`}
              className="add-panel-group-header"
              role="presentation"
            >
              {group.blueprint.title ?? group.blueprint.identifier}
            </li>,
            ...group.entities.map((entity) => {
              const key = entityFavoriteKey(
                group.blueprint.identifier,
                entity.identifier
              );
              const isAdded = alreadyAdded.has(key);
              return (
                <li key={key} role="option" aria-selected={false}>
                  <button
                    type="button"
                    disabled={isAdded}
                    className={[
                      "add-panel-item",
                      isAdded ? "add-panel-item--added" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() =>
                      !isAdded && handleEntitySelect(group.blueprint, entity)
                    }
                  >
                    <span className="add-item-icon" aria-hidden>
                      <TabTypeIcon tab="entities" size={16} />
                    </span>
                    <span className="add-item-title">
                      {entity.title ?? entity.identifier}
                    </span>
                    <BlueprintLabel
                      title={group.blueprint.title}
                      identifier={group.blueprint.identifier}
                    />
                    {isAdded ? (
                      <CheckIcon size={13} className="add-item-check" aria-hidden />
                    ) : null}
                  </button>
                </li>
              );
            }),
          ])
        )}
      </ul>
    </div>
  );
}
