import type { FavoriteTab } from "../types";

const TAB_LABELS: Record<FavoriteTab, string> = {
  pages: "Pages",
  actions: "Actions",
  entities: "Entities",
};

type TabsProps = {
  active: FavoriteTab;
  counts: Record<FavoriteTab, number>;
  onChange: (tab: FavoriteTab) => void;
};

export function Tabs({ active, counts, onChange }: TabsProps) {
  return (
    <div className="mf-tabs" role="tablist" aria-label="Favorite categories">
      {(Object.keys(TAB_LABELS) as FavoriteTab[]).map((tab) => {
        const selected = tab === active;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`mf-tabs__tab${selected ? " mf-tabs__tab--active" : ""}`}
            onClick={() => onChange(tab)}
          >
            {TAB_LABELS[tab]}
            <span className="mf-tabs__count">{counts[tab]}</span>
          </button>
        );
      })}
    </div>
  );
}
