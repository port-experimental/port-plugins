const PALETTE_CLASSES = [
  "avatar--blue",
  "avatar--purple",
  "avatar--turquoise",
  "avatar--olive",
  "avatar--pink",
  "avatar--ocean-blue",
];

function hashToIndex(value: string, size: number): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash % size;
}

/** Port-style circular initial avatar, hue picked deterministically per entity. */
export function EntityAvatar({ label }: { label: string }) {
  const initial = label.trim().charAt(0).toUpperCase() || "?";
  const colorClass = PALETTE_CLASSES[hashToIndex(label, PALETTE_CLASSES.length)];
  return <span className={`avatar ${colorClass}`}>{initial}</span>;
}
