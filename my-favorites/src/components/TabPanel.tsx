import type {
  FavoriteAction,
  FavoriteEntity,
  FavoritePage,
  FavoriteTab,
  FavoritesData,
  PortActionSummary,
  PortBlueprintSummary,
  PortEntitySummary,
  PortPageSummary,
} from "../types";
import {
  buildActionUrl,
  buildEntityUrl,
  buildPageUrl,
} from "../utils/portalUrl";
import { AddPicker, type PickerOption } from "./AddPicker";
import { FavoriteList, type FavoriteListItem } from "./FavoriteList";

type TabPanelProps = {
  tab: FavoriteTab;
  favorites: FavoritesData;
  disabled?: boolean;
  pages: PortPageSummary[];
  actions: PortActionSummary[];
  blueprints: PortBlueprintSummary[];
  entities: PortEntitySummary[];
  entitiesLoading: boolean;
  selectedBlueprint: string | null;
  onSelectBlueprint: (blueprint: string | null) => void;
  onSave: (next: FavoritesData) => Promise<void>;
};

const EMPTY_MESSAGES: Record<FavoriteTab, string> = {
  pages: "No favorite pages yet.",
  actions: "No favorite actions yet.",
  entities: "No favorite entities yet.",
};

export function TabPanel({
  tab,
  favorites,
  disabled,
  pages,
  actions,
  blueprints,
  entities,
  entitiesLoading,
  selectedBlueprint,
  onSelectBlueprint,
  onSave,
}: TabPanelProps) {
  const persist = async (next: FavoritesData) => {
    await onSave(next);
  };

  if (tab === "pages") {
    const items = favorites.pages.map(toPageListItem);
    const options: PickerOption[] = pages
      .filter((page) => !favorites.pages.some((fav) => fav.identifier === page.identifier))
      .map((page) => ({
        id: page.identifier,
        title: page.title,
        subtitle: page.type,
        meta: page.type,
      }));

    return (
      <section className="mf-panel" aria-label="Pages favorites">
        <FavoriteList
          items={items}
          emptyMessage={EMPTY_MESSAGES.pages}
          disabled={disabled}
          onReorder={(from, to) => {
            const nextPages = reorder(favorites.pages, from, to);
            void persist({ ...favorites, pages: nextPages });
          }}
          onRemove={(id) => {
            void persist({
              ...favorites,
              pages: favorites.pages.filter((page) => page.identifier !== id),
            });
          }}
        />
        <AddPicker
          label="Add page"
          placeholder="Filter by title, ID, or page type"
          options={options}
          disabled={disabled}
          onSelect={(option) => {
            const page = pages.find((entry) => entry.identifier === option.id);
            if (!page) return;
            const entry: FavoritePage = {
              identifier: page.identifier,
              title: page.title,
              pageType: page.type,
            };
            void persist({
              ...favorites,
              pages: [...favorites.pages, entry],
            });
          }}
        />
      </section>
    );
  }

  if (tab === "actions") {
    const items = favorites.actions.map(toActionListItem);
    const options: PickerOption[] = actions
      .filter(
        (action) =>
          !favorites.actions.some((fav) => fav.identifier === action.identifier)
      )
      .map((action) => ({
        id: action.identifier,
        title: action.title,
        subtitle: action.description,
        meta: action.description,
      }));

    return (
      <section className="mf-panel" aria-label="Actions favorites">
        <FavoriteList
          items={items}
          emptyMessage={EMPTY_MESSAGES.actions}
          disabled={disabled}
          onReorder={(from, to) => {
            const nextActions = reorder(favorites.actions, from, to);
            void persist({ ...favorites, actions: nextActions });
          }}
          onRemove={(id) => {
            void persist({
              ...favorites,
              actions: favorites.actions.filter(
                (action) => action.identifier !== id
              ),
            });
          }}
        />
        <AddPicker
          label="Add action"
          placeholder="Filter by title, ID, or description"
          options={options}
          disabled={disabled}
          onSelect={(option) => {
            const action = actions.find((entry) => entry.identifier === option.id);
            if (!action) return;
            const entry: FavoriteAction = {
              identifier: action.identifier,
              title: action.title,
              description: action.description,
            };
            void persist({
              ...favorites,
              actions: [...favorites.actions, entry],
            });
          }}
        />
      </section>
    );
  }

  const items = favorites.entities.map(toEntityListItem);
  const entityOptions: PickerOption[] = entities
    .filter(
      (entity) =>
        !favorites.entities.some(
          (fav) =>
            fav.identifier === entity.identifier &&
            fav.blueprint === entity.blueprint
        )
    )
    .map((entity) => ({
      id: `${entity.blueprint}:${entity.identifier}`,
      title: entity.title ?? entity.identifier,
      subtitle: entity.blueprint,
      meta: entity.identifier,
    }));

  const blueprintOptions: PickerOption[] = blueprints.map((blueprint) => ({
    id: blueprint.identifier,
    title: blueprint.title,
    meta: blueprint.identifier,
  }));

  return (
    <section className="mf-panel" aria-label="Entities favorites">
      <FavoriteList
        items={items}
        emptyMessage={EMPTY_MESSAGES.entities}
        disabled={disabled}
        onReorder={(from, to) => {
          const nextEntities = reorder(favorites.entities, from, to);
          void persist({ ...favorites, entities: nextEntities });
        }}
        onRemove={(id) => {
          void persist({
            ...favorites,
            entities: favorites.entities.filter(
              (entity) => entityKey(entity) !== id
            ),
          });
        }}
      />
      <div className="mf-blueprint-field">
        <label className="mf-blueprint-field__label" htmlFor="mf-blueprint-select">
          Blueprint
        </label>
        <select
          id="mf-blueprint-select"
          className="mf-blueprint-field__select"
          value={selectedBlueprint ?? ""}
          disabled={disabled}
          onChange={(event) =>
            onSelectBlueprint(event.target.value || null)
          }
        >
          <option value="">Select blueprint…</option>
          {blueprintOptions.map((option) => (
            <option key={option.id} value={option.id}>
              {option.title}
            </option>
          ))}
        </select>
      </div>
      <AddPicker
        label="Add entity"
        placeholder={
          selectedBlueprint
            ? "Filter by title or ID"
            : "Choose a blueprint first"
        }
        options={selectedBlueprint ? entityOptions : []}
        disabled={disabled || !selectedBlueprint}
        loading={entitiesLoading}
        onSelect={(option) => {
          const [blueprint, identifier] = option.id.split(":");
          const entity = entities.find(
            (entry) =>
              entry.blueprint === blueprint && entry.identifier === identifier
          );
          if (!entity) return;
          const entry: FavoriteEntity = {
            identifier: entity.identifier,
            title: entity.title ?? entity.identifier,
            blueprint: entity.blueprint,
          };
          void persist({
            ...favorites,
            entities: [...favorites.entities, entry],
          });
        }}
      />
    </section>
  );
}

function reorder<T>(items: T[], from: number, to: number): T[] {
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

function entityKey(entity: FavoriteEntity): string {
  return `${entity.blueprint}:${entity.identifier}`;
}

function toPageListItem(page: FavoritePage): FavoriteListItem {
  return {
    id: page.identifier,
    title: page.title,
    subtitle: page.pageType,
    href: buildPageUrl(page),
  };
}

function toActionListItem(action: FavoriteAction): FavoriteListItem {
  return {
    id: action.identifier,
    title: action.title,
    subtitle: action.description,
    href: buildActionUrl(action),
  };
}

function toEntityListItem(entity: FavoriteEntity): FavoriteListItem {
  return {
    id: entityKey(entity),
    title: entity.title,
    subtitle: entity.blueprint,
    href: buildEntityUrl(entity),
  };
}
