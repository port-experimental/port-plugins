import { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, SearchIcon } from "lucide-react";
import { FavoriteItem, type AnyFavorite } from "./FavoriteItem";
import { AddDropdown } from "./AddDropdown";
import { EmptyState } from "./EmptyState";
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

const TAB_SINGULAR: Record<TabKey, string> = {
  pages: "page",
  selfService: "self-service action",
  entities: "entity",
};

const TAB_PLACEHOLDER: Record<TabKey, string> = {
  pages: "Search or select a page to add…",
  selfService: "Search or select a self-service action to add…",
  entities: "Search or select an entity to add…",
};

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
  const [addOpen, setAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);
  const addAreaRef = useRef<HTMLDivElement>(null);

  // Focus the search input when the dropdown opens; clear on close
  useEffect(() => {
    if (addOpen) {
      searchInputRef.current?.focus();
    } else {
      setSearch("");
    }
  }, [addOpen]);

  // Close add panel on outside click
  useEffect(() => {
    if (!addOpen) return;
    function handleOutside(e: MouseEvent) {
      if (addAreaRef.current && !addAreaRef.current.contains(e.target as Node)) {
        setAddOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [addOpen]);
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

  function handleAdd(item: FavoritePage | FavoriteAction | FavoriteEntity) {
    patch([...items, item as AnyFavorite]);
    setAddOpen(false);
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

  const alreadyAdded = new Set(items.map((i) => i.identifier));
  const isDragging = dragIdx !== null;

  // Build list rows with drop-indicator lines inserted between items
  function renderList() {
    const rows: React.ReactNode[] = [];

    if (isDragging && insertIdx === 0) {
      rows.push(<li key="drop-0" className="drop-indicator" aria-hidden />);
    }

    items.forEach((item, idx) => {
      rows.push(
        <FavoriteItem
          key={item.identifier}
          item={item}
          tab={tab}
          index={idx}
          isDragging={dragIdx === idx}
          isDraggingAny={isDragging}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          onRemove={handleRemove}
        />
      );

      if (isDragging && insertIdx === idx + 1) {
        rows.push(<li key={`drop-${idx + 1}`} className="drop-indicator" aria-hidden />);
      }
    });

    return rows;
  }

  return (
    <div className="tab-content">
      {items.length > 0 && (
        <p className="fav-hint">Drag the handle to reorder.</p>
      )}

      <div className="fav-list-wrap">
        {items.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <ul className={`fav-list${isDragging ? " fav-list--dragging" : ""}`} role="list">
            {renderList()}
          </ul>
        )}
      </div>

      <div className="fav-add-area" ref={addAreaRef}>
        {addOpen && (
          <AddDropdown
            tab={tab}
            pages={pages}
            actions={actions}
            blueprints={blueprints}
            alreadyAdded={alreadyAdded}
            portToken={portToken}
            portApiBaseUrl={portApiBaseUrl}
          search={search}
          onSearchReset={() => setSearch("")}
          onAdd={handleAdd}
          onClose={() => setAddOpen(false)}
          />
        )}
        <p className="fav-add-label">Add a {TAB_SINGULAR[tab]}</p>
        {addOpen ? (
          <div className="fav-add-combobox fav-add-combobox--open fav-add-combobox--input">
            <SearchIcon size={14} className="fav-add-combobox-search-icon" aria-hidden />
            <input
              ref={searchInputRef}
              type="text"
              className="fav-add-combobox-input"
              placeholder={TAB_PLACEHOLDER[tab]}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={TAB_PLACEHOLDER[tab]}
            />
            <ChevronDownIcon
              size={16}
              className="fav-add-combobox-chevron"
              style={{ cursor: "pointer" }}
              aria-hidden
              onClick={() => setAddOpen(false)}
            />
          </div>
        ) : (
          <button
            type="button"
            className="fav-add-combobox"
            onClick={() => setAddOpen(true)}
            aria-expanded={false}
            aria-label={TAB_PLACEHOLDER[tab]}
          >
            <span className="fav-add-combobox-placeholder">
              {TAB_PLACEHOLDER[tab]}
            </span>
            <ChevronDownIcon size={16} className="fav-add-combobox-chevron" aria-hidden />
          </button>
        )}
      </div>
    </div>
  );
}
