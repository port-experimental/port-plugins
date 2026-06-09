import React from 'react';
import { RING_COLORS, QUAD_COLORS } from '../types';
import type { Blip } from '../types';

const MOVED_LABEL: Record<number, string> = { 2: '✦ New', 1: '▲ Moved in', 0: '', '-1': '▼ Moved out' };

interface Props {
  blip: Blip;
  x: number;
  y: number;
}

export function Tooltip({ blip, x, y }: Props) {
  return (
    <div
      className="radar-tooltip"
      style={{ left: x + 14, top: y - 10 }}
    >
      <div className="tt-header">
        <span className="tt-num">{blip.label}</span>
        <span className="tt-name">{blip.name}</span>
      </div>
      <div className="tt-badges">
        <span className="tt-badge" style={{ background: RING_COLORS[blip.ring] + '33', color: RING_COLORS[blip.ring], borderColor: RING_COLORS[blip.ring] }}>
          {blip.ring}
        </span>
        <span className="tt-badge" style={{ background: QUAD_COLORS[blip.quadrant] + '22', color: QUAD_COLORS[blip.quadrant], borderColor: QUAD_COLORS[blip.quadrant] }}>
          {blip.quadrant}
        </span>
        {blip.moved !== 0 && (
          <span className="tt-badge tt-moved">{MOVED_LABEL[blip.moved] ?? ''}</span>
        )}
      </div>
      {blip.description && <p className="tt-desc">{blip.description}</p>}
    </div>
  );
}
