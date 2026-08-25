import { FavoriteItem, type AnyFavorite } from "./FavoriteItem";
import type { TabKey } from "../../types";

type FilteredFavorite = {
  item: AnyFavorite;
  originalIndex: number;
};

type Props = {
  tab: TabKey;
  filteredItems: FilteredFavorite[];
  dragIdx: number | null;
  insertIdx: number | null;
  isDragging: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (index: number, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onRemove: (index: number) => void;
};

export function DraggableFavoritesList({
  tab,
  filteredItems,
  dragIdx,
  insertIdx,
  isDragging,
  onDragStart,
  onDragOver,
  onDragEnd,
  onRemove,
}: Props) {
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
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        onRemove={onRemove}
      />
    );

    if (isDragging && insertIdx === originalIndex + 1) {
      rows.push(<li key={`drop-${originalIndex + 1}`} className="drop-indicator" aria-hidden />);
    }
  });

  return <ul className={`fav-list${isDragging ? " fav-list--dragging" : ""}`} role="list">{rows}</ul>;
}
