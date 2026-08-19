import { PlusIcon, StarIcon } from "lucide-react";
import type { ReactNode } from "react";
import type { TabKey } from "../types";

const MESSAGES: Record<
  TabKey,
  { heading: string; hint: string; buttonLabel: string }
> = {
  pages: {
    heading: "There are no favorite pages",
    hint: "Add a page as a favorite to display it here",
    buttonLabel: "Page",
  },
  entities: {
    heading: "There are no favorite entities",
    hint: "Add an entity as a favorite to display it here",
    buttonLabel: "Entity",
  },
  selfService: {
    heading: "There are no favorite actions",
    hint: "Add an action as a favorite to display it here",
    buttonLabel: "Action",
  },
};

type Props = {
  tab: TabKey;
  onAddClick: () => void;
  children?: ReactNode;
};

export function EmptyState({ tab, onAddClick, children }: Props) {
  const { heading, hint, buttonLabel } = MESSAGES[tab];
  return (
    <div className="empty-state">
      <StarIcon size={44} className="empty-state-icon" strokeWidth={1.5} aria-hidden />
      <p className="empty-state-title">{heading}</p>
      <p className="empty-state-hint">{hint}</p>
      <div className="empty-state-add-wrap">
        <button type="button" className="empty-state-add-btn" onClick={onAddClick}>
          <PlusIcon size={20} aria-hidden />
          {buttonLabel}
        </button>
        {children}
      </div>
    </div>
  );
}
