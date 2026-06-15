import React, { useEffect, useMemo, useState } from "react";
import { usePostMessageData } from "./hooks/usePostMessageData";
import { DEV_MOCK } from "./hooks/usePostMessageData";
import { fetchEntities } from "./api/entities";
import { MOCK_ENTITIES } from "./dev/mockData";
import {
  parseDims,
  parseBlueprint,
  parseGroupRelation,
  num,
  scoreCls,
  barCls,
  scoreLabel,
} from "./utils/config";
import type { NormalisedEntity, DimConfig, PortEntity } from "./types";

/* ── Score ring ── */
function ScoreRing({ value, size = 72 }: { value: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const colors: Record<string, string> = {
    great: "#16a34a",
    good: "#2563eb",
    ok: "#d97706",
    poor: "#dc2626",
  };
  const cls = scoreCls(value);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(0,0,0,.06)"
        strokeWidth="7"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={colors[cls]}
        strokeWidth="7"
        strokeDasharray={`${(circ * value) / 100} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="16"
        fontWeight="700"
        fill={colors[cls]}
      >
        {value}
      </text>
    </svg>
  );
}

/* ── Mini bar ── */
function MiniBar({ val, width = 100 }: { val: number; width?: number }) {
  return (
    <div className="mini-bar-track" style={{ width }}>
      <div
        className={`mini-bar-fill ${barCls(val)}`}
        style={{ width: `${val}%` }}
      />
    </div>
  );
}

/* ── Dim cell for table ── */
function DimCell({ val }: { val: number }) {
  return (
    <div className="dim-cell">
      <MiniBar val={val} width={52} />
      <span className={`score-chip-sm ${scoreCls(val)}`}>{val}</span>
    </div>
  );
}

/* ── Spinner ── */
function Spinner({ msg }: { msg: string }) {
  return (
    <div className="state-panel">
      <svg
        className="spinner"
        width="22"
        height="22"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeDasharray="50"
          strokeDashoffset="15"
        />
      </svg>
      <span>{msg}</span>
    </div>
  );
}

type View = "overview" | "entity";
type SortKey = "score_asc" | "score_desc" | "name_asc";
const PAGE_SIZE = 15;

function normalise(
  e: PortEntity,
  dims: DimConfig[],
  groupRelation: string
): NormalisedEntity {
  const dimScores: Record<string, number> = {};
  for (const d of dims) {
    dimScores[d.key] = num(e.properties[d.property]);
  }
  const overall =
    dims.length > 0
      ? Math.round(
          Object.values(dimScores).reduce((a, b) => a + b, 0) / dims.length
        )
      : 0;
  const group =
    groupRelation && typeof e.relations[groupRelation] === "string"
      ? (e.relations[groupRelation] as string)
      : null;
  return { id: e.identifier, title: e.title || e.identifier, group, dims: dimScores, overall };
}

export default function App() {
  const { params, portToken, portApiBaseUrl } = usePostMessageData();
  const [entities, setEntities] = useState<NormalisedEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<View>("overview");
  const [selected, setSelected] = useState<NormalisedEntity | null>(null);
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("score_asc");
  const [page, setPage] = useState(1);

  const dims = useMemo(() => parseDims(params), [params]);
  const blueprint = useMemo(() => parseBlueprint(params), [params]);
  const groupRelation = useMemo(() => parseGroupRelation(params), [params]);

  useEffect(() => {
    if (!portToken || !portApiBaseUrl || !blueprint) return;
    const load = DEV_MOCK
      ? Promise.resolve(MOCK_ENTITIES)
      : fetchEntities(portApiBaseUrl, portToken, blueprint);
    load
      .then((raw) => {
        setEntities(raw.map((e) => normalise(e, dims, groupRelation)));
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [portToken, portApiBaseUrl, blueprint, dims, groupRelation]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return entities.filter(
      (e) =>
        !q ||
        e.title.toLowerCase().includes(q) ||
        (e.group ?? "").toLowerCase().includes(q)
    );
  }, [entities, query]);

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (sortKey === "score_desc") return b.overall - a.overall;
        if (sortKey === "name_asc") return a.title.localeCompare(b.title);
        return a.overall - b.overall;
      }),
    [filtered, sortKey]
  );

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const avg =
    entities.length
      ? Math.round(entities.reduce((s, x) => s + x.overall, 0) / entities.length)
      : 0;

  const dimAvgs = dims.map((d) => ({
    ...d,
    avg: entities.length
      ? Math.round(
          entities.reduce((s, x) => s + (x.dims[d.key] ?? 0), 0) /
            entities.length
        )
      : 0,
  }));

  if (!portToken || !portApiBaseUrl)
    return <Spinner msg="Connecting to Port…" />;
  if (!blueprint)
    return (
      <div className="state-panel state-error">
        Configure the Blueprint parameter in widget settings.
      </div>
    );
  if (dims.length === 0)
    return (
      <div className="state-panel state-error">
        Configure at least one dimension label and property in widget settings.
      </div>
    );
  if (loading) return <Spinner msg="Loading…" />;
  if (error)
    return (
      <div className="state-panel state-error">Failed to load: {error}</div>
    );

  /* ── Entity detail ── */
  if (view === "entity" && selected) {
    const s = selected;
    return (
      <div className="page">
        <button className="back-btn" onClick={() => setView("overview")}>
          ← Back to overview
        </button>
        <div className="entity-header">
          <div>
            <div className="entity-detail-title">{s.title}</div>
            {s.group && (
              <div className="entity-detail-group">{s.group}</div>
            )}
          </div>
          <ScoreRing value={s.overall} size={80} />
        </div>

        <div className="dim-strip">
          {dims.map((d) => {
            const val = s.dims[d.key] ?? 0;
            return (
              <div key={d.key} className="dim-card">
                <div className="dim-top">
                  <span className="dim-label">{d.label}</span>
                  <span className={`dim-score ${scoreCls(val)}`}>{val}</span>
                </div>
                <div className="dim-bar-track">
                  <div
                    className={`dim-bar-fill ${barCls(val)}`}
                    style={{ width: `${val}%` }}
                  />
                </div>
                <div className="dim-sublabel">{scoreLabel(val)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  /* ── Overview ── */
  return (
    <div className="page">
      {/* Hero */}
      <div className="hero-card">
        <div className="hero-left">
          <ScoreRing value={avg} size={88} />
          <div className="hero-text">
            <div className="hero-title">Avg quality score</div>
            <div className="hero-counts">
              <span className="hc great">
                {entities.filter((e) => e.overall >= 80).length} great
              </span>
              <span className="hc-sep">·</span>
              <span className="hc good">
                {
                  entities.filter((e) => e.overall >= 60 && e.overall < 80)
                    .length
                }{" "}
                good
              </span>
              <span className="hc-sep">·</span>
              <span className="hc ok">
                {
                  entities.filter((e) => e.overall >= 40 && e.overall < 60)
                    .length
                }{" "}
                needs work
              </span>
              <span className="hc-sep">·</span>
              <span className="hc poor">
                {entities.filter((e) => e.overall < 40).length} poor
              </span>
            </div>
          </div>
        </div>
        <div className="hero-dims">
          {dimAvgs.map((d) => (
            <div key={d.key} className="hero-dim">
              <div className="hero-dim-top">
                <span className="hero-dim-label">{d.label}</span>
                <span className={`hero-dim-score ${scoreCls(d.avg)}`}>
                  {d.avg}
                </span>
              </div>
              <div className="mini-bar-track">
                <div
                  className={`mini-bar-fill ${barCls(d.avg)}`}
                  style={{ width: `${d.avg}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="section-block">
        <div className="section-title">All {blueprint} entities</div>
        <div className="filter-bar">
          <div className="search-wrap">
            <svg
              className="search-icon"
              width="14"
              height="14"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                cx="11"
                cy="11"
                r="8"
                stroke="currentColor"
                strokeWidth="2"
              />
              <path
                d="M21 21l-4.35-4.35"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
            <input
              className="search-input"
              placeholder={`Search ${blueprint}…`}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="sort-wrap">
            <select
              className="sort-select"
              value={sortKey}
              onChange={(e) => {
                setSortKey(e.target.value as SortKey);
                setPage(1);
              }}
            >
              <option value="score_asc">Score: lowest first</option>
              <option value="score_desc">Score: highest first</option>
              <option value="name_asc">Name A–Z</option>
            </select>
          </div>
          <span className="result-count">
            {sorted.length} entit{sorted.length !== 1 ? "ies" : "y"}
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th
                  className="sortable-th"
                  onClick={() => {
                    setSortKey("name_asc");
                    setPage(1);
                  }}
                >
                  Entity
                </th>
                <th
                  className="sortable-th"
                  onClick={() => {
                    setSortKey(
                      sortKey === "score_asc" ? "score_desc" : "score_asc"
                    );
                    setPage(1);
                  }}
                >
                  Overall{" "}
                  <span className="sort-arrow">
                    {sortKey === "score_desc" ? "↓" : "↑"}
                  </span>
                </th>
                {dims.map((d) => (
                  <th key={d.key}>{d.label}</th>
                ))}
                <th />
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={3 + dims.length} className="empty-cell">
                    No entities match
                  </td>
                </tr>
              ) : (
                paginated.map((e) => (
                  <tr
                    key={e.id}
                    className="entity-row"
                    onClick={() => {
                      setSelected(e);
                      setView("entity");
                    }}
                  >
                    <td>
                      <div className="entity-name">{e.title}</div>
                      {e.group && (
                        <div className="entity-group-tag">{e.group}</div>
                      )}
                    </td>
                    <td>
                      <div className="quality-cell">
                        <MiniBar val={e.overall} width={64} />
                        <span className={`score-chip ${scoreCls(e.overall)}`}>
                          {e.overall}
                        </span>
                      </div>
                    </td>
                    {dims.map((d) => (
                      <td key={d.key}>
                        <DimCell val={e.dims[d.key] ?? 0} />
                      </td>
                    ))}
                    <td className="arrow-cell">›</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="pager">
            <button
              className="pager-btn"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>
            <span className="pager-info">
              Page {page} of {totalPages}
            </span>
            <button
              className="pager-btn"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
