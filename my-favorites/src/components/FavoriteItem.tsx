import { GripVerticalIcon, Trash2Icon, LayoutDashboardIcon, Table2Icon, ZapIcon, BoxIcon } from "lucide-react";
import { showRunActionDialog } from "@port-labs/plugins-sdk";
import type { TabKey, FavoritePage, FavoriteAction, FavoriteEntity } from "../types";
import { DEV_MOCK } from "../hooks/usePostMessageData";
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

function getItemIcon(tab: TabKey, item: AnyFavorite) {
  if (tab === "pages") {
    return (item as FavoritePage).icon === "table-2"
      ? <Table2Icon size={16} aria-hidden />
      : <LayoutDashboardIcon size={16} aria-hidden />;
  }
  if (tab === "selfService") return <ZapIcon size={16} aria-hidden />;
  return <BoxIcon size={16} aria-hidden />;
}

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

function getRightLabel(tab: TabKey, item: AnyFavorite): string | undefined {
  if (tab === "pages") return (item as FavoritePage).type;
  if (tab === "selfService") return (item as FavoriteAction).blueprint;
  const e = item as FavoriteEntity;
  return e.blueprintTitle ?? e.blueprint;
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
  const rightLabel = getRightLabel(tab, item);


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
        {/* Drag handle */}
        <span className="fav-drag-handle" aria-label="Drag to reorder">
          <GripVerticalIcon size={14} aria-hidden />
        </span>

        {/* Type icon */}
        <span className="fav-item-icon" aria-hidden>
          {getItemIcon(tab, item)}
        </span>

        {/* Title */}
        <span className="fav-item-title">{item.title}</span>

        {/* Right label */}
        {rightLabel && (
          <span className="fav-item-right">
            <span className="fav-item-right-icon" aria-hidden>
              {getItemIcon(tab, item)}
            </span>
            {rightLabel}
          </span>
        )}
      </button>

      <button
        type="button"
        className="fav-remove-btn"
        aria-label={`Remove ${item.title}`}
        onClick={(e) => { e.stopPropagation(); onRemove(index); }}
      >
        <Trash2Icon size={13} aria-hidden />
      </button>
    </li>
  );
}
