import { BarChart3, Package } from "lucide-react";

type EmptyStateProps = {
  blueprintTitle: string;
  hasEntities: boolean;
};

export function EmptyState({ blueprintTitle, hasEntities }: EmptyStateProps) {
  const Icon = hasEntities ? BarChart3 : Package;
  const title = hasEntities ? "No scorecards yet" : "No entities found";
  const text = hasEntities
    ? `No scorecards are defined for ${blueprintTitle}. Create scorecards in Port to see compliance bars here.`
    : `No entities found for ${blueprintTitle}.`;

  return (
    <div className="status-panel">
      <Icon size={48} strokeWidth={1.5} aria-hidden />
      <p className="status-panel__title">{title}</p>
      <p className="status-panel__text">{text}</p>
    </div>
  );
}
