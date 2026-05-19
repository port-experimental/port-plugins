import type { PortEntity } from "../types";
import { toDateKey } from "./dates";

export function getEntityDateKey(
  entity: PortEntity,
  createdDateProperty: string
): string | null {
  if (createdDateProperty) {
    const fromProp = toDateKey(entity.properties?.[createdDateProperty]);
    if (fromProp) return fromProp;
  }

  const fromCreatedAt = toDateKey(entity.createdAt);
  return fromCreatedAt;
}
