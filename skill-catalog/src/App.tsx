import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import {
  Cog,
  FileText,
  FlaskConical,
  FolderOpen,
  Globe,
  Rocket,
  Search,
  Wrench,
  Package,
  LayoutGrid,
  User,
  Plus,
  Pencil,
  X,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import { usePostMessageData } from './hooks/usePostMessageData';
import { fetchSkillGroups } from './api/skills';
import { configFromParams } from './utils/config';
import { buildEntityPageUrl } from './utils/portalUrl';
import type { Params, PluginConfig, SkillGroupOption } from './types';
import { Modal } from './components/Modal';
import { CreateFlow } from './components/CreateFlow';
import { UpdateFlow } from './components/UpdateFlow';
import './styles.css';
import './form-styles.css';

const queryClient = new QueryClient();

interface SkillProperties {
  description?: string;
  instructions?: string;
  scope?: string;
  location?: string;
  status?: 'draft' | 'active' | 'deprecated';
  category?: string;
  version?: string;
  references?: unknown[];
  assets?: unknown[];
  scripts?: unknown[];
  additional_files?: unknown[];
}

interface SkillEntity {
  identifier: string;
  title: string;
  properties: SkillProperties;
  relations?: { ai_agent?: { identifier: string; title: string } | null; skill_to_skill_group?: string | string[] };
}

type CategoryKey = 'development' | 'documentation' | 'testing' | 'deployment' | 'code-review' | 'configuration' | 'migration' | 'other';

const CATEGORY_ICONS: Record<string, typeof Cog> = {
  development: Cog,
  documentation: FileText,
  testing: FlaskConical,
  deployment: Rocket,
  'code-review': Search,
  configuration: Wrench,
  migration: Package,
  other: LayoutGrid,
};

const SCOPE_ICONS: Record<string, typeof Globe> = {
  global: Globe,
  project: FolderOpen,
  personal: User,
};

const READINESS_RULES: Array<{ label: string; check: (p: SkillProperties) => boolean }> = [
  { label: 'Has description', check: p => !!p.description },
  { label: 'Has instructions', check: p => !!p.instructions },
  { label: 'Has status', check: p => !!p.status },
  { label: 'Has category', check: p => !!p.category },
  { label: 'Has version', check: p => !!p.version },
  { label: 'Has scope', check: p => !!(p.scope || p.location) },
  { label: 'Has references', check: p => (p.references?.length ?? 0) > 0 },
  { label: 'Has scripts', check: p => (p.scripts?.length ?? 0) > 0 },
  { label: 'Has commands', check: p => (p.assets?.length ?? 0) > 0 },
  { label: 'Has additional files', check: p => (p.additional_files?.length ?? 0) > 0 },
];

function computeReadiness(p: SkillProperties): { score: number; passed: number; total: number } {
  const total = READINESS_RULES.length;
  const passed = READINESS_RULES.filter(rule => rule.check(p)).length;
  return { score: Math.round((passed / total) * 100), passed, total };
}

function scoreColor(score: number): string {
  if (score >= 80) return '#22c55e';
  if (score >= 50) return '#eab308';
  return '#94a3b8';
}

function Select({ value, onChange, options, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; icon?: typeof Cog }[];
  placeholder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = options.find(o => o.value === value);

  return (
    <div className={`custom-select ${open ? 'open' : ''}`} ref={ref}>
      <button type="button" className="custom-select-trigger" onClick={() => setOpen(o => !o)}>
        <span>{current?.label ?? placeholder}</span>
        <svg className="select-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div className="custom-select-menu">
          {options.map(o => (
            <button
              key={o.value}
              type="button"
              className={`custom-select-option ${o.value === value ? 'selected' : ''}`}
              onClick={() => { onChange(o.value); setOpen(false); }}
            >
              <span className="select-option-content">
                {o.icon && <o.icon size={13} aria-hidden />}
                {o.label}
              </span>
              {o.value === value && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function HexBadge({ score, passed, total }: { score: number; passed: number; total: number }) {
  const color = scoreColor(score);
  const pts = "18,4 31,11.5 31,26.5 18,34 5,26.5 5,11.5";
  return (
    <svg
      width="36" height="38"
      viewBox="0 0 36 38"
      aria-label={`${passed}/${total} readiness rules passed`}
    >
      <polygon points={pts} fill={color} fillOpacity="0.08" />
      <polygon points={pts} fill="none" stroke={color} strokeWidth="1" strokeOpacity="0.55" />
      <text
        x="18" y="20"
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fillOpacity="0.9"
        fontSize="12"
        fontWeight="600"
        fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
      >{score}</text>
    </svg>
  );
}

function SkillCard({ skill, onEdit }: { skill: SkillEntity; onEdit: () => void }) {
  const p = skill.properties;
  const { score, passed, total } = computeReadiness(p);
  const agent = skill.relations?.ai_agent;
  const scope = p.scope ?? p.location ?? '';
  const category = (p.category ?? 'other') as CategoryKey;
  const scoreCol = scoreColor(score);
  const entityUrl = buildEntityPageUrl('skill', skill.identifier);

  const CategoryIcon = CATEGORY_ICONS[category] ?? LayoutGrid;
  const ScopeIcon = SCOPE_ICONS[scope] ?? null;

  return (
    <div className="skill-card" style={{ '--card-glow': scoreCol } as React.CSSProperties}>
      <div className="card-badge-row">
        <HexBadge score={score} passed={passed} total={total} />
        <button
          type="button"
          className="card-edit-btn"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onEdit(); }}
          aria-label={`Edit ${skill.title}`}
          title="Edit skill"
        >
          <Pencil size={14} aria-hidden />
        </button>
      </div>

      <a className="card-link" href={entityUrl}>
        <div className="card-body">
          <span className="card-path">
            {agent?.title ? `${agent.title} / ` : scope ? `${scope} / ` : ''}
            {category}
          </span>
          <span className="card-title">{skill.title || skill.identifier}</span>
          {p.description && <p className="card-description">{p.description}</p>}
        </div>

        {(p.status || p.version) && (
          <div className="card-meta-row">
            {p.status && (
              <span className={`badge badge-status badge-${p.status}`}>{p.status}</span>
            )}
            {p.version && <span className="badge badge-dim">v{p.version}</span>}
          </div>
        )}
      </a>
    </div>
  );
}

type ModalState =
  | null
  | { type: 'create' }
  | { type: 'update'; skill: SkillEntity };

function CatalogInner() {
  const { params, user, portToken, portApiBaseUrl } = usePostMessageData();
  const config = useMemo(() => configFromParams(params as Params), [params]);

  const [entities, setEntities] = useState<SkillEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [modal, setModal] = useState<ModalState>(null);

  const ctx = useMemo(
    () => ({ baseUrl: portApiBaseUrl ?? '', token: portToken ?? '' }),
    [portApiBaseUrl, portToken]
  );
  const ready = !!portApiBaseUrl && !!portToken;

  const groupsQuery = useQuery({
    queryKey: ['skill-groups', config.skillGroupBlueprint, portToken],
    queryFn: () => fetchSkillGroups(ctx, config),
    enabled: ready,
    staleTime: 5 * 60 * 1000,
  });
  const skillGroups: SkillGroupOption[] = groupsQuery.data ?? [];

  const fetchEntities = useCallback(() => {
    if (!portToken || !portApiBaseUrl) return;
    setLoading(true);
    setError(null);
    fetch(`${portApiBaseUrl}/v1/blueprints/skill/entities`, {
      headers: { Authorization: `Bearer ${portToken}` },
    })
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(d => { setEntities(d.entities ?? []); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, [portToken, portApiBaseUrl]);

  useEffect(() => { fetchEntities(); }, [fetchEntities]);

  const categories = useMemo(() =>
    [...new Set(entities.map(e => e.properties.category ?? 'other'))].sort(), [entities]);

  const scopes = useMemo(() =>
    [...new Set(entities.map(e => (e.properties.scope ?? e.properties.location ?? '')).filter(Boolean))].sort(), [entities]);

  const filtered = useMemo(() => entities.filter(e => {
    const p = e.properties;
    if (catFilter !== 'all' && (p.category ?? 'other') !== catFilter) return false;
    if (scopeFilter !== 'all' && (p.scope ?? p.location ?? '') !== scopeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (e.title ?? '').toLowerCase().includes(q)
        || e.identifier.toLowerCase().includes(q)
        || (p.description ?? '').toLowerCase().includes(q);
    }
    return true;
  }), [entities, search, catFilter, scopeFilter]);

  const groups = useMemo(() => {
    const map: Record<string, SkillEntity[]> = {};
    for (const e of filtered) {
      const cat = e.properties.category ?? 'other';
      if (!map[cat]) map[cat] = [];
      map[cat].push(e);
    }
    return map;
  }, [filtered]);

  const catOptions = useMemo(() => [
    { value: 'all', label: 'All categories' },
    ...categories.map(c => ({
      value: c,
      label: c,
      icon: CATEGORY_ICONS[c] ?? LayoutGrid,
    })),
  ], [categories]);

  const scopeOptions = useMemo(() => [
    { value: 'all', label: 'All scopes' },
    ...scopes.map(s => ({
      value: s,
      label: s,
      icon: SCOPE_ICONS[s] ?? Globe,
    })),
  ], [scopes]);

  const closeModal = useCallback(() => {
    setModal(null);
    fetchEntities();
  }, [fetchEntities]);

  if (loading) {
    return (
      <div className="state-panel">
        <Loader2 size={24} aria-hidden className="spinner" />
        <p>Loading skills…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="state-panel state-error">
        <AlertTriangle size={24} aria-hidden />
        <p>Error: {error}</p>
      </div>
    );
  }

  const createContext = {
    requestType: 'create' as const,
    skillName: '',
    currentFiles: [],
    location: 'project' as const,
  };

  return (
    <div className="catalog">
      <div className="filter-bar">
        <div className="search-wrap">
          <Search size={14} aria-hidden className="search-icon-svg" />
          <input
            className="search-input"
            placeholder="Search skills…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button type="button" className="clear-btn" onClick={() => setSearch('')} aria-label="Clear search">
              <X size={11} aria-hidden />
            </button>
          )}
        </div>

        {categories.length > 1 && (
          <Select value={catFilter} onChange={setCatFilter} options={catOptions} placeholder="All categories" />
        )}
        {scopes.length > 1 && (
          <Select value={scopeFilter} onChange={setScopeFilter} options={scopeOptions} placeholder="All scopes" />
        )}

        <span className="result-count">{filtered.length} skill{filtered.length !== 1 ? 's' : ''}</span>

        <button type="button" className="btn btn-primary create-btn" onClick={() => setModal({ type: 'create' })}>
          <Plus size={15} aria-hidden /> Create Skill
        </button>
      </div>

      {Object.keys(groups).length === 0 ? (
        <div className="state-panel">
          <Search size={28} aria-hidden className="state-icon" />
          <p>No skills match your search</p>
        </div>
      ) : (
        Object.entries(groups).map(([cat, skills]) => {
          const Icon = CATEGORY_ICONS[cat] ?? LayoutGrid;
          return (
            <section key={cat} className="skill-group">
              <h2 className="group-heading">
                <Icon size={14} aria-hidden className="group-icon" />
                {cat}
                <span className="group-count">{skills.length}</span>
              </h2>
              <div className="skill-grid">
                {skills.map(skill => (
                  <SkillCard
                    key={skill.identifier}
                    skill={skill}
                    onEdit={() => setModal({ type: 'update', skill })}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}

      <Modal open={modal?.type === 'create'} onClose={closeModal}>
        <CreateFlow
          baseUrl={ctx.baseUrl}
          token={ctx.token}
          config={config}
          context={createContext}
          skillGroups={skillGroups}
          requesterEmail={user?.email}
          onClose={closeModal}
        />
      </Modal>

      <Modal open={modal?.type === 'update'} onClose={closeModal}>
        {modal?.type === 'update' && (
          <UpdateFlow
            baseUrl={ctx.baseUrl}
            token={ctx.token}
            config={config}
            skill={{
              identifier: modal.skill.identifier,
              title: modal.skill.title,
              location: modal.skill.properties.location,
              groupId: extractFirstGroup(modal.skill.relations?.skill_to_skill_group),
            }}
            skillGroups={skillGroups}
            requesterEmail={user?.email}
            onClose={closeModal}
          />
        )}
      </Modal>
    </div>
  );
}

function extractFirstGroup(val: unknown): string | undefined {
  if (Array.isArray(val)) return val.length ? String(val[0]) : undefined;
  if (typeof val === 'string' && val) return val;
  return undefined;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CatalogInner />
    </QueryClientProvider>
  );
}
