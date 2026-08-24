import { PlusIcon, SearchIcon, XIcon } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import type { TabKey } from "../../types";

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
  addModalOpen: boolean;
  onToggleAdd: () => void;
  onOpenAdd: () => void;
  addModal?: ReactNode;
  addButtonRef?: RefObject<HTMLButtonElement | null>;
  addModalId?: string;
};

export function FavoriteControls({
  tab,
  search,
  onSearchChange,
  onSearchClear,
  addModalOpen,
  onToggleAdd,
  onOpenAdd,
  addModal,
  addButtonRef,
  addModalId,
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
            if (addModalOpen) return;
            if (e.key !== "Enter" && e.key !== " ") return;
            e.preventDefault();
            onOpenAdd();
          }}
          aria-haspopup="dialog"
          aria-expanded={addModalOpen}
          aria-controls={addModalOpen ? addModalId : undefined}
        >
          <PlusIcon size={20} aria-hidden />
          Favorite
        </button>
      </div>
      {addModal}
    </>
  );
}
