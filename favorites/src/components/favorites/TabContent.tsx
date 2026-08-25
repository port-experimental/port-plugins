import { useState, useEffect, useRef, useId, useCallback } from "react";
import { type AnyFavorite } from "./FavoriteItem";
import { EmptyState } from "../shared/EmptyState";
import { AddModal } from "../add-modal/AddModal";
import { FavoriteControls } from "./FavoriteControls";
import { DraggableFavoritesList } from "./DraggableFavoritesList";
import { SearchNoResults } from "../shared/SearchNoResults";
import type {
  TabKey,
  FavoritesData,
  FavoritePage,
  FavoriteAction,
  FavoriteEntity,
} from "../../types";
import { selfServiceFavoriteKey } from "../../api/workflows";

type Props = {
  tab: TabKey;
  favorites: FavoritesData;
  portToken: string;
  portApiBaseUrl: string;
  onUpdate: (next: FavoritesData) => void;
};

export function TabContent({
  tab,
  favorites,
  portToken,
  portApiBaseUrl,
  onUpdate,
}: Props) {
  const [search, setSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [addModalOpen, setAddModalOpen] = useState(false);
  const controlsWrapRef = useRef<HTMLDivElement>(null);
  const addModalRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const emptyAddButtonRef = useRef<HTMLButtonElement>(null);
  const addModalId = useId();
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  // insertIdx = 0..n — the gap before item[0], between items, or after last item
  const [insertIdx, setInsertIdx] = useState<number | null>(null);

  useEffect(() => {
    setAddModalOpen(false);
    setAddSearch("");
  }, [tab]);

  const items: AnyFavorite[] =
    tab === "pages"
      ? favorites.pages
      : tab === "selfService"
      ? favorites.selfService
      : favorites.entities;

  const isEmpty = items.length === 0;

  const closeAddModal = useCallback(() => {
    setAddModalOpen(false);
    setAddSearch("");
    requestAnimationFrame(() => {
      if (addButtonRef.current) {
        addButtonRef.current.focus();
      } else {
        emptyAddButtonRef.current?.focus();
      }
    });
  }, []);

  const openAddModal = useCallback(() => {
    setAddModalOpen(true);
    addButtonRef.current?.blur();
    emptyAddButtonRef.current?.blur();
  }, []);

  const toggleAddModal = useCallback(() => {
    setAddModalOpen((open) => {
      if (open) return false;
      requestAnimationFrame(() => {
        addButtonRef.current?.blur();
        emptyAddButtonRef.current?.blur();
      });
      return true;
    });
  }, []);

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
    closeAddModal();
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
    items.map((i) => {
      if (tab === "entities") {
        return `${(i as FavoriteEntity).blueprint}:${i.identifier}`;
      }
      if (tab === "selfService") {
        const self = i as FavoriteAction;
        return selfServiceFavoriteKey(
          self.type,
          self.identifier,
          self.triggerIdentifier
        );
      }
      return i.identifier;
    })
  );

  const addModal = addModalOpen ? (
    <AddModal
      ref={addModalRef}
      tab={tab}
      alreadyAdded={alreadyAdded}
      portToken={portToken}
      portApiBaseUrl={portApiBaseUrl}
      search={addSearch}
      onSearchReset={() => setAddSearch("")}
      onSearchChange={setAddSearch}
      onAdd={handleAdd}
      onClose={closeAddModal}
      modalId={addModalId}
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
              addModalOpen={addModalOpen}
              onToggleAdd={toggleAddModal}
              onOpenAdd={openAddModal}
              addModal={addModal}
              addButtonRef={addButtonRef}
              addModalId={addModalId}
            />
          </div>
          <div className="fav-list-separator" aria-hidden />
        </>
      )}

      <div className={`fav-list-wrap${isEmpty ? " fav-list-wrap--empty" : ""}`}>
        {isEmpty ? (
          <div className="empty-state-wrap" ref={controlsWrapRef}>
            <EmptyState
              tab={tab}
              onAddClick={toggleAddModal}
              onOpenAdd={openAddModal}
              addButtonRef={emptyAddButtonRef}
              addModalOpen={addModalOpen}
              addModalId={addModalId}
            >
              {addModal}
            </EmptyState>
          </div>
        ) : filteredItems.length === 0 ? (
          <SearchNoResults />
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
