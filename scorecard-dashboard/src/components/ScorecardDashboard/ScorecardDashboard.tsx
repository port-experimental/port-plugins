import React, { useState, useMemo } from 'react';
import './ScorecardDashboard.css';
import { usePortPluginData } from '@port-labs/plugins-sdk/react';
import { useScorecardData, getGrade, ScorecardStat, LeaderRow, ServiceSummary, GradeThresholds, DEFAULT_THRESHOLDS } from './useScorecardData';
import type { Params } from '../../types';

// ── Blueprint param helper (mirrors EntityCatalogue pattern) ──────────────

function getBlueprintId(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'object' && value !== null) {
    const id = (value as Record<string, unknown>).identifier;
    if (typeof id === 'string' && id.trim()) return id.trim();
  }
  return null;
}

// ── Grade helpers ──────────────────────────────────────────────────────────

type Grade = 'A' | 'B' | 'C' | 'F';

function gradeModifier(grade: string): string {
  const g = grade as Grade;
  return ['A', 'B', 'C', 'F'].includes(g) ? g.toLowerCase() : 'na';
}

function fmt(n: number, d = 1): string {
  return n.toFixed(d);
}

// ── Circular progress ring ─────────────────────────────────────────────────

function RingChart({ pct, gradeClass, size = 80 }: { pct: number; gradeClass: string; size?: number }) {
  const strokeW = 5.5;
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(Math.max(pct, 0), 100) / 100) * circ;
  const c = size / 2;

  // Use CSS custom property for the stroke colour so it adapts to dark/light
  const strokeColor = `var(--sc-grade-${gradeClass}-text)`;
  const trackColor  = 'var(--sc-border)';

  return (
    <svg width={size} height={size} style={{ display: 'block', overflow: 'visible' }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke={trackColor} strokeWidth={strokeW} />
      <circle
        cx={c} cy={c} r={r}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeW}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform={`rotate(-90 ${c} ${c})`}
        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
      />
    </svg>
  );
}

// ── Grade badge ────────────────────────────────────────────────────────────

function GradeBadge({ grade, pct, hasData = true }: { grade: string; pct: number; hasData?: boolean }) {
  if (!hasData) return <span className="sc-badge sc-badge--na">N/A</span>;
  return (
    <span className={`sc-badge sc-badge--${gradeModifier(grade)}`}>
      {grade}&nbsp;{fmt(pct)}%
    </span>
  );
}

// ── KPI card ───────────────────────────────────────────────────────────────

function KpiCard({ label, value, gradeClass }: { label: string; value: string; gradeClass?: string }) {
  return (
    <div className="sc-kpi-card">
      <div className={`sc-kpi-card__value${gradeClass ? ` sc-kpi-card__value--${gradeClass}` : ''}`}>
        {value}
      </div>
      <div className="sc-kpi-card__label">{label}</div>
    </div>
  );
}

// ── Scorecard card ─────────────────────────────────────────────────────────

function ScorecardCard({ stat }: { stat: ScorecardStat }) {
  const gc = gradeModifier(stat.grade);
  return (
    <div className="sc-scorecard-card">
      <div className="sc-scorecard-card__title">{stat.title}</div>
      <div className="sc-scorecard-card__ring">
        <RingChart pct={stat.compliance} gradeClass={gc} size={78} />
        <span className="sc-scorecard-card__pct">{fmt(stat.compliance)}%</span>
      </div>
      <div className="sc-scorecard-card__grade" style={{ color: `var(--sc-grade-${gc}-text)` }}>
        {stat.grade}
      </div>
      <div className="sc-scorecard-card__count">{stat.total.toLocaleString()} entities</div>
      <div className="sc-scorecard-card__pass-fail">
        <span className="sc-scorecard-card__passing">✓ {stat.passing.toLocaleString()} rules</span>
        <span className="sc-scorecard-card__failing">✗ {stat.failing.toLocaleString()} rules</span>
      </div>
    </div>
  );
}

// ── Compliance table ───────────────────────────────────────────────────────

type SortKey = 'leader' | 'total' | 'overall' | string;

function DrillDown({ services, scorecardStats, appBaseUrl }: { services: ServiceSummary[]; scorecardStats: ScorecardStat[]; appBaseUrl: string }) {
  if (services.length === 0) return <div className="sc-drill-empty">No resources found.</div>;
  return (
    <div className="sc-drill-wrap">
      <table className="sc-drill-table">
        <thead>
          <tr>
            <th>Resource</th>
            <th>Overall</th>
            {scorecardStats.map(sc => <th key={sc.identifier}>{sc.title}</th>)}
          </tr>
        </thead>
        <tbody>
          {services.map(svc => {
            const entityUrl = `${appBaseUrl}/${svc.blueprint}Entity?identifier=${svc.identifier}`;
            return (
            <tr key={svc.identifier}>
              <td className="sc-drill-name">
                <a className="sc-drill-title" href={entityUrl} target="_blank" rel="noopener noreferrer">{svc.title}</a>
                <span className="sc-drill-bp">{svc.blueprint}</span>
              </td>
              <td><GradeBadge grade={svc.overallGrade} pct={svc.overallCompliance} /></td>
              {scorecardStats.map(sc => {
                const cell = svc.scorecards[sc.identifier];
                return (
                  <td key={sc.identifier}>
                    <GradeBadge grade={cell?.grade ?? 'F'} pct={cell?.compliance ?? 0} hasData={cell?.hasData} />
                  </td>
                );
              })}
            </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ComplianceTable({ leaderRows, scorecardStats, appBaseUrl }: { leaderRows: LeaderRow[]; scorecardStats: ScorecardStat[]; appBaseUrl: string }) {
  const [sortKey, setSortKey] = useState<SortKey>('leader');
  const [sortAsc, setSortAsc] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  function toggleExpand(leaderId: string) {
    setExpanded(prev => prev === leaderId ? null : leaderId);
  }

  const sorted = useMemo(() => {
    return [...leaderRows].sort((a, b) => {
      let diff = 0;
      if (sortKey === 'leader') diff = a.leaderTitle.localeCompare(b.leaderTitle);
      else if (sortKey === 'total') diff = a.totalServices - b.totalServices;
      else if (sortKey === 'overall') diff = a.overallCompliance - b.overallCompliance;
      else {
        const ac = a.scorecards[sortKey];
        const bc = b.scorecards[sortKey];
        diff = (ac?.hasData ? ac.compliance : -1) - (bc?.hasData ? bc.compliance : -1);
      }
      return sortAsc ? diff : -diff;
    });
  }, [leaderRows, sortKey, sortAsc]);

  function Th({ k, label, extra }: { k: SortKey; label: string; extra?: string }) {
    const active = sortKey === k;
    const icon = active ? (sortAsc ? '↑' : '↓') : '↕';
    return (
      <th
        className={`${extra ?? ''}${active ? ' sc-th--sorted' : ''}`}
        onClick={() => handleSort(k)}
      >
        <i className="sc-th__icon">{icon}</i>{label}
      </th>
    );
  }

  const colSpan = 3 + scorecardStats.length;

  if (sorted.length === 0) {
    return (
      <div className="sc-empty">
        <div className="sc-empty__icon">📋</div>
        <div>No org leader data found.</div>
        <div style={{ fontSize: '11px', color: 'var(--sc-text-faint)' }}>
          Check that the team blueprint and relation params are configured correctly.
        </div>
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <table className="sc-compliance-table">
        <thead>
          <tr>
            <Th k="leader" label="Org Leader" />
            <Th k="total" label="Services" extra="sc-th--num" />
            <Th k="overall" label="Overall Grade" />
            {scorecardStats.map(sc => (
              <Th key={sc.identifier} k={sc.identifier} label={sc.title} />
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(row => {
            const isExpanded = expanded === row.leaderId;
            return (
              <React.Fragment key={row.leaderId}>
                <tr className={`sc-leader-row${isExpanded ? ' sc-leader-row--expanded' : ''}`}>
                  <td className="sc-td__leader" onClick={() => toggleExpand(row.leaderId)}>
                    <span className="sc-expand-icon">{isExpanded ? '▾' : '▸'}</span>
                    {row.leaderTitle}
                  </td>
                  <td className="sc-td--num sc-td--clickable" onClick={() => toggleExpand(row.leaderId)}>
                    {row.totalServices.toLocaleString()}
                  </td>
                  <td><GradeBadge grade={row.overallGrade} pct={row.overallCompliance} /></td>
                  {scorecardStats.map(sc => {
                    const cell = row.scorecards[sc.identifier];
                    return (
                      <td key={sc.identifier}>
                        <GradeBadge grade={cell?.grade ?? 'F'} pct={cell?.compliance ?? 0} hasData={cell?.hasData} />
                      </td>
                    );
                  })}
                </tr>
                {isExpanded && (
                  <tr className="sc-drill-row">
                    <td colSpan={colSpan} className="sc-drill-cell">
                      <DrillDown services={row.services} scorecardStats={scorecardStats} appBaseUrl={appBaseUrl} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Loading shimmer ────────────────────────────────────────────────────────

function LoadingShimmer({ cards }: { cards: number }) {
  return (
    <>
      <div className="sc-loading-kpis">
        {[0, 1, 2, 3].map(i => <div key={i} className="sc-shimmer sc-loading-kpi" />)}
      </div>
      <div className="sc-loading-cards">
        {Array.from({ length: cards }, (_, i) => (
          <div key={i} className="sc-shimmer sc-loading-card" />
        ))}
      </div>
      <div className="sc-loading-table">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="sc-shimmer sc-loading-table-row" />
        ))}
      </div>
    </>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

export function ScorecardDashboard() {
  const { portToken, portApiBaseUrl, params, theme } = usePortPluginData();
  const p = params as Params;

  function str(key: string, def: string): string {
    const v = p?.[key]?.value;
    return typeof v === 'string' && v.trim() ? v.trim() : def;
  }

  const serviceBlueprints: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const id = getBlueprintId(p[`blueprint${i}`]?.value);
    if (id) serviceBlueprints.push(id);
  }
  const teamBlueprint        = str('teamBlueprint',        '_team');
  const teamServicesRelation = str('teamServicesRelation', '');
  const teamManagerRelation  = str('teamManagerRelation',  'manager');
  const serviceTeamRelation  = str('serviceTeamRelation',  '');
  const dashboardTitle       = str('dashboardTitle',       'Scorecard Compliance Dashboard');

  function num(key: string, def: number): number {
    const v = p?.[key]?.value;
    const n = typeof v === 'string' ? parseFloat(v) : typeof v === 'number' ? v : NaN;
    return isNaN(n) ? def : n;
  }
  const thresholds: GradeThresholds = {
    a: num('gradeA', DEFAULT_THRESHOLDS.a),
    b: num('gradeB', DEFAULT_THRESHOLDS.b),
    c: num('gradeC', DEFAULT_THRESHOLDS.c),
  };

  const aggregateSimilarRaw = p?.['aggregateSimilar']?.value;
  const aggregateSimilar = aggregateSimilarRaw === true || aggregateSimilarRaw === 'true';
  const scorecardIdsRaw      = str('scorecardIds',         '');

  const filterScorecardIds = scorecardIdsRaw
    ? scorecardIdsRaw.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const appBaseUrl = portApiBaseUrl
    ? portApiBaseUrl.replace('//api.', '//app.')
    : 'https://app.getport.io';

  const { data, isLoading, error, refetch } = useScorecardData(
    portToken, portApiBaseUrl ?? '', serviceBlueprints, teamBlueprint,
    teamServicesRelation, teamManagerRelation, serviceTeamRelation,
    filterScorecardIds, thresholds, aggregateSimilar,
  );

  const [selectedLeader, setSelectedLeader] = useState('all');

  const filteredRows = useMemo(
    () => selectedLeader === 'all'
      ? (data?.leaderRows ?? [])
      : (data?.leaderRows ?? []).filter(r => r.leaderId === selectedLeader),
    [data?.leaderRows, selectedLeader],
  );

  const overallGc = data ? gradeModifier(data.overallGrade) : 'na';

  return (
    <div className="sc-dashboard" data-theme={theme?.mode}>

      {/* Header */}
      <div className="sc-header">
        <div className="sc-header__title">{dashboardTitle}</div>
        <div className="sc-header__subtitle">
          Scorecard compliance for <strong>{serviceBlueprints.join(', ')}</strong>
          {' · '}grouped by <strong>{teamManagerRelation}</strong> via <strong>{teamBlueprint}</strong>
          {serviceTeamRelation && <span> (reverse: <strong>{serviceTeamRelation}</strong>)</span>}
        </div>
      </div>

      {/* Grade legend */}
      <div className="sc-legend">
        <span className="sc-legend__label">Grades:</span>
        <span className="sc-legend__item"><span className="sc-legend__dot sc-legend__dot--a" />A ≥ {thresholds.a}%</span>
        <span className="sc-legend__item"><span className="sc-legend__dot sc-legend__dot--b" />B ≥ {thresholds.b}%</span>
        <span className="sc-legend__item"><span className="sc-legend__dot sc-legend__dot--c" />C ≥ {thresholds.c}%</span>
        <span className="sc-legend__item"><span className="sc-legend__dot sc-legend__dot--f" />F &lt; {thresholds.c}%</span>
      </div>

      {/* Error banner */}
      {error && (
        <div className="sc-error-banner">
          <span>⚠️</span>
          <span className="sc-error-banner__msg">{(error as Error).message}</span>
          <button className="sc-error-banner__retry" type="button" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {isLoading && <LoadingShimmer cards={filterScorecardIds.length || 4} />}

      {/* Dashboard content */}
      {data && (
        <>
          {/* KPI summary row */}
          <div className="sc-kpi-row">
            <KpiCard label="Overall Grade"      value={data.overallGrade}                    gradeClass={overallGc} />
            <KpiCard label="Overall Compliance" value={`${fmt(data.overallCompliance)}%`}    gradeClass={gradeModifier(getGrade(data.overallCompliance))} />
            <KpiCard label="Total Services"     value={data.totalServices.toLocaleString()} />
            <KpiCard label="Failed Services"    value={data.failedServices.toLocaleString()} gradeClass={data.failedServices > 0 ? 'f' : undefined} />
          </div>

          {/* Per-scorecard cards */}
          {data.scorecardStats.length > 0 && (
            <div className="sc-scorecards-grid">
              {data.scorecardStats.map(sc => (
                <ScorecardCard key={sc.identifier} stat={sc} />
              ))}
            </div>
          )}

          {/* Compliance by org leader */}
          <div className="sc-table-section">
            <div className="sc-table-header">
              <div className="sc-table-header__title">Compliance by Org Leader</div>
              <div className="sc-table-header__filters">
                <span className="sc-filter__label">Org Leader:</span>
                <select
                  className="sc-filter__select"
                  value={selectedLeader}
                  onChange={e => setSelectedLeader(e.target.value)}
                >
                  <option value="all">All Org Leaders</option>
                  {data.leaderRows.map(r => (
                    <option key={r.leaderId} value={r.leaderId}>{r.leaderTitle}</option>
                  ))}
                </select>
              </div>
            </div>
            <ComplianceTable leaderRows={filteredRows} scorecardStats={data.scorecardStats} appBaseUrl={appBaseUrl} />
          </div>
        </>
      )}
    </div>
  );
}
