import { RING_RADII, QUAD_ANGLES, RINGS, QUADRANTS } from '../types';
import type { Blip, Ring, Quadrant } from '../types';

// Deterministic hash from a string → 0..1
function seededRand(seed: string, salt: number): number {
  let h = salt;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
  }
  h ^= h >>> 16;
  h = Math.imul(0x45d9f3b, h);
  h ^= h >>> 16;
  return (h >>> 0) / 0xffffffff;
}

export function positionBlip(id: string, ring: Ring, quadrant: Quadrant): { x: number; y: number } {
  const ri = RINGS.indexOf(ring);
  const qi = QUADRANTS.indexOf(quadrant);

  const innerR = ri === 0 ? 20 : RING_RADII[ri - 1] + 8;
  const outerR = RING_RADII[ri] - 8;

  const [aStart, aEnd] = QUAD_ANGLES[qi];
  const padding = 0.15; // keep blips away from quadrant edges

  const r = innerR + seededRand(id, 1) * (outerR - innerR);
  const a = aStart + padding * (aEnd - aStart) + seededRand(id, 2) * (1 - 2 * padding) * (aEnd - aStart);

  return { x: r * Math.cos(a), y: r * Math.sin(a) };
}

export interface PortSoftwareEntity {
  identifier: string;
  title:      string;
  properties: {
    quadrant?:    string;
    ring?:        string;
    description?: string;
    url?:         string;
    moved?:       number;
  };
}

export function entitiesToBlips(entities: PortSoftwareEntity[]): Blip[] {
  const blips: Blip[] = [];
  let label = 1;

  // Sort by quadrant then name for stable numbering
  const sorted = [...entities].sort((a, b) => {
    const qDiff = (a.properties.quadrant ?? '').localeCompare(b.properties.quadrant ?? '');
    return qDiff !== 0 ? qDiff : (a.title ?? '').localeCompare(b.title ?? '');
  });

  for (const e of sorted) {
    const ring     = (e.properties.ring     ?? 'Assess') as Ring;
    const quadrant = (e.properties.quadrant ?? 'AI Dev Tools') as Quadrant;
    if (!RINGS.includes(ring) || !QUADRANTS.includes(quadrant)) continue;

    const { x, y } = positionBlip(e.identifier, ring, quadrant);
    blips.push({
      id:          e.identifier,
      label:       label++,
      name:        e.title ?? e.identifier,
      quadrant,
      ring,
      description: e.properties.description ?? '',
      url:         e.properties.url ?? '',
      moved:       e.properties.moved ?? 0,
    x, y,
    });
  }
  return blips;
}
