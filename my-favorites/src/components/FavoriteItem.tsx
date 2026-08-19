import { Link2Icon, StarIcon } from "lucide-react";
import { showRunActionDialog } from "@port-labs/plugins-sdk";
import type { TabKey, FavoritePage, FavoriteAction, FavoriteEntity } from "../types";
import { DEV_MOCK } from "../hooks/usePostMessageData";
import { TabTypeIcon } from "./TabTypeIcon";
import {
  buildPageUrl,
  buildEntityPageUrl,
} from "../utils/portalUrl";

export type AnyFavorite = FavoritePage | FavoriteAction | FavoriteEntity;

type Props = {
  item: AnyFavorite;
  tab: TabKey;
  index: number;
  isDragging: boolean;
  isDraggingAny: boolean;
  onDragStart: (index: number) => void;
  onDragOver: (index: number, e: React.DragEvent) => void;
  onDragEnd: () => void;
  onRemove: (index: number) => void;
};

function handleItemClick(tab: TabKey, item: AnyFavorite) {
  if (tab === "selfService") {
    if (!DEV_MOCK) {
      showRunActionDialog((item as FavoriteAction).identifier);
    }
    return;
  }
  const url =
    tab === "pages"
      ? buildPageUrl((item as FavoritePage).identifier)
      : buildEntityPageUrl((item as FavoriteEntity).blueprint, item.identifier);
  window.open(url, "_top");
}

export function FavoriteItem({
  item,
  tab,
  index,
  isDragging,
  isDraggingAny,
  onDragStart,
  onDragOver,
  onDragEnd,
  onRemove,
}: Props) {
  function handleDragStart(e: React.DragEvent) {
    e.dataTransfer.effectAllowed = "move";

    // Build an elevated ghost clone
    const node = e.currentTarget as HTMLElement;
    const ghost = node.cloneNode(true) as HTMLElement;
    const w = node.offsetWidth;
    ghost.style.cssText = `
      position: fixed;
      top: 0;
      left: -${w + 100}px;
      width: ${w}px;
      opacity: 0.92;
      transform: scale(1.03);
      box-shadow: 0 10px 28px rgba(0,0,0,0.18);
      background: #ffffff;
      border-radius: 8px;
      pointer-events: none;
      overflow: hidden;
    `;
    document.body.appendChild(ghost);
    e.dataTransfer.setDragImage(ghost, e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    requestAnimationFrame(() => {
      if (document.body.contains(ghost)) document.body.removeChild(ghost);
    });

    onDragStart(index);
  }

  return (
    <li
      draggable
      onDragStart={handleDragStart}
      onDragOver={(e) => onDragOver(index, e)}
      onDragEnd={onDragEnd}
      className={[
        "fav-item",
        isDragging ? "fav-item--dragging" : "",
        isDraggingAny ? "fav-item--any-dragging" : "",
      ].filter(Boolean).join(" ")}
    >
      <button
        type="button"
        className="fav-item-btn"
        onClick={() => handleItemClick(tab, item)}
        title={tab === "selfService" ? `Run ${item.title}` : `Open ${item.title}`}
      >
        {/* Type icon */}
        <span className="fav-item-icon" aria-hidden>
          <TabTypeIcon tab={tab} size={24} />
        </span>

        {/* Title */}
        <span className="fav-item-title">{item.title}</span>

      </button>

      <div className="fav-item-actions">
        <button
          type="button"
          className="fav-item-action-btn"
          aria-label={tab === "selfService" ? `Run ${item.title}` : `Open ${item.title}`}
          title={tab === "selfService" ? `Run ${item.title}` : `Open ${item.title}`}
          onClick={(e) => {
            e.stopPropagation();
            handleItemClick(tab, item);
          }}
        >
          <Link2Icon size={18} aria-hidden />
        </button>
        <button
          type="button"
          className="fav-item-action-btn fav-item-action-btn--star"
          aria-label={`Remove ${item.title} from favorites`}
          title={`Remove ${item.title} from favorites`}
          onClick={(e) => {
            e.stopPropagation();
            onRemove(index);
          }}
        >
          <StarIcon size={18} fill="currentColor" aria-hidden />
        </button>
      </div>
    </li>
  );
}
