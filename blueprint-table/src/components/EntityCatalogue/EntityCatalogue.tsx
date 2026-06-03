import './EntityCatalogue.css';
import { useState, useMemo, useRef, useEffect } from 'react';
import { usePortPluginData } from '@port-labs/plugins-sdk/react';
import { useBlueprints } from '../../hooks/useBlueprints';
import { useEntities } from '../../hooks/useEntities';
import { commonPropertyKeys, commonRelationKeys, parseConfigProperties } from '../../hooks/entityCatalogueUtils';
import { Params, Entity } from '../../types';
import { Blueprint, Column, Tab } from './types';
import { TabBar } from './TabBar';
import { EntityTable } from './EntityTable';
import { ColumnPicker } from './ColumnPicker';

function getBlueprintId(value: unknown): string | null {
  if (!value) return null;
  // Port blueprint param may send a plain identifier string or an object with identifier field
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'object' && value !== null) {
    const id = (value as Record<string, unknown>).identifier;
    if (typeof id === 'string' && id.trim()) return id.trim();
  }
  return null;
}

function getConfiguredIds(params: Params): string[] {
  const ids: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const id = getBlueprintId(params[`blueprint${i}`]?.value);
    if (id) ids.push(id);
  }
  return ids;
}

function getConfigProperties(params: Params, index: number): string[] {
  const v = params[`blueprint${index}_properties`]?.value;
  return parseConfigProperties(typeof v === 'string' ? v : undefined);
}

function loadOrder(tabId: string): string[] {
  try {
    const stored = localStorage.getItem(`bp-table:order:${tabId}`);
    return stored ? JSON.parse(stored) as string[] : [];
  } catch {
    return [];
  }
}

function loadHidden(tabId: string): Set<string> {
  try {
    const stored = localStorage.getItem(`bp-table:hidden:${tabId}`);
    return stored ? new Set(JSON.parse(stored) as string[]) : new Set();
  } catch {
    return new Set();
  }
}

const BUILTIN_KEYS = new Set(['identifier', 'title', 'blueprint', 'team', 'updatedAt', 'createdAt']);

function buildAllTabColumns(
  commonPropKeys: string[],
  commonRelKeys: string[],
  blueprintMap: Record<string, Blueprint>,
): Column[] {
  const firstBp = Object.values(blueprintMap)[0];
  return [
    { key: 'identifier', label: 'Identifier',   type: 'string', fixed: true, source: 'builtin' },
    { key: 'blueprint',  label: 'Blueprint',    type: 'string', fixed: true, source: 'builtin' },
    { key: 'title',      label: 'Title',        type: 'string', fixed: true, source: 'builtin' },
    { key: 'team',       label: 'Owning Teams', type: 'string', fixed: true, source: 'builtin' },
    ...commonPropKeys.filter(k => !BUILTIN_KEYS.has(k)).map(key => {
      const prop = firstBp?.schema?.properties?.[key];
      return { key, label: prop?.title || key, type: prop?.type || 'string', source: 'property' as const };
    }),
    ...commonRelKeys.map(key => ({
      key, label: key, type: 'string', source: 'relation' as const,
    })),
    { key: 'updatedAt', label: 'Last Updated',  type: 'date',   fixed: true, source: 'builtin' },
  ];
}

function buildBlueprintColumns(bp: Blueprint, configProps: string[]): Column[] {
  const props = bp.schema?.properties ?? {};
  const keys = configProps.length > 0
    ? configProps.filter(k => k in props)
    : Object.keys(props);
  return [
    { key: 'identifier', label: 'Identifier', type: 'string', fixed: true },
    { key: 'title',      label: 'Title',       type: 'string', fixed: true },
    ...keys.map(key => ({
      key,
      label: props[key]?.title || key,
      type:  props[key]?.type  || 'string',
    })),
    { key: 'updatedAt', label: 'Last Updated', type: 'date', fixed: true },
    { key: 'createdAt', label: 'Created',       type: 'date', fixed: true },
  ];
}

export function EntityCatalogue() {
  const { portToken, portApiBaseUrl, params } = usePortPluginData();
  const typedParams = (params ?? {}) as Params;

  const configuredIds = useMemo(() => getConfiguredIds(typedParams), [typedParams]);

  const blueprintsQuery = useBlueprints();
  const entitiesQuery   = useEntities(configuredIds);

  const allBlueprints: Blueprint[] = blueprintsQuery.data?.blueprints ?? [];

  const selectedBlueprints = useMemo(
    () => configuredIds
      .map(id => allBlueprints.find(b => b.identifier === id))
      .filter((b): b is Blueprint => !!b),
    [configuredIds, allBlueprints],
  );

  const blueprintMap: Record<string, Blueprint> = useMemo(
    () => Object.fromEntries(allBlueprints.map(b => [b.identifier, b])),
    [allBlueprints],
  );

  const commonKeys    = useMemo(() => commonPropertyKeys(selectedBlueprints), [selectedBlueprints]);
  const commonRelKeys = useMemo(() => commonRelationKeys(selectedBlueprints), [selectedBlueprints]);

  const allEntities: Entity[] = entitiesQuery.data ?? [];

  const tabs: Tab[] = useMemo(() => [
    { id: 'all', label: 'All', count: allEntities.length },
    ...selectedBlueprints.map(bp => ({
      id:    bp.identifier,
      label: bp.title || bp.identifier,
      count: allEntities.filter(e => e.blueprint === bp.identifier).length,
    })),
  ], [selectedBlueprints, allEntities]);

  const [activeTab,        setActiveTab]        = useState<string>(() => localStorage.getItem('bp-table:activeTab') ?? 'all');
  const [searchQuery,      setSearchQuery]      = useState(() => localStorage.getItem(`bp-table:search:${localStorage.getItem('bp-table:activeTab') ?? 'all'}`) ?? '');
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);

  const tableAreaRef    = useRef<HTMLDivElement>(null);
  const mirrorRef       = useRef<HTMLDivElement>(null);
  const mirrorInnerRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tableArea = tableAreaRef.current;
    const mirror    = mirrorRef.current;
    const inner     = mirrorInnerRef.current;
    if (!tableArea || !mirror || !inner) return;

    const syncWidth = () => { inner.style.width = `${tableArea.scrollWidth}px`; };
    syncWidth();

    let busy = false;
    const onTable  = () => { if (!busy) { busy = true; mirror.scrollLeft = tableArea.scrollLeft; busy = false; } };
    const onMirror = () => { if (!busy) { busy = true; tableArea.scrollLeft = mirror.scrollLeft; busy = false; } };

    tableArea.addEventListener('scroll', onTable);
    mirror.addEventListener('scroll', onMirror);

    const ro = new ResizeObserver(syncWidth);
    ro.observe(tableArea);

    return () => {
      tableArea.removeEventListener('scroll', onTable);
      mirror.removeEventListener('scroll', onMirror);
      ro.disconnect();
    };
  }, []);
  const [hiddenColumns,    setHiddenColumns]    = useState<Record<string, Set<string>>>(() => {
    const result: Record<string, Set<string>> = { all: loadHidden('all') };
    for (const id of configuredIds) result[id] = loadHidden(id);
    return result;
  });
  const [columnOrders, setColumnOrders] = useState<Record<string, string[]>>(() => {
    const result: Record<string, string[]> = { all: loadOrder('all') };
    for (const id of configuredIds) result[id] = loadOrder(id);
    return result;
  });

  const switchTab = (id: string) => {
    localStorage.setItem('bp-table:activeTab', id);
    setActiveTab(id);
    setColumnPickerOpen(false);
    const saved = localStorage.getItem(`bp-table:search:${id}`) ?? '';
    setSearchQuery(saved);
  };

  const updateSearch = (q: string) => {
    localStorage.setItem(`bp-table:search:${activeTab}`, q);
    setSearchQuery(q);
  };

  const reorderColumns = (tabId: string, orderedKeys: string[]) => {
    setColumnOrders(prev => {
      localStorage.setItem(`bp-table:order:${tabId}`, JSON.stringify(orderedKeys));
      return { ...prev, [tabId]: orderedKeys };
    });
  };

  const toggleColumn = (tabId: string, colKey: string) => {
    setHiddenColumns(prev => {
      const next = new Set(prev[tabId] ?? []);
      if (next.has(colKey)) next.delete(colKey); else next.add(colKey);
      localStorage.setItem(`bp-table:hidden:${tabId}`, JSON.stringify([...next]));
      return { ...prev, [tabId]: next };
    });
  };

  const baseColumns: Column[] = useMemo(() => {
    if (activeTab === 'all') return buildAllTabColumns(commonKeys, commonRelKeys, blueprintMap);
    const bp = blueprintMap[activeTab];
    if (!bp) return [];
    const idx = configuredIds.indexOf(activeTab) + 1;
    return buildBlueprintColumns(bp, getConfigProperties(typedParams, idx));
  }, [activeTab, commonKeys, commonRelKeys, blueprintMap, configuredIds, typedParams]);

  const columns: Column[] = useMemo(() => {
    const order = columnOrders[activeTab];
    if (!order || order.length === 0) return baseColumns;
    const orderMap = new Map(order.map((k, i) => [k, i]));
    return [...baseColumns].sort((a, b) => {
      const ai = orderMap.has(a.key) ? orderMap.get(a.key)! : Infinity;
      const bi = orderMap.has(b.key) ? orderMap.get(b.key)! : Infinity;
      return ai - bi;
    });
  }, [baseColumns, columnOrders, activeTab]);

  const visibleEntities = useMemo(() => {
    let list = activeTab === 'all'
      ? allEntities
      : allEntities.filter(e => e.blueprint === activeTab);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(e =>
        e.identifier.toLowerCase().includes(q) ||
        (e.title ?? '').toLowerCase().includes(q),
      );
    }
    return list;
  }, [allEntities, activeTab, searchQuery]);

  const currentHidden  = hiddenColumns[activeTab] ?? new Set<string>();
  const pickableCols   = columns.filter(c => !c.fixed);

  const isLoading = blueprintsQuery.isLoading || entitiesQuery.isLoading;
  const isError   = blueprintsQuery.isError   || entitiesQuery.isError;
  const errorMsg  =
    blueprintsQuery.error instanceof Error ? blueprintsQuery.error.message :
    entitiesQuery.error   instanceof Error ? entitiesQuery.error.message   :
    'Failed to load';

  return (
    <div className="entity-catalogue">
      {!portToken && (
        <div className="entity-catalogue__state">Waiting for authentication…</div>
      )}
      {portToken && isLoading && (
        <div className="entity-catalogue__state">Loading…</div>
      )}
      {portToken && isError && (
        <div className="entity-catalogue__state entity-catalogue__state--error">{errorMsg}</div>
      )}
      {portToken && !isLoading && !isError && (
        <div className="entity-catalogue__body">
          <TabBar
            tabs={tabs}
            activeTab={activeTab}
            onSelect={switchTab}
            searchQuery={searchQuery}
            onSearch={updateSearch}
            columnPickerOpen={columnPickerOpen}
            onToggleColumnPicker={() => setColumnPickerOpen(v => !v)}
          />
          <div className="entity-catalogue__table-area" ref={tableAreaRef}>
            {columnPickerOpen && pickableCols.length > 0 && (
              <ColumnPicker
                columns={pickableCols}
                hidden={currentHidden}
                onToggle={key => toggleColumn(activeTab, key)}
                onClose={() => setColumnPickerOpen(false)}
              />
            )}
            <EntityTable
              entities={visibleEntities}
              columns={columns}
              hidden={currentHidden}
              blueprintMap={blueprintMap}
              onReorder={keys => reorderColumns(activeTab, keys)}
            />
          </div>
          <div className="ec-scroll-mirror" ref={mirrorRef}>
            <div className="ec-scroll-mirror__inner" ref={mirrorInnerRef} />
          </div>
        </div>
      )}
    </div>
  );
}
