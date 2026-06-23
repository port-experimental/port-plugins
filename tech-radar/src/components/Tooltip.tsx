import React from 'react';
import { RING_COLORS, QUAD_COLORS } from '../types';
import type { Blip } from '../types';

const MOVED_LABEL: Record<number, string> = { 2: '✦ New', 1: '▲ Moved in', 0: '', '-1': '▼ Moved out' };

// Blend the category color toward the theme's text color so the label stays
// readable in both modes: it darkens on a light tooltip, lightens on a dark one.
const badgeStyle = (color: string): React.CSSProperties => ({
  background: `color-mix(in srgb, ${color} 18%, transparent)`,
  color: `color-mix(in srgb, ${color} 50%, var(--text-strong, #e6edf3))`,
  borderColor: `color-mix(in srgb, ${color} 70%, transparent)`,
});

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
        <span className="tt-badge" style={badgeStyle(RING_COLORS[blip.ring])}>
          {blip.ring}
        </span>
        <span className="tt-badge" style={badgeStyle(QUAD_COLORS[blip.quadrant])}>
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
