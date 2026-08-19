import { useState } from "react";
import { PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { FavoriteItem, type AnyFavorite } from "./FavoriteItem";
import { EmptyState } from "./EmptyState";
import type {
  TabKey,
  FavoritesData,
  FavoritePage,
  FavoriteAction,
  FavoriteEntity,
} from "../types";

const TAB_ADD_LABEL: Record<TabKey, string> = {
  pages: "Page",
  selfService: "Self service",
  entities: "Entity",
};

const TAB_FILTER_PLACEHOLDER: Record<TabKey, string> = {
  pages: "Search favorite pages",
  selfService: "Search favorite actions or workflows",
  entities: "Search favorite entities",
};

type Props = {
  tab: TabKey;
  favorites: FavoritesData;
  onUpdate: (next: FavoritesData) => void;
};

export function TabContent({
  tab,
  favorites,
  onUpdate,
}: Props) {
  const [search, setSearch] = useState("");
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  // insertIdx = 0..n — the gap before item[0], between items, or after last item
  const [insertIdx, setInsertIdx] = useState<number | null>(null);

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

  // Build list rows with drop-indicator lines inserted between items
  function renderList() {
    const rows: React.ReactNode[] = [];

    if (isDragging && insertIdx === 0) {
      rows.push(<li key="drop-0" className="drop-indicator" aria-hidden />);
    }

    filteredItems.forEach(({ item, originalIndex }) => {
      rows.push(
        <FavoriteItem
          key={item.identifier}
          item={item}
          tab={tab}
          index={originalIndex}
          isDragging={dragIdx === originalIndex}
          isDraggingAny={isDragging}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onRemove={handleRemove}
        />
      );

      if (isDragging && insertIdx === originalIndex + 1) {
        rows.push(<li key={`drop-${originalIndex + 1}`} className="drop-indicator" aria-hidden />);
      }
    });

    return rows;
  }

  return (
    <div className="tab-content">
      {items.length > 0 && (
        <p className="fav-hint">Drag the handle to reorder.</p>
      )}

      <div className="fav-list-controls">
        <label className="fav-list-search" aria-label={`Filter ${tab} favorites`}>
          <SearchIcon size={14} className="fav-list-search-icon" aria-hidden />
          <input
            type="text"
            className="fav-list-search-input"
            placeholder={TAB_FILTER_PLACEHOLDER[tab]}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="fav-list-search-clear"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              <XIcon size={14} aria-hidden />
            </button>
          )}
        </label>
        <button
          type="button"
          className="fav-list-add-btn"
          onClick={() => {}}
        >
          <PlusIcon size={20} aria-hidden />
          {TAB_ADD_LABEL[tab]}
        </button>
      </div>
      <div className="fav-list-separator" aria-hidden />

      <div className="fav-list-wrap">
        {items.length === 0 ? (
          <EmptyState tab={tab} />
        ) : filteredItems.length === 0 ? (
          <p className="fav-list-empty-filter">No matching favorites</p>
        ) : (
          <ul className={`fav-list${isDragging ? " fav-list--dragging" : ""}`} role="list">
            {renderList()}
          </ul>
        )}
      </div>
    </div>
  );
}
