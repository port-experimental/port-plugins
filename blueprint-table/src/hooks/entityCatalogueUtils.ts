export interface BlueprintSchema {
  schema?: { properties?: Record<string, { title?: string; type?: string }> };
  relations?: Record<string, unknown>;
}

export function commonPropertyKeys(blueprints: BlueprintSchema[]): string[] {
  if (blueprints.length === 0) return [];
  const sets = blueprints.map(b => new Set(Object.keys(b.schema?.properties ?? {})));
  return [...sets[0]].filter(key => sets.every(s => s.has(key)));
}

export function commonRelationKeys(blueprints: BlueprintSchema[]): string[] {
  if (blueprints.length === 0) return [];
  const sets = blueprints.map(b => new Set(Object.keys(b.relations ?? {})));
  return [...sets[0]].filter(key => sets.every(s => s.has(key)));
}

export function parseConfigProperties(param: string | undefined): string[] {
  if (!param) return [];
  return param.split(',').map(s => s.trim()).filter(Boolean);
}

export function formatPropertyValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'True' : 'False';
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) {
    const joined = value.map(v => String(v)).join(', ');
    return joined.length > 60 ? joined.slice(0, 60) + '…' : joined;
  }
  if (typeof value === 'object') {
    const s = JSON.stringify(value);
    return s.length > 60 ? s.slice(0, 60) + '…' : s;
  }
  const s = String(value);
  return s.length > 60 ? s.slice(0, 60) + '…' : s;
}

export function formatRelativeTime(iso?: string): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days !== 1 ? 's' : ''} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}
