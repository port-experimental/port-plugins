import React from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchDrillDownItems } from "../api";
import type { DrillDownConfig } from "../types";
interface Props {
  entityId: string;
  mainBlueprint: string;
  drillConfig: DrillDownConfig;
  baseUrl: string;
  token: string;
  pollIntervalSeconds: number;
}

export function DrillDown({
  entityId,
  mainBlueprint,
  drillConfig,
  baseUrl,
  token,
  pollIntervalSeconds,
}: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: [
      "drilldown",
      entityId,
      mainBlueprint,
      drillConfig.blueprint,
      baseUrl,
      JSON.stringify(drillConfig.query),
    ],
    queryFn: () =>
      fetchDrillDownItems(baseUrl, token, entityId, mainBlueprint, drillConfig),
    staleTime: pollIntervalSeconds * 1000,
  });

  const items = data ?? [];

  return (
    <div className="drilldown">
      <div className="drilldown__header">{drillConfig.label}</div>

      {isLoading && (
        <div className="drilldown__spinner-wrap">
          <div className="spinner" />
        </div>
      )}
      {!isLoading && error && (
        <p className="drilldown__empty drilldown__empty--error">
          Failed to load
        </p>
      )}
      {!isLoading && !error && items.length === 0 && (
        <p className="drilldown__empty">No items found</p>
      )}

      {items.map((item) => (
        <div key={item.id} className="drilldown__item">
          <div className="drilldown__item-body" data-tooltip={item.title}>
            <div className="drilldown__item-title">{item.title}</div>
            {Object.keys(item.properties).length > 0 && (
              <div className="drilldown__item-props">
                {Object.entries(item.properties).map(([key, val]) => (
                  <span key={key} className="drilldown__prop">
                    <span className="drilldown__prop-key">{key}:</span>{" "}
                    <span className="drilldown__prop-val">
                      {String(val ?? "—")}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <button
            className="drilldown__link-btn"
            onClick={() =>
              window.parent.postMessage(
                { type: "OPEN_URL", data: { url: item.url } },
                "*"
              )
            }
            aria-label="Open in Port"
          >
            ↗
          </button>
        </div>
      ))}
    </div>
  );
}
