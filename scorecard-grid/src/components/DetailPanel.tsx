import React, { useState } from "react";
import { EntityIcon } from "./EntityIcon";
import { DrillDown } from "./DrillDown";
import type { Entity, Rule, PluginConfig, ScorecardLevel } from "../types";
import { hexToRgba } from "../constants";
import { appBaseUrl } from "../api";

interface Props {
  item:     Entity;
  level:    ScorecardLevel;
  levelMap: Map<string, ScorecardLevel>;
  rules:    Rule[];
  baseUrl:  string | null;
  token:    string | null;
  config:   PluginConfig;
  onClose:  () => void;
}

export function DetailPanel({ item, level, levelMap, rules, baseUrl, token, config, onClose }: Props) {
  const [drillDownIdx, setDrillDownIdx] = useState<number | null>(null);

  const portUrl = baseUrl
    ? `${appBaseUrl(baseUrl)}/${config.blueprintIdentifier}Entity?identifier=${item.id}`
    : null;

  const lvlStyle: React.CSSProperties = {
    "--lvl-color":    level.hex,
    "--lvl-bg":       hexToRgba(level.hex, 0.12),
    "--lvl-border":   hexToRgba(level.hex, 0.30),
    "--lvl-badge-bg": hexToRgba(level.hex, 0.18),
  } as React.CSSProperties;

  return (
    <div className="detail-panel" style={lvlStyle}>
      {/* Sticky header */}
      <div className="detail-panel__header">
        <div className="detail-panel__title-row">
          <div className="detail-panel__icon-wrap">
            <EntityIcon portIcon={item.portIcon} iconValue={item.iconValue} id={item.id} size={24} tint={level.hex} />
          </div>
          <div className="detail-panel__title-text">
            <span className="detail-panel__name">{item.title}</span>
            <span className="level-badge">
              <span className="level-badge__dot" />
              {level.title}
            </span>
          </div>
          <button className="detail-panel__close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Stat cards — driven by config.counters */}
        <div className="detail-panel__stats">
          {item.counters.map((c, i) => {
            const ddc      = config.drillDown[i];
            const active   = drillDownIdx === i;
            const clickable = c.value > 0 && !!ddc;
            return (
              <div
                key={c.label}
                className={`stat-card${clickable ? " stat-card--clickable" : ""}${active ? " stat-card--active" : ""}`}
                onClick={() => clickable && setDrillDownIdx((prev) => (prev === i ? null : i))}
                role={clickable ? "button" : undefined}
                tabIndex={clickable ? 0 : undefined}
              >
                <div className="stat-card__value">{c.emoji} {c.value}</div>
                <div className="stat-card__label">{c.label}</div>
                {clickable && <div className="stat-card__hint">click to view</div>}
              </div>
            );
          })}
        </div>

        {portUrl && (
          <button
            className="detail-panel__port-link"
            onClick={() =>
              window.parent.postMessage({ type: "OPEN_URL", data: { url: portUrl } }, "*")
            }
          >
            View in Port ↗
          </button>
        )}
      </div>

      {/* Drill-down */}
      {drillDownIdx !== null &&
        config.drillDown[drillDownIdx] &&
        baseUrl &&
        token && (
          <DrillDown
            entityId={item.id}
            mainBlueprint={config.blueprintIdentifier}
            drillConfig={config.drillDown[drillDownIdx]}
            baseUrl={baseUrl}
            token={token}
            pollIntervalSeconds={config.pollIntervalSeconds}
          />
        )}

      {/* Scorecard rules */}
      <div className="detail-panel__rules">
        <div className="detail-panel__rules-heading">Scorecard Rules</div>
        {rules.map((rule) => {
          const pass      = item.rules[rule.identifier] === true;
          const ruleLevel = levelMap.get(rule.level);
          const badgeStyle: React.CSSProperties = ruleLevel
            ? ({
                "--lvl-color":    ruleLevel.hex,
                "--lvl-badge-bg": hexToRgba(ruleLevel.hex, 0.18),
              } as React.CSSProperties)
            : {};
          return (
            <div key={rule.identifier} className={`rule-row rule-row--${pass ? "pass" : "fail"}`}>
              <div className="rule-row__icon">{pass ? "✓" : "✗"}</div>
              <div className="rule-row__body">
                <div className="rule-row__title">{rule.title}</div>
                {rule.description && (
                  <div className="rule-row__desc">{rule.description}</div>
                )}
              </div>
              <span className="rule-level-badge" style={badgeStyle}>{rule.level}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
