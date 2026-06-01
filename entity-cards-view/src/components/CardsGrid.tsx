import type { ArrayDisplayMode, BlueprintPropertyMeta, BooleanDisplayMode, PortEntity } from "../types";
import { EntityCard } from "./EntityCard";

type CardsGridProps = {
  entities: PortEntity[];
  blueprintIdentifier: string;
  visibleProperties: BlueprintPropertyMeta[];
  getArrayDisplayMode: (propertyId: string) => ArrayDisplayMode;
  getBooleanDisplayMode: (propertyId: string) => BooleanDisplayMode;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export function CardsGrid({
  entities,
  blueprintIdentifier,
  visibleProperties,
  getArrayDisplayMode,
  getBooleanDisplayMode,
  onRefresh,
  isRefreshing,
}: CardsGridProps) {
  return (
    <ul className="cards-grid">
      {entities.map((entity) => (
        <li key={entity.identifier}>
          <EntityCard
            entity={entity}
            blueprintIdentifier={blueprintIdentifier}
            visibleProperties={visibleProperties}
            getArrayDisplayMode={getArrayDisplayMode}
            getBooleanDisplayMode={getBooleanDisplayMode}
            onRefresh={onRefresh}
            isRefreshing={isRefreshing}
          />
        </li>
      ))}
    </ul>
  );
}
