import { PlusIcon, SearchIcon, XIcon } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import type { TabKey } from "../../types";

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
  search: string;
  onSearchChange: (value: string) => void;
  onSearchClear: () => void;
  addOpen: boolean;
  onToggleAdd: () => void;
  onOpenAdd: () => void;
  addPanel?: ReactNode;
  addButtonRef?: RefObject<HTMLButtonElement | null>;
  addPanelId?: string;
};

export function FavoriteControls({
  tab,
  search,
  onSearchChange,
  onSearchClear,
  addOpen,
  onToggleAdd,
  onOpenAdd,
  addPanel,
  addButtonRef,
  addPanelId,
}: Props) {
  return (
    <>
      <div className="fav-list-controls">
        <label className="fav-list-search" aria-label={`Filter ${tab} favorites`}>
          <SearchIcon size={14} className="fav-list-search-icon" aria-hidden />
          <input
            type="text"
            className="fav-list-search-input"
            placeholder={TAB_FILTER_PLACEHOLDER[tab]}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="fav-list-search-clear"
              onClick={onSearchClear}
              aria-label="Clear search"
            >
              <XIcon size={14} aria-hidden />
            </button>
          )}
        </label>
        <button
          type="button"
          ref={addButtonRef}
          className="fav-list-add-btn"
          onClick={onToggleAdd}
          onKeyDown={(e) => {
            if (addOpen) return;
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            onOpenAdd();
          }}
          aria-haspopup="dialog"
          aria-expanded={addOpen}
          aria-controls={addOpen ? addPanelId : undefined}
        >
          <PlusIcon size={20} aria-hidden />
          {TAB_ADD_LABEL[tab]}
        </button>
      </div>
      {addPanel}
    </>
  );
}
