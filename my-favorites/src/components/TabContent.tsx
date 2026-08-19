import { useState, useEffect, useRef } from "react";
import { type AnyFavorite } from "./FavoriteItem";
import { EmptyState } from "./EmptyState";
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
    if (!addOpen) return;
    function handleOutside(e: MouseEvent) {
      if (controlsWrapRef.current && !controlsWrapRef.current.contains(e.target as Node)) {
        setAddOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [addOpen]);

  const items: AnyFavorite[] =
    tab === "pages"
      ? favorites.pages
      : tab === "selfService"
      ? favorites.selfService
      : favorites.entities;

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

  return (
    <div className="tab-content">
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
          alreadyAdded={new Set(items.map((i) => i.identifier))}
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

      <div className="fav-list-wrap">
        {items.length === 0 ? (
          <EmptyState tab={tab} />
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
