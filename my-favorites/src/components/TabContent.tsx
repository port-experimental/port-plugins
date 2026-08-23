import { useState, useEffect, useLayoutEffect, useRef, useId, useCallback } from "react";
import { type AnyFavorite } from "./FavoriteItem";
import { EmptyState } from "./EmptyState";
import { AddDropdown } from "./AddDropdown";
import { FavoriteControls } from "./tab-content/FavoriteControls";
import { DraggableFavoritesList } from "./tab-content/DraggableFavoritesList";
import { SearchNoResults } from "./SearchNoResults";
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
import type { SelfServiceWorkflowPickerItem } from "../api/workflows";
import { selfServiceFavoriteKey } from "../api/workflows";

type Props = {
  tab: TabKey;
  favorites: FavoritesData;
  pages: PortPage[];
  actions: PortAction[];
  workflows: SelfServiceWorkflowPickerItem[];
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
  workflows,
  blueprints,
  portToken,
  portApiBaseUrl,
  onUpdate,
}: Props) {
  const [search, setSearch] = useState("");
  const [addSearch, setAddSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const controlsWrapRef = useRef<HTMLDivElement>(null);
  const emptyAddWrapRef = useRef<HTMLDivElement>(null);
  const addPanelRef = useRef<HTMLDivElement>(null);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const emptyAddButtonRef = useRef<HTMLButtonElement>(null);
  const addPanelId = useId();
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

  const closeAddDropdown = useCallback(() => {
    setAddOpen(false);
    setAddSearch("");
    requestAnimationFrame(() => {
      if (addButtonRef.current) {
        addButtonRef.current.focus();
      } else {
        emptyAddButtonRef.current?.focus();
      }
    });
  }, []);

  const openAddDropdown = useCallback(() => {
    setAddOpen(true);
    addButtonRef.current?.blur();
    emptyAddButtonRef.current?.blur();
  }, []);

  const toggleAddDropdown = useCallback(() => {
    setAddOpen((open) => {
      if (open) return false;
      requestAnimationFrame(() => {
        addButtonRef.current?.blur();
        emptyAddButtonRef.current?.blur();
      });
      return true;
    });
  }, []);

  useLayoutEffect(() => {
    if (!addOpen) return;
    const focusSearch = () => {
      addPanelRef.current
        ?.querySelector<HTMLInputElement>(".add-search-input")
        ?.focus({ preventScroll: true });
    };
    focusSearch();
    const raf = requestAnimationFrame(focusSearch);
    return () => cancelAnimationFrame(raf);
  }, [addOpen]);

  useEffect(() => {
    if (!addOpen) return;
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (controlsWrapRef.current?.contains(target)) return;
      if (emptyAddWrapRef.current?.contains(target)) return;
      if (addPanelRef.current?.contains(target)) return;
      closeAddDropdown();
    }
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [addOpen, closeAddDropdown]);

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
    closeAddDropdown();
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

  const addDropdown = addOpen ? (
    <AddDropdown
      ref={addPanelRef}
      tab={tab}
      pages={pages}
      actions={actions}
      workflows={workflows}
      blueprints={blueprints}
      alreadyAdded={alreadyAdded}
      portToken={portToken}
      portApiBaseUrl={portApiBaseUrl}
      search={addSearch}
      onSearchReset={() => setAddSearch("")}
      onSearchChange={setAddSearch}
      onAdd={handleAdd}
      onClose={closeAddDropdown}
      panelId={addPanelId}
      anchorRef={isEmpty ? emptyAddWrapRef : controlsWrapRef}
      anchorInset={isEmpty ? { left: -24, right: -24 } : { left: 12, right: 12 }}
      anchorGap={isEmpty ? 8 : 4}
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
              onToggleAdd={toggleAddDropdown}
              onOpenAdd={openAddDropdown}
              addPanel={addDropdown}
              addButtonRef={addButtonRef}
              addPanelId={addPanelId}
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
              onAddClick={toggleAddDropdown}
              onOpenAdd={openAddDropdown}
              addWrapRef={emptyAddWrapRef}
              addButtonRef={emptyAddButtonRef}
              addOpen={addOpen}
              addPanelId={addPanelId}
            >
              {addDropdown}
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
