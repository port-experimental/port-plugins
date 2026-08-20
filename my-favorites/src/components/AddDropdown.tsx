import { SearchIcon, CheckIcon } from "lucide-react";
import { useQueries } from "@tanstack/react-query";
import { fetchEntitiesForBlueprint } from "../api/entities";
import { LoadingDots } from "./LoadingState";
import { TabTypeIcon } from "./TabTypeIcon";
import { BlueprintLabel } from "./BlueprintLabel";
import { SearchNoResults } from "./SearchNoResults";
import type {
  TabKey,
  PortPage,
  PortAction,
  PortBlueprint,
  PortEntity,
  FavoritePage,
  FavoriteAction,
  FavoriteEntity,
  SelfServiceKind,
} from "../types";
import type { SelfServiceWorkflowPickerItem } from "../api/workflows";
import { selfServiceFavoriteKey } from "../api/workflows";

type Props = {
  tab: TabKey;
  pages: PortPage[];
  actions: PortAction[];
  workflows: SelfServiceWorkflowPickerItem[];
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
  key: string;
  identifier: string;
  title: string;
  subtitle?: string;
  kind?: SelfServiceKind;
  triggerIdentifier?: string;
  category?: string;
};

type SelfServiceGroup = {
  category: string;
  items: ListItem[];
};

type EntityGroup = {
  blueprint: PortBlueprint;
  entities: PortEntity[];
};

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

function entityFavoriteKey(blueprintId: string, entityId: string) {
  return `${blueprintId}:${entityId}`;
}

const OTHER = "Other";

function capitalizeCategory(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return OTHER;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

function actionCategory(action: PortAction): string {
  const operation = action.trigger?.operation?.trim();
  if (!operation) return OTHER;
  return capitalizeCategory(operation);
}

function workflowCategory(workflow: SelfServiceWorkflowPickerItem): string {
  const category = workflow.category?.trim();
  if (!category) return OTHER;
  return capitalizeCategory(category);
}

function groupSelfServiceItems(items: ListItem[]): SelfServiceGroup[] {
  const groups = new Map<string, ListItem[]>();

  for (const item of items) {
    const category = item.category ?? OTHER;
    const bucket = groups.get(category) ?? [];
    bucket.push({ ...item, category });
    groups.set(category, bucket);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, undefined, { sensitivity: "base" }))
    .map(([category, groupItems]) => ({
      category,
      items: groupItems.sort((a, b) =>
        a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
      ),
    }));
}

function selfServiceItemMatchesSearch(item: ListItem, query: string): boolean {
  if (!query) return true;
  const fields = [
    item.title,
    item.identifier,
    item.subtitle,
    item.triggerIdentifier,
    item.category,
  ];
  return fields.some((value) => (value ?? "").toLowerCase().includes(query));
}

export function AddDropdown({
  tab,
  pages,
  actions,
  workflows,
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
        key: p.identifier,
        identifier: p.identifier,
        title: p.title ?? p.identifier,
        subtitle: p.type === "blueprint-entities" ? "catalog" : p.type,
      }));
  }

  function buildActionItems(): ListItem[] {
    return actions.map((a) => ({
      key: selfServiceFavoriteKey("action", a.identifier),
      kind: "action" as const,
      identifier: a.identifier,
      title: a.title ?? a.identifier,
      subtitle: a.description,
      category: actionCategory(a),
    }));
  }

  function buildWorkflowItems(): ListItem[] {
    return workflows.map((w) => ({
      key: selfServiceFavoriteKey(
        "workflow",
        w.workflowIdentifier,
        w.triggerIdentifier
      ),
      kind: "workflow" as const,
      identifier: w.workflowIdentifier,
      triggerIdentifier: w.triggerIdentifier,
      title: w.title,
      subtitle: w.description,
      category: workflowCategory(w),
    }));
  }

  function buildSelfServiceGroups(): SelfServiceGroup[] {
    return groupSelfServiceItems([...buildActionItems(), ...buildWorkflowItems()]);
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

  const filteredSelfServiceGroups = buildSelfServiceGroups()
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => selfServiceItemMatchesSearch(item, q)),
    }))
    .filter((group) => group.items.length > 0);

  const filteredSelfServiceItemCount = filteredSelfServiceGroups.reduce(
    (count, group) => count + group.items.length,
    0
  );

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
        type: "action",
        identifier: action.identifier,
        title: action.title,
        description: action.description,
        blueprint: action.blueprint,
      } satisfies FavoriteAction);
  }

  function handleWorkflowSelect(
    workflowIdentifier: string,
    triggerIdentifier: string
  ) {
    const workflow = workflows.find(
      (w) =>
        w.workflowIdentifier === workflowIdentifier &&
        w.triggerIdentifier === triggerIdentifier
    );
    if (workflow)
      onAdd({
        type: "workflow",
        identifier: workflow.workflowIdentifier,
        triggerIdentifier: workflow.triggerIdentifier,
        title: workflow.title,
        description: workflow.description,
      } satisfies FavoriteAction);
  }

  function handleSelfServiceSelect(item: ListItem) {
    if (item.kind === "workflow" && item.triggerIdentifier) {
      handleWorkflowSelect(item.identifier, item.triggerIdentifier);
      return;
    }
    handleActionSelect(item.identifier);
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
      ? filteredSelfServiceItemCount === 0
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
                ? "Search actions and workflows"
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
          q ? (
            <li className="add-panel-empty-state" role="status">
              <SearchNoResults />
            </li>
          ) : (
            <li className="add-panel-status add-panel-empty">No matching items</li>
          )
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
          filteredSelfServiceGroups.flatMap((group) => [
            <li
              key={`header-${group.category}`}
              className="add-panel-group-header"
              role="presentation"
            >
              {group.category}
            </li>,
            ...group.items.map((item) => {
              const isAdded = alreadyAdded.has(item.key);
              return (
                <li key={item.key} role="option" aria-selected={false}>
                  <button
                    type="button"
                    disabled={isAdded}
                    className={[
                      "add-panel-item",
                      isAdded ? "add-panel-item--added" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={() => !isAdded && handleSelfServiceSelect(item)}
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
            }),
          ])
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
