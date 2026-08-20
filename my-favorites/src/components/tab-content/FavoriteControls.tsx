import { PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { AddDropdown } from "../AddDropdown";
import type {
  TabKey,
  FavoritePage,
  FavoriteAction,
  FavoriteEntity,
  PortPage,
  PortAction,
  PortBlueprint,
} from "../../types";
import type { SelfServiceWorkflowPickerItem } from "../../api/workflows";

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
  pages: PortPage[];
  actions: PortAction[];
  workflows: SelfServiceWorkflowPickerItem[];
  blueprints: PortBlueprint[];
  alreadyAdded: Set<string>;
  portToken: string;
  portApiBaseUrl: string;
  addSearch: string;
  onAddSearchReset: () => void;
  onAddSearchChange: (value: string) => void;
  onAdd: (item: FavoritePage | FavoriteAction | FavoriteEntity) => void;
  onCloseAdd: () => void;
};

export function FavoriteControls({
  tab,
  search,
  onSearchChange,
  onSearchClear,
  addOpen,
  onToggleAdd,
  pages,
  actions,
  workflows,
  blueprints,
  alreadyAdded,
  portToken,
  portApiBaseUrl,
  addSearch,
  onAddSearchReset,
  onAddSearchChange,
  onAdd,
  onCloseAdd,
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
          className="fav-list-add-btn"
          onClick={onToggleAdd}
          aria-expanded={addOpen}
        >
          <PlusIcon size={20} aria-hidden />
          {TAB_ADD_LABEL[tab]}
        </button>
      </div>
      {addOpen && (
        <AddDropdown
          tab={tab}
          pages={pages}
          actions={actions}
          workflows={workflows}
          blueprints={blueprints}
          alreadyAdded={alreadyAdded}
          portToken={portToken}
          portApiBaseUrl={portApiBaseUrl}
          search={addSearch}
          onSearchReset={onAddSearchReset}
          onSearchChange={onAddSearchChange}
          onAdd={onAdd}
          onClose={onCloseAdd}
        />
      )}
    </>
  );
}
