import { GripVertical, Star, Trash2 } from "lucide-react";
import { useState } from "react";

export type FavoriteListItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

type FavoriteListProps = {
  items: FavoriteListItem[];
  emptyMessage: string;
  disabled?: boolean;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onRemove: (id: string) => void;
};

export function FavoriteList({
  items,
  emptyMessage,
  disabled,
  onReorder,
  onRemove,
}: FavoriteListProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return <p className="mf-empty">{emptyMessage}</p>;
  }

  return (
    <ul className="mf-list" aria-label="Favorites">
      {items.map((item, index) => (
        <li
          key={item.id}
          className={`mf-list__item${
            dragIndex === index ? " mf-list__item--dragging" : ""
          }${overIndex === index ? " mf-list__item--over" : ""}`}
          draggable={!disabled}
          onDragStart={() => setDragIndex(index)}
          onDragEnd={() => {
            setDragIndex(null);
            setOverIndex(null);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setOverIndex(index);
          }}
          onDragLeave={() => setOverIndex(null)}
          onDrop={(event) => {
            event.preventDefault();
            if (dragIndex !== null && dragIndex !== index) {
              onReorder(dragIndex, index);
            }
            setDragIndex(null);
            setOverIndex(null);
          }}
        >
          <Star
            className="mf-list__star"
            size={16}
            strokeWidth={2}
            fill="currentColor"
            aria-hidden="true"
          />
          <span className="mf-list__handle" aria-hidden="true">
            <GripVertical size={16} strokeWidth={2} />
          </span>
          <a className="mf-list__link" href={item.href}>
            <span className="mf-list__title">{item.title}</span>
            {item.subtitle ? (
              <span className="mf-list__subtitle">{item.subtitle}</span>
            ) : null}
          </a>
          <button
            type="button"
            className="mf-list__remove"
            aria-label={`Remove ${item.title} from favorites`}
            disabled={disabled}
            onClick={() => onRemove(item.id)}
          >
            <Trash2 size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </li>
      ))}
    </ul>
  );
}
