import React, { useRef, useState, useCallback } from 'react';
import { RINGS, QUADRANTS, RING_RADII, QUAD_ANGLES, QUAD_COLORS, RING_COLORS } from '../types';
import { Tooltip } from './Tooltip';
import type { Blip, Ring } from '../types';

const CX = 360;  // SVG center x
const CY = 360;  // SVG center y
const W  = 720;
const H  = 720;

const RING_INNER = [0, ...RING_RADII.slice(0, -1)];

function ringLabelRadius(i: number) {
  return (RING_INNER[i] + RING_RADII[i]) / 2;
}

// Draw a wedge path for a quadrant background
function wedgePath(qi: number, innerR: number, outerR: number): string {
  const [a0, a1] = QUAD_ANGLES[qi];
  const x0i = Math.cos(a0) * innerR, y0i = Math.sin(a0) * innerR;
  const x1i = Math.cos(a1) * innerR, y1i = Math.sin(a1) * innerR;
  const x0o = Math.cos(a0) * outerR, y0o = Math.sin(a0) * outerR;
  const x1o = Math.cos(a1) * outerR, y1o = Math.sin(a1) * outerR;
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  const dir = a1 > a0 ? 1 : 0;
  return [
    `M ${x0i} ${y0i}`,
    `A ${innerR} ${innerR} 0 ${large} ${dir} ${x1i} ${y1i}`,
    `L ${x1o} ${y1o}`,
    `A ${outerR} ${outerR} 0 ${large} ${1 - dir} ${x0o} ${y0o}`,
    'Z',
  ].join(' ');
}

// Small corner badge marking how the blip moved since the last radar.
// Rendered offset to the top-right so it never covers the blip's number.
function MovedIndicator({ moved }: { moved: number }) {
  if (moved !== 2 && moved !== 1 && moved !== -1) return null;
  const icon =
    moved === 1  ? <polygon points="0,-2.6 2.4,1.4 -2.4,1.4" fill="#fff" /> :   // moved in  (up triangle)
    moved === -1 ? <polygon points="0,2.6 2.4,-1.4 -2.4,-1.4" fill="#fff" /> :  // moved out (down triangle)
                   <circle r={2.2} fill="#fff" />;                             // new
  return (
    <g transform="translate(10,-10)">
      <circle r={5} fill="rgb(var(--background-primary,13 17 23))" stroke="rgba(255,255,255,0.45)" strokeWidth={1} />
      {icon}
    </g>
  );
}

interface Props {
  blips: Blip[];
  activeRing: Ring | null;
  activeQuadrant: string | null;
  selectedBlip: string | null;
  onBlipHover: (id: string | null, x: number, y: number) => void;
  onBlipClick: (id: string) => void;
}

export function Radar({ blips, activeRing, activeQuadrant, selectedBlip, onBlipHover, onBlipClick }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<{ blip: Blip; x: number; y: number } | null>(null);

  const handleBlipEnter = useCallback((blip: Blip, e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltip({ blip, x: e.clientX, y: e.clientY });
    onBlipHover(blip.id, e.clientX, e.clientY);
  }, [onBlipHover]);

  const handleBlipLeave = useCallback(() => {
    setTooltip(null);
    onBlipHover(null, 0, 0);
  }, [onBlipHover]);

  const maxR = RING_RADII[RING_RADII.length - 1];

  return (
    <div className="radar-svg-wrap" style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        aria-label="Tech Radar"
      >
        <g transform={`translate(${CX},${CY})`}>

          {/* Quadrant background wedges */}
          {QUADRANTS.map((q, qi) => {
            const color = QUAD_COLORS[q];
            const dimmed = activeQuadrant !== null && activeQuadrant !== q;
            return (
              <path
                key={q}
                d={wedgePath(qi, 0, maxR + 2)}
                fill={color}
                opacity={dimmed ? 0.02 : 0.06}
                style={{ transition: 'opacity .2s' }}
              />
            );
          })}

          {/* Ring circles */}
          {RING_RADII.map((r, i) => {
            const ring = RINGS[i];
            const dimmed = activeRing !== null && activeRing !== ring;
            return (
              <circle
                key={ring}
                r={r}
                fill="none"
                stroke={RING_COLORS[ring]}
                strokeWidth={1.5}
                opacity={dimmed ? 0.12 : 0.35}
                style={{ transition: 'opacity .2s' }}
              />
            );
          })}

          {/* Quadrant divider lines */}
          <line x1={0} y1={-(maxR + 10)} x2={0} y2={maxR + 10} stroke="var(--border-medium,#30363d)" strokeWidth={1} opacity={0.5} />
          <line x1={-(maxR + 10)} y1={0} x2={maxR + 10} y2={0} stroke="var(--border-medium,#30363d)" strokeWidth={1} opacity={0.5} />

          {/* Ring labels */}
          {RINGS.map((ring, i) => {
            const r = ringLabelRadius(i);
            return (
              <text
                key={ring}
                x={6} y={-r}
                fill={RING_COLORS[ring]}
                fontSize={10}
                fontWeight={600}
                opacity={0.7}
                style={{ userSelect: 'none' }}
              >
                {ring.toUpperCase()}
              </text>
            );
          })}

          {/* Quadrant labels (corner) */}
          {QUADRANTS.map((q, qi) => {
            const [a0, a1] = QUAD_ANGLES[qi];
            const midA = (a0 + a1) / 2;
            const labelR = maxR + 22;
            const lx = Math.cos(midA) * labelR;
            const ly = Math.sin(midA) * labelR;
            const color = QUAD_COLORS[q];
            const dimmed = activeQuadrant !== null && activeQuadrant !== q;
            return (
              <text
                key={q}
                x={lx} y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={color}
                fontSize={11}
                fontWeight={700}
                opacity={dimmed ? 0.25 : 0.85}
                style={{ userSelect: 'none', transition: 'opacity .2s' }}
              >
                {q.split(' & ').map((part, pi) => (
                  <tspan key={pi} x={lx} dy={pi === 0 ? 0 : 13}>{part}</tspan>
                ))}
              </text>
            );
          })}

          {/* Blips */}
          {blips.map(blip => {
            const isSelected = selectedBlip === blip.id;
            const qdimmed = activeQuadrant !== null && activeQuadrant !== blip.quadrant;
            const rdimmed = activeRing !== null && activeRing !== blip.ring;
            const dimmed  = qdimmed || rdimmed;
            const color   = QUAD_COLORS[blip.quadrant];

            return (
              <g
                key={blip.id}
                transform={`translate(${blip.x},${blip.y})`}
                style={{ cursor: 'pointer', transition: 'opacity .2s' }}
                opacity={dimmed ? 0.12 : 1}
                onMouseEnter={e => handleBlipEnter(blip, e)}
                onMouseLeave={handleBlipLeave}
                onClick={() => onBlipClick(blip.id)}
              >
                <circle
                  r={13}
                  fill={color}
                  opacity={isSelected ? 1 : 0.85}
                  stroke={isSelected ? 'white' : 'none'}
                  strokeWidth={isSelected ? 2 : 0}
                />
                <text
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize={8.5}
                  fontWeight={700}
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {blip.label}
                </text>
                <MovedIndicator moved={blip.moved} />
              </g>
            );
          })}
        </g>
      </svg>

      {tooltip && (
        <Tooltip blip={tooltip.blip} x={tooltip.x} y={tooltip.y} />
      )}
    </div>
  );
}
