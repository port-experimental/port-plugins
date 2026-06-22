import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePluginData } from "./hooks/usePluginData";
import { fetchAll } from "./api";
import { Cube } from "./components/Cube";
import { DetailPanel } from "./components/DetailPanel";
import { hexToRgba } from "./constants";
import type { ScorecardLevel } from "./types";
import "./App.css";

export default function App() {
  const { config, portToken, portApiBaseUrl } = usePluginData();
  const [filter, setFilter] = useState<string>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [errorCollapsed, setErrorCollapsed] = useState(false);

  // All hooks must be called unconditionally — early return happens after this block.
  const { data, isLoading, error, dataUpdatedAt } = useQuery({
    queryKey: [
      "sg",
      portToken,
      portApiBaseUrl,
      config?.blueprintIdentifier,
      config?.scorecardIdentifier,
    ],
    queryFn: () => fetchAll(portApiBaseUrl!, portToken!, config!),
    enabled: !!config && !!portToken && !!portApiBaseUrl,
    refetchInterval: (config?.pollIntervalSeconds ?? 60) * 1000,
    staleTime: ((config?.pollIntervalSeconds ?? 60) * 1000) / 2,
  });

  const rules = data?.rules ?? [];
  const entities = data?.entities ?? [];
  const levels: ScorecardLevel[] = data?.levels ?? [];

  const errorMessage = error ? String(error) : null;
  useEffect(() => {
    if (errorMessage) setErrorCollapsed(false);
  }, [errorMessage]);

  const levelMap = useMemo(
    () => new Map(levels.map((l) => [l.title, l])),
    [levels]
  );
  const levelTitles = useMemo(() => levels.map((l) => l.title), [levels]);

  const displayed =
    filter === "All" ? entities : entities.filter((e) => e.level === filter);

  const counts: Record<string, number> = useMemo(
    () =>
      Object.fromEntries(
        levelTitles.map((lt) => [
          lt,
          entities.filter((e) => e.level === lt).length,
        ])
      ),
    [entities, levelTitles]
  );

  const totals = useMemo(
    () =>
      (config?.counters ?? []).map((c, i) => ({
        emoji: c.emoji,
        label: c.label,
        total: entities.reduce((s, e) => s + (e.counters[i]?.value ?? 0), 0),
      })),
    [entities, config?.counters]
  );

  if (!config) {
    return (
      <div className="app">
        <div className="empty-state">
          The widget configuration is incomplete or incorrect. Please check that
          all necessary parameters are set in the Port widget settings.
        </div>
      </div>
    );
  }

  const selected = selectedId
    ? entities.find((e) => e.id === selectedId) ?? null
    : null;
  const selectedLevel = selected
    ? levelMap.get(selected.level) ?? levels[0] ?? null
    : null;
  const lastSynced = dataUpdatedAt ? new Date(dataUpdatedAt) : null;

  return (
    <div className="app">
      {/* Nav */}
      <nav className="nav">
        <div className="nav__logo">⬡</div>
        <span className="nav__title">Scorecard Grid</span>
        <div className="nav__status">
          {isLoading ? (
            <div className="spinner" />
          ) : (
            <>
              <div className="nav__dot" />
              <span className="nav__sync-time">
                {lastSynced ? `synced ${lastSynced.toLocaleTimeString()}` : "—"}
              </span>
            </>
          )}
          <span className="nav__poll-badge">
            {config.pollIntervalSeconds}s poll
          </span>
        </div>
      </nav>

      {/* Summary bar */}
      <div className="summary-bar">
        <div className="summary-bar__totals">
          {totals.map((t) => (
            <div key={t.label} className="total-stat">
              <span className="total-stat__val">
                {isLoading ? "—" : t.total}
              </span>
              <span className="total-stat__label">
                {t.emoji} {t.label}
              </span>
            </div>
          ))}
        </div>

        <div className="summary-bar__filters">
          <button
            className={`filter-btn${
              filter === "All" ? " filter-btn--active" : ""
            }`}
            onClick={() => setFilter("All")}
          >
            All
            <span className="filter-btn__count">{entities.length}</span>
          </button>

          {levels.map((lvl) => {
            const isActive = filter === lvl.title;
            const style: React.CSSProperties = {
              "--lvl-color": lvl.hex,
              "--lvl-border": hexToRgba(lvl.hex, 0.3),
              "--lvl-bg": hexToRgba(lvl.hex, 0.08),
              "--lvl-badge-bg": hexToRgba(lvl.hex, 0.2),
            } as React.CSSProperties;
            return (
              <button
                key={lvl.title}
                className={`filter-btn filter-btn--lvl${
                  isActive ? " filter-btn--active" : ""
                }`}
                style={style}
                onClick={() => setFilter(lvl.title)}
              >
                <span className="filter-btn__dot" />
                {lvl.title}
                <span className="filter-btn__count">
                  {counts[lvl.title] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Body */}
      <div className="body">
        <main className="main">
          {isLoading && (
            <div className="loading-state">
              <div className="spinner spinner--lg" />
              <p className="loading-state__text">
                Fetching live data from Port…
              </p>
            </div>
          )}

          {!isLoading &&
            errorMessage &&
            (errorCollapsed ? (
              <button
                type="button"
                className="error-pill"
                onClick={() => setErrorCollapsed(false)}
                aria-label="Show error details"
              >
                <span className="error-pill__dot" />
                Error — show details
              </button>
            ) : (
              <div className="error-banner" role="alert">
                <span className="error-banner__icon">⚠</span>
                <div className="error-banner__body">{errorMessage}</div>
                <button
                  type="button"
                  className="error-banner__toggle"
                  onClick={() => setErrorCollapsed(true)}
                  aria-label="Hide error details"
                >
                  Hide
                </button>
              </div>
            ))}

          {!isLoading && !error && entities.length === 0 && (
            <p className="empty-state">No entities found</p>
          )}

          {!isLoading &&
            !error &&
            levels
              .filter((lvl) => filter === "All" || filter === lvl.title)
              .map((lvl) => {
                const group = displayed.filter((e) => e.level === lvl.title);
                if (!group.length) return null;

                const sectionStyle: React.CSSProperties = {
                  "--lvl-color": lvl.hex,
                  "--lvl-border": hexToRgba(lvl.hex, 0.2),
                  "--lvl-bg": hexToRgba(lvl.hex, 0.04),
                } as React.CSSProperties;

                return (
                  <section
                    key={lvl.title}
                    className="level-section"
                    style={sectionStyle}
                  >
                    <div className="level-section__header">
                      <div className="level-section__dot" />
                      <span className="level-section__name">{lvl.title}</span>
                      <span className="level-section__sep">·</span>
                      <span className="level-section__count">
                        {group.length}{" "}
                        {group.length === 1 ? "entity" : "entities"}
                      </span>
                    </div>

                    <div className="cube-grid">
                      {group.map((item) => (
                        <Cube
                          key={item.id}
                          item={item}
                          level={lvl}
                          selected={selectedId === item.id}
                          onClick={() =>
                            setSelectedId((prev) =>
                              prev === item.id ? null : item.id
                            )
                          }
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
        </main>

        {selected && selectedLevel && (
          <aside
            className="detail-aside"
            style={
              {
                "--lvl-color": selectedLevel.hex,
                "--lvl-border": hexToRgba(selectedLevel.hex, 0.25),
              } as React.CSSProperties
            }
          >
            <DetailPanel
              key={selected.id}
              item={selected}
              level={selectedLevel}
              levelMap={levelMap}
              rules={rules}
              baseUrl={portApiBaseUrl ?? null}
              token={portToken ?? null}
              config={config}
              onClose={() => setSelectedId(null)}
            />
          </aside>
        )}
      </div>
    </div>
  );
}
