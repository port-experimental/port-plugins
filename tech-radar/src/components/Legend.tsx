import React from 'react';
import { QUADRANTS, RINGS, QUAD_COLORS, RING_COLORS } from '../types';
import type { Blip, Ring, Quadrant } from '../types';

const MOVED_ICON: Record<number, string> = { 2: '✦', 1: '▲', 0: '', [-1]: '▼' };

interface Props {
  blips: Blip[];
  activeQuadrant: Quadrant | null;
  activeRing: Ring | null;
  selectedBlip: string | null;
  onQuadrantHover: (q: Quadrant | null) => void;
  onRingHover: (r: Ring | null) => void;
  onBlipClick: (id: string) => void;
}

export function Legend({
  blips, activeQuadrant, activeRing, selectedBlip,
  onQuadrantHover, onRingHover, onBlipClick,
}: Props) {
  return (
    <div className="legend">

      {/* Ring filter pills */}
      <div className="legend-rings">
        {RINGS.map(ring => (
          <button
            key={ring}
            className={`ring-pill ${activeRing === ring ? 'active' : ''}`}
            style={{
              '--pill-color': RING_COLORS[ring],
            } as React.CSSProperties}
            onMouseEnter={() => onRingHover(ring)}
            onMouseLeave={() => onRingHover(null)}
            onClick={() => onRingHover(activeRing === ring ? null : ring)}
          >
            {ring}
          </button>
        ))}
      </div>

      {/* Quadrant sections */}
      <div className="legend-quadrants">
        {QUADRANTS.map(quadrant => {
          const color = QUAD_COLORS[quadrant];
          const section = blips.filter(b => b.quadrant === quadrant);
          const dimmed  = activeQuadrant !== null && activeQuadrant !== quadrant;

          // Sort by ring order then name
          const sorted = [...section].sort((a, b) => {
            const ri = RINGS.indexOf(a.ring) - RINGS.indexOf(b.ring);
            return ri !== 0 ? ri : a.name.localeCompare(b.name);
          });

          return (
            <div
              key={quadrant}
              className={`legend-section ${dimmed ? 'dimmed' : ''}`}
              onMouseEnter={() => onQuadrantHover(quadrant)}
              onMouseLeave={() => onQuadrantHover(null)}
            >
              <div className="legend-section-header" style={{ color }}>
                <span className="legend-dot" style={{ background: color }} />
                {quadrant}
                <span className="legend-count">{section.length}</span>
              </div>

              {sorted.map(blip => {
                const ringDimmed = activeRing !== null && activeRing !== blip.ring;
                return (
                  <div
                    key={blip.id}
                    className={`legend-item ${selectedBlip === blip.id ? 'selected' : ''} ${ringDimmed ? 'dimmed' : ''}`}
                    onClick={() => onBlipClick(blip.id)}
                  >
                    <span className="legend-num" style={{ background: color }}>{blip.label}</span>
                    <span className="legend-name">{blip.name}</span>
                    <span className="legend-ring" style={{ color: RING_COLORS[blip.ring] }}>
                      {blip.ring}
                    </span>
                    {blip.moved !== 0 && (
                      <span className={`legend-moved moved-${blip.moved > 0 ? 'in' : 'out'}`}>
                        {MOVED_ICON[blip.moved] ?? ''}
                      </span>
                    )}
                    {blip.url && (
                      <a
                        href={blip.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="legend-link"
                        onClick={e => e.stopPropagation()}
                      >↗</a>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
