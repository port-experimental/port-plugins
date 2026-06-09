export type Ring     = 'Adopt' | 'Trial' | 'Assess' | 'Hold';
export type Quadrant = 'AI Models & APIs' | 'AI Dev Tools' | 'AI Platforms & Infra' | 'Frameworks & Orchestration';

export interface Blip {
  id:          string;
  label:       number;       // display number on radar
  name:        string;
  quadrant:    Quadrant;
  ring:        Ring;
  description: string;
  url:         string;
  moved:       number;       // 2=new, 1=in, 0=same, -1=out
  x:           number;       // final SVG x (relative to center)
  y:           number;       // final SVG y (relative to center)
}

export const RINGS: Ring[] = ['Adopt', 'Trial', 'Assess', 'Hold'];
export const QUADRANTS: Quadrant[] = [
  'AI Models & APIs',
  'AI Dev Tools',
  'AI Platforms & Infra',
  'Frameworks & Orchestration',
];

// Outer radius for each ring (index 0 = Adopt, innermost)
export const RING_RADII = [105, 185, 265, 340];

// Starting angle (radians) for each quadrant, going clockwise from top-right
// Q0 top-right: -π/2 → 0
// Q1 top-left:  π → -π/2  (i.e. π → 3π/2 but mirrored)
// We define as [startAngle, endAngle] in math convention (CCW from +x)
export const QUAD_ANGLES: [number, number][] = [
  [-Math.PI / 2, 0],           // Q0 AI Models & APIs   (top-right)
  [-Math.PI, -Math.PI / 2],    // Q1 AI Dev Tools        (top-left)
  [Math.PI / 2, Math.PI],      // Q2 AI Platforms & Infra (bottom-left)
  [0, Math.PI / 2],            // Q3 Frameworks           (bottom-right)
];

export const QUAD_COLORS: Record<Quadrant, string> = {
  'AI Models & APIs':          '#a78bfa',  // violet
  'AI Dev Tools':              '#60a5fa',  // blue
  'AI Platforms & Infra':      '#34d399',  // teal
  'Frameworks & Orchestration':'#fb923c',  // orange
};

export const RING_COLORS: Record<Ring, string> = {
  Adopt:  '#4ade80',
  Trial:  '#60a5fa',
  Assess: '#fbbf24',
  Hold:   '#f87171',
};
