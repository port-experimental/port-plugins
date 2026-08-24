import { PlusIcon, StarIcon } from "lucide-react";
import type { ReactNode, RefObject } from "react";
import type { TabKey } from "../../types";

const MESSAGES: Record<TabKey, { heading: string; hint: string }> = {
  pages: {
    heading: "There are no favorite pages",
    hint: "Add a page as a favorite to display it here",
  },
  entities: {
    heading: "There are no favorite entities",
    hint: "Add an entity as a favorite to display it here",
  },
  selfService: {
    heading: "There are no favorite actions or workflows",
    hint: "Add an action or workflow as a favorite to display it here",
  },
};

type Props = {
  tab: TabKey;
  onAddClick: () => void;
  onOpenAdd: () => void;
  addButtonRef?: RefObject<HTMLButtonElement | null>;
  addModalOpen?: boolean;
  addModalId?: string;
  children?: ReactNode;
};

export function EmptyState({
  tab,
  onAddClick,
  onOpenAdd,
  addButtonRef,
  addModalOpen = false,
  addModalId,
  children,
}: Props) {
  const { heading, hint } = MESSAGES[tab];
  return (
    <div className="empty-state">
      <StarIcon size={44} className="empty-state-icon" strokeWidth={1.5} aria-hidden />
      <p className="empty-state-title">{heading}</p>
      <p className="empty-state-hint">{hint}</p>
      <div className="empty-state-add-wrap">
        <button
          type="button"
          ref={addButtonRef}
          className="empty-state-add-btn"
          onClick={onAddClick}
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
        {children}
      </div>
    </div>
  );
}
