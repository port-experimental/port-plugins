import React from "react";
import type { Entity, ScorecardLevel } from "../types";
import { hexToRgba } from "../constants";
import { EntityIcon } from "./EntityIcon";

interface Props {
  item: Entity;
  level: ScorecardLevel;
  selected: boolean;
  onClick: () => void;
}

const CUBE_SIZE = 88;
const ICON_SIZE = 30;

export function Cube({ item, level, selected, onClick }: Props) {
  const badgeLabel = level.title.slice(0, 3).toUpperCase();

  const style: React.CSSProperties = {
    width: CUBE_SIZE,
    height: CUBE_SIZE,
    "--lvl-color": level.hex,
    "--lvl-bg": hexToRgba(level.hex, 0.08),
    "--lvl-border": hexToRgba(level.hex, 0.3),
    "--lvl-glow-shadow": hexToRgba(level.hex, 0.47),
    "--lvl-badge-bg": hexToRgba(level.hex, 0.2),
    "--lvl-badge-text": level.hex,
  } as React.CSSProperties;

  return (
    <div
      className={`cube${selected ? " cube--selected" : ""}`}
      style={style}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <span className="cube__badge">{badgeLabel}</span>

      <EntityIcon
        portIcon={item.portIcon}
        iconValue={item.iconValue}
        id={item.id}
        size={ICON_SIZE}
        tint={level.hex}
      />

      <span className="cube__label">{item.title ?? "—"}</span>

      {item.counters.some((c) => c.value > 0) && (
        <div className="cube__counts">
          {item.counters
            .filter((c) => c.value > 0)
            .map((c) => (
              <span key={c.label} className="cube__count">
                {c.emoji}
                {c.value}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}
