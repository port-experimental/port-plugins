import './App.css';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { usePortPluginData } from '@port-labs/plugins-sdk/react';
import { Radar } from './components/Radar';
import { Legend } from './components/Legend';
import { fetchEntitiesByBlueprint } from './api';
import { entitiesToBlips } from './utils/radar';
import { RING_COLORS, QUAD_COLORS } from './types';
import type { Blip, Ring, Quadrant } from './types';

export function App() {
  const { portApiBaseUrl, portToken, params, applyThemeCss } = usePortPluginData();
  useEffect(() => { applyThemeCss?.(); }, [applyThemeCss]);

  const blueprintId = (params?.blueprint?.value as string | undefined) || 'software';

  const [blips,           setBlips]           = useState<Blip[]>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);
  const [activeRing,      setActiveRing]      = useState<Ring | null>(null);
  const [activeQuadrant,  setActiveQuadrant]  = useState<Quadrant | null>(null);
  const [selectedBlip,    setSelectedBlip]    = useState<string | null>(null);
  const [search,          setSearch]          = useState('');
  const [legendOpen,      setLegendOpen]      = useState(true);

  const isReady = !!portToken && !!portApiBaseUrl;

  useEffect(() => {
    if (!isReady) return;
    setLoading(true);
    fetchEntitiesByBlueprint(portApiBaseUrl, portToken, blueprintId)
      .then(entities => setBlips(entitiesToBlips(entities)))
      .catch(e => setError(String(e)))
      .finally(() => setLoading(false));
  }, [isReady, portApiBaseUrl, portToken, blueprintId]);

  // Filter blips by search
  const visibleBlips = useMemo(() => {
    if (!search.trim()) return blips;
    const q = search.toLowerCase();
    return blips.filter(b =>
      b.name.toLowerCase().includes(q) ||
      b.quadrant.toLowerCase().includes(q) ||
      b.ring.toLowerCase().includes(q) ||
      b.description.toLowerCase().includes(q),
    );
  }, [blips, search]);

  const selectedBlipData = useMemo(
    () => blips.find(b => b.id === selectedBlip) ?? null,
    [blips, selectedBlip],
  );

  const handleBlipClick = useCallback((id: string) => {
    setSelectedBlip(prev => prev === id ? null : id);
  }, []);

  const handleBlipHover = useCallback((_id: string | null, _x: number, _y: number) => {}, []);

  if (!isReady) return (
    <div className="loading"><div className="spinner" /><span>Connecting to Port…</span></div>
  );
  if (loading) return (
    <div className="loading"><div className="spinner" /><span>Loading tech radar…</span></div>
  );
  if (error) return (
    <div className="empty-state"><span>⚠ {error}</span></div>
  );
  if (blips.length === 0) return (
    <div className="empty-state"><span>No entities found. Add items to the <strong>{blueprintId}</strong> blueprint.</span></div>
  );

  return (
    <div className="app">
      {/* Header */}
      <div className="app-header">
        <div className="app-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
          </svg>
          Tech Radar
          <span className="app-subtitle">AI &amp; Developer Tools · {blips.length} items</span>
        </div>
        <input
          className="header-search"
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Body */}
      <div className="app-body">
        {/* Radar */}
        <div className="radar-panel">
          <Radar
            blips={visibleBlips}
            activeRing={activeRing}
            activeQuadrant={activeQuadrant}
            selectedBlip={selectedBlip}
            onBlipHover={handleBlipHover}
            onBlipClick={handleBlipClick}
          />
        </div>

        {/* Legend (collapsible) */}
        <div className={`legend-outer${legendOpen ? '' : ' collapsed'}`} style={{ width: legendOpen ? 260 : 0 }}>
          <button
            className="legend-toggle"
            title={legendOpen ? 'Collapse legend' : 'Expand legend'}
            onClick={() => setLegendOpen(o => !o)}
          >
            {legendOpen ? '›' : '‹'}
          </button>
          {legendOpen && (
            <Legend
              blips={visibleBlips}
              activeQuadrant={activeQuadrant}
              activeRing={activeRing}
              selectedBlip={selectedBlip}
              onQuadrantHover={setActiveQuadrant}
              onRingHover={setActiveRing}
              onBlipClick={handleBlipClick}
            />
          )}
        </div>

        {/* Detail panel for selected blip */}
        {selectedBlipData && (
          <div className="detail-panel">
            <button className="detail-close" onClick={() => setSelectedBlip(null)}>×</button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{
                width: 28, height: 28, borderRadius: '50%',
                background: QUAD_COLORS[selectedBlipData.quadrant],
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: 'white',
              }}>{selectedBlipData.label}</span>
              <h3 style={{ margin: 0 }}>{selectedBlipData.name}</h3>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 11, fontWeight: 600, borderRadius: 20,
                padding: '2px 10px', border: `1px solid ${RING_COLORS[selectedBlipData.ring]}`,
                color: RING_COLORS[selectedBlipData.ring],
              }}>{selectedBlipData.ring}</span>
              <span style={{
                fontSize: 11, fontWeight: 600, borderRadius: 20,
                padding: '2px 10px', border: `1px solid ${QUAD_COLORS[selectedBlipData.quadrant]}`,
                color: QUAD_COLORS[selectedBlipData.quadrant],
              }}>{selectedBlipData.quadrant}</span>
            </div>
            {selectedBlipData.description && (
              <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-medium,#adbac7)' }}>
                {selectedBlipData.description}
              </p>
            )}
            {selectedBlipData.url && (
              <a
                href={selectedBlipData.url}
                target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 10, fontSize: 12, color: 'var(--color-primary,#58a6ff)' }}
              >
                Learn more ↗
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
