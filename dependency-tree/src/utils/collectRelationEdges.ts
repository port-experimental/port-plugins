export interface RelationEdge {
  sourceId: string;
  targetId: string;
  relationKey: string;
}

/**
 * Extracts all relation edges from an entity's relations map.
 * Handles plain string identifiers (search API) and enriched objects
 * ({ identifier, title }) provided by PLUGIN_DATA from Port's frontend.
 */
export function collectRelationEdges(
  sourceId: string,
  relations: Record<string, unknown>,
): RelationEdge[] {
  const edges: RelationEdge[] = [];

  function extractId(value: unknown): string | null {
    if (typeof value === 'string') return value || null;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const id = (value as Record<string, unknown>).identifier;
      return typeof id === 'string' && id ? id : null;
    }
    return null;
  }

  for (const [relationKey, value] of Object.entries(relations)) {
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        const targetId = extractId(item);
        if (targetId) edges.push({ sourceId, targetId, relationKey });
      }
    } else {
      const targetId = extractId(value);
      if (targetId) edges.push({ sourceId, targetId, relationKey });
    }
  }
  return edges;
}
