import { Tab } from './types';

interface TabBarProps {
  tabs: Tab[];
  activeTab: string;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearch: (q: string) => void;
  columnPickerOpen: boolean;
  onToggleColumnPicker: () => void;
}

export function TabBar({
  tabs,
  activeTab,
  onSelect,
  searchQuery,
  onSearch,
  columnPickerOpen,
  onToggleColumnPicker,
}: TabBarProps) {
  return (
    <div className="ec-tabbar">
      <div className="ec-tabbar__tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`ec-tabbar__tab${tab.id === activeTab ? ' ec-tabbar__tab--active' : ''}`}
            onClick={() => onSelect(tab.id)}
          >
            {tab.label}
            <span className="ec-tabbar__badge">{tab.count}</span>
          </button>
        ))}
      </div>
      <div className="ec-tabbar__actions">
        <div className="ec-tabbar__search">
          <span className="ec-tabbar__search-icon" aria-hidden="true">&#x2315;</span>
          <input
            type="text"
            placeholder="Search entities…"
            value={searchQuery}
            onChange={e => onSearch(e.target.value)}
            className="ec-tabbar__search-input"
          />
        </div>
        <button
          className={`ec-tabbar__col-btn${columnPickerOpen ? ' ec-tabbar__col-btn--active' : ''}`}
          onClick={onToggleColumnPicker}
          aria-label="Toggle column picker"
          title="Columns"
        >
          ≡
        </button>
      </div>
    </div>
  );
}
