import { BookmarkIcon } from "lucide-react";
import type { TabKey } from "../types";

const MESSAGES: Record<TabKey, { heading: string; hint: string }> = {
  pages: {
    heading: "No favorite pages yet",
    hint: "Add pages you visit often for quick access.",
  },
  selfService: {
    heading: "No favorite self-service actions yet",
    hint: "Add self-service actions you run regularly.",
  },
  entities: {
    heading: "No favorite entities yet",
    hint: "Bookmark entities you want to keep an eye on.",
  },
};

type Props = { tab: TabKey };

export function EmptyState({ tab }: Props) {
  const { heading, hint } = MESSAGES[tab];
  return (
    <div className="empty-state">
      <BookmarkIcon size={26} className="empty-state-icon" aria-hidden />
      <p className="empty-state-heading">{heading}</p>
      <p className="empty-state-hint">{hint}</p>
    </div>
  );
}
