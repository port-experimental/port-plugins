const PALETTE = [
  '#3c73f3', // blue
  '#8b5cf6', // purple
  '#22c55e', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
];

/** Deterministic hash of a string → palette index */
function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/** Returns a consistent hex color for a given relation type name. */
export function getRelationColor(relationType: string): string {
  return PALETTE[hashString(relationType) % PALETTE.length];
}
