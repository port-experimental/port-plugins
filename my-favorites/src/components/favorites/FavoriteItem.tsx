import { CheckIcon, Link2Icon, StarIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { showRunActionDialog, showRunWorkflowDialog } from "@port-labs/plugins-sdk";
import type { TabKey, FavoritePage, FavoriteAction, FavoriteEntity } from "../../types";
import { DEV_MOCK } from "../../hooks/usePostMessageData";
import { TabTypeIcon } from "../shared/TabTypeIcon";
import { BlueprintLabel } from "../shared/BlueprintLabel";
import { ActionTooltip } from "../shared/ActionTooltip";
import { FavoriteItemText, type FavoriteItemTextHandle } from "./FavoriteItemText";
import {
  buildPageUrl,
  buildEntityPageUrl,
  buildSelfServiceActionUrl,
  buildWorkflowSelfServeUrl,
} from "../../utils/portalUrl";
import { copyText } from "../../utils/copyText";

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

function getItemUrl(tab: TabKey, item: AnyFavorite): string | null {
  if (tab === "pages") {
    return buildPageUrl((item as FavoritePage).identifier);
  }
  if (tab === "entities") {
    return buildEntityPageUrl((item as FavoriteEntity).blueprint, item.identifier);
  }
  if (tab === "selfService") {
    const self = item as FavoriteAction;
    return self.type === "workflow"
      ? buildWorkflowSelfServeUrl(self.identifier, self.triggerIdentifier!)
      : buildSelfServiceActionUrl(self.identifier);
  }
  return null;
}

function handleItemClick(tab: TabKey, item: AnyFavorite) {
  if (tab === "selfService") {
    if (!DEV_MOCK) {
      const self = item as FavoriteAction;
      if (self.type === "workflow") {
        showRunWorkflowDialog({
          workflowIdentifier: self.identifier,
          triggerIdentifier: self.triggerIdentifier!,
        });
      } else {
        showRunActionDialog(self.identifier);
      }
    }
    return;
  }
  const url = getItemUrl(tab, item);
  if (!url) return;
  window.open(url, "_top");
}

const COPY_SUCCESS_MS = 1500;

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
  const itemTextRef = useRef<FavoriteItemTextHandle>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const copyResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    };
  }, []);

  async function handleCopyLink(e: React.MouseEvent<HTMLButtonElement>) {
    e.stopPropagation();
    const url = getItemUrl(tab, item);
    if (!url) return;

    const copied = await copyText(url);
    if (!copied) return;

    setLinkCopied(true);
    if (copyResetTimer.current) clearTimeout(copyResetTimer.current);
    copyResetTimer.current = setTimeout(() => {
      setLinkCopied(false);
      copyResetTimer.current = null;
    }, COPY_SUCCESS_MS);
  }

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
      onClick={() => handleItemClick(tab, item)}
      className={[
        "fav-item",
        isDragging ? "fav-item--dragging" : "",
        isDraggingAny ? "fav-item--any-dragging" : "",
      ].filter(Boolean).join(" ")}
    >
      <button
        type="button"
        className="fav-item-btn"
        onFocus={() => itemTextRef.current?.showTooltip()}
        onBlur={() => itemTextRef.current?.hideTooltip()}
      >
        {/* Type icon */}
        <span className="fav-item-icon" aria-hidden>
          <TabTypeIcon tab={tab} size={24} />
        </span>

        <FavoriteItemText
          ref={itemTextRef}
          title={item.title}
          description={
            tab === "selfService" ? (item as FavoriteAction).description : undefined
          }
        />

        {tab === "entities" && (
          <BlueprintLabel
            title={(item as FavoriteEntity).blueprintTitle}
            identifier={(item as FavoriteEntity).blueprint}
            className="fav-item-blueprint"
          />
        )}

      </button>

      <div className="fav-item-actions">
        <ActionTooltip label={linkCopied ? "Copied" : "Copy link"}>
          <button
            type="button"
            className={[
              "fav-item-action-btn",
              linkCopied ? "fav-item-action-btn--copied" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            aria-label={
              linkCopied ? "Link copied" : `Copy link for ${item.title}`
            }
            onClick={(e) => void handleCopyLink(e)}
          >
            <span
              className={`fav-item-action-btn__icon${linkCopied ? " fav-item-action-btn__icon--copied" : ""}`}
              aria-hidden
            >
              {linkCopied ? (
                <span className="fav-item-action-btn__copy-success">
                  <span className="fav-item-action-btn__copy-success-mark">
                    <CheckIcon size={10} strokeWidth={3} />
                  </span>
                </span>
              ) : (
                <Link2Icon size={18} />
              )}
            </span>
          </button>
        </ActionTooltip>
        <ActionTooltip label="Remove from favorites">
          <button
            type="button"
            className="fav-item-action-btn fav-item-action-btn--star"
            aria-label="Remove from favorites"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(index);
            }}
          >
            <StarIcon size={18} fill="currentColor" aria-hidden />
          </button>
        </ActionTooltip>
      </div>
    </li>
  );
}
