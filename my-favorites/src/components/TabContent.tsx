import { useState, useEffect, useRef } from "react";
import { type AnyFavorite } from "./FavoriteItem";
import { EmptyState } from "./EmptyState";
import { AddDropdown } from "./AddDropdown";
import { FavoriteControls } from "./tab-content/FavoriteControls";
import { DraggableFavoritesList } from "./tab-content/DraggableFavoritesList";
import type {
  TabKey,
  FavoritesData,
  FavoritePage,
  FavoriteAction,
  FavoriteEntity,
  PortPage,
  PortAction,
  PortBlueprint,
} from "../types";

type Props = {
  tab: TabKey;
  favorites: FavoritesData;
  pages: PortPage[];
  actions: PortAction[];
  blueprints: PortBlueprint[];
  portToken: string;
  portApiBaseUrl: string;
  onUpdate: (next: FavoritesData) => void;
};

export function TabContent({
  tab,
  favorites,
  pages,
  actions,
  blueprints,
  portToken,
  portApiBaseUrl,
  onUpdate,
}: Props) {
  const [search, setSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const controlsWrapRef = useRef<HTMLDivElement>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  // insertIdx = 0..n — the gap before item[0], between items, or after last item
  const [insertIdx, setInsertIdx] = useState<number | null>(null);

  useEffect(() => {
    setAddOpen(false);
    setAddSearch("");
  }, [tab]);

  const items: AnyFavorite[] =
    tab === "pages"
      ? favorites.pages
      : tab === "selfService"
      ? favorites.selfService
      : favorites.entities;

  const isEmpty = items.length === 0;

  useEffect(() => {
    if (!addOpen) return;
    function handleOutside(e: MouseEvent) {
      if (controlsWrapRef.current && !controlsWrapRef.current.contains(e.target as Node)) {
        setAddOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [addOpen]);

  function patch(newItems: AnyFavorite[]) {
    if (tab === "pages") {
      onUpdate({ ...favorites, pages: newItems as FavoritePage[] });
    } else if (tab === "selfService") {
      onUpdate({ ...favorites, selfService: newItems as FavoriteAction[] });
    } else {
      onUpdate({ ...favorites, entities: newItems as FavoriteEntity[] });
    }
  }

  function handleRemove(index: number) {
    patch(items.filter((_, i) => i !== index));
  }

  function handleAdd(item: FavoritePage | FavoriteAction | FavoriteEntity) {
    patch([...items, item as AnyFavorite]);
    setAddOpen(false);
    setAddSearch("");
  }

  function handleDragStart(idx: number) {
    setDragIdx(idx);
  }

  // e is the native drag event; we use clientY to decide before/after item midpoint
  function handleDragOver(idx: number, e: React.DragEvent) {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    const { top, height } = el.getBoundingClientRect();
    const insertAt = e.clientY < top + height / 2 ? idx : idx + 1;
    setInsertIdx(insertAt);
  }

  function handleDragEnd() {
    if (dragIdx !== null && insertIdx !== null) {
      // Adjust target index for the item being removed
      let target = insertIdx > dragIdx ? insertIdx - 1 : insertIdx;
      if (target !== dragIdx) {
        const next = [...items];
        const [moved] = next.splice(dragIdx, 1);
        next.splice(target, 0, moved);
        patch(next);
      }
    }
    setDragIdx(null);
    setInsertIdx(null);
  }

  const isDragging = dragIdx !== null;
  const q = search.trim().toLowerCase();
  const filteredItems = items
    .map((item, originalIndex) => ({ item, originalIndex }))
    .filter(({ item }) => {
      if (!q) return true;
      const title = (item.title ?? "").toLowerCase();
      const identifier = (item.identifier ?? "").toLowerCase();
      return title.includes(q) || identifier.includes(q);
    });

  const alreadyAdded = new Set(
    items.map((i) =>
      tab === "entities"
        ? `${(i as FavoriteEntity).blueprint}:${i.identifier}`
        : i.identifier
    )
  );

  const addDropdown = addOpen ? (
    <AddDropdown
      tab={tab}
      pages={pages}
      actions={actions}
      blueprints={blueprints}
      alreadyAdded={alreadyAdded}
      portToken={portToken}
      portApiBaseUrl={portApiBaseUrl}
      search={addSearch}
      onSearchReset={() => setAddSearch("")}
      onSearchChange={setAddSearch}
      onAdd={handleAdd}
      onClose={() => setAddOpen(false)}
    />
  ) : null;

  return (
    <div className="tab-content">
      {!isEmpty && (
        <>
          <div className="fav-list-controls-wrap" ref={controlsWrapRef}>
            <FavoriteControls
              tab={tab}
              search={search}
              onSearchChange={setSearch}
              onSearchClear={() => setSearch("")}
              addOpen={addOpen}
              onToggleAdd={() => setAddOpen((v) => !v)}
              pages={pages}
              actions={actions}
              blueprints={blueprints}
              alreadyAdded={alreadyAdded}
              portToken={portToken}
              portApiBaseUrl={portApiBaseUrl}
              addSearch={addSearch}
              onAddSearchReset={() => setAddSearch("")}
              onAddSearchChange={setAddSearch}
              onAdd={handleAdd}
              onCloseAdd={() => setAddOpen(false)}
            />
          </div>
          <div className="fav-list-separator" aria-hidden />
        </>
      )}

      <div className={`fav-list-wrap${isEmpty ? " fav-list-wrap--empty" : ""}`}>
        {isEmpty ? (
          <div className="empty-state-wrap" ref={controlsWrapRef}>
            <EmptyState tab={tab} onAddClick={() => setAddOpen((v) => !v)}>
              {addDropdown}
            </EmptyState>
          </div>
        ) : filteredItems.length === 0 ? (
          <p className="fav-list-empty-filter">No matching favorites</p>
        ) : (
          <DraggableFavoritesList
            tab={tab}
            filteredItems={filteredItems}
            dragIdx={dragIdx}
            insertIdx={insertIdx}
            isDragging={isDragging}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onRemove={handleRemove}
          />
        )}
      </div>
    </div>
  );
}
