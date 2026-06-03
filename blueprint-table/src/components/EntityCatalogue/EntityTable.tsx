import { useState } from 'react';
import { Column, Blueprint } from './types';
import { Entity } from '../../types';
import { formatPropertyValue, formatRelativeTime } from '../../hooks/entityCatalogueUtils';
import { buildPortEntityUrl } from '../../utils/portEntityUrl';

interface EntityTableProps {
  entities: Entity[];
  columns: Column[];
  hidden: Set<string>;
  blueprintMap: Record<string, Blueprint>;
  onReorder: (orderedKeys: string[]) => void;
}

function getCellValue(entity: Entity, col: Column): unknown {
  switch (col.key) {
    case 'identifier': return entity.identifier;
    case 'title':      return entity.title;
    case 'blueprint':  return entity.blueprint;
    case 'team':       return entity.team;
    case 'updatedAt':  return entity.updatedAt;
    case 'createdAt':  return entity.createdAt;
    default:
      if (col.source === 'relation') return entity.relations?.[col.key];
      return entity.properties?.[col.key];
  }
}

function renderCell(
  entity: Entity,
  colKey: string,
  value: unknown,
  colType: string,
  blueprintMap: Record<string, Blueprint>,
): React.ReactNode {
  const openEntity = () => {
    const url = buildPortEntityUrl(entity.blueprint ?? '', entity.identifier);
    if (url !== '#') window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (colKey === 'identifier') {
    return (
      <span className="ec-table__identifier ec-table__link" onClick={openEntity}>
        {String(value ?? '—')}
      </span>
    );
  }
  if (colKey === 'blueprint') {
    const bp = blueprintMap[String(value ?? '')];
    return (
      <span className="ec-table__blueprint">
        {bp?.title ?? String(value ?? '—')}
      </span>
    );
  }
  if (colKey === 'title') {
    return (
      <strong className="ec-table__title ec-table__link" onClick={openEntity}>
        {String(value ?? '—')}
      </strong>
    );
  }
  if (colKey === 'updatedAt' || colKey === 'createdAt') {
    return <span className="ec-table__date">{formatRelativeTime(value as string | undefined)}</span>;
  }
  if (colType === 'boolean') {
    const display = formatPropertyValue(value); // 'True' or 'False'
    return (
      <span className={`ec-table__badge ec-table__badge--${display.toLowerCase()}`}>
        {display}
      </span>
    );
  }
  if (colType === 'number') {
    return <span className="ec-table__num">{formatPropertyValue(value)}</span>;
  }
  return <span>{formatPropertyValue(value)}</span>;
}

export function EntityTable({ entities, columns, hidden, blueprintMap, onReorder }: EntityTableProps) {
  const visibleCols = columns.filter(col => col.fixed || !hidden.has(col.key));

  const [dragKey,     setDragKey]     = useState<string | null>(null);
  const [dragOverKey, setDragOverKey] = useState<string | null>(null);

  const handleDragStart = (key: string) => setDragKey(key);
  const handleDragOver  = (e: React.DragEvent, key: string) => { e.preventDefault(); setDragOverKey(key); };
  const handleDragEnd   = () => { setDragKey(null); setDragOverKey(null); };
  const handleDrop      = (targetKey: string) => {
    if (dragKey && dragKey !== targetKey) {
      const keys = visibleCols.map(c => c.key);
      const from = keys.indexOf(dragKey);
      const to   = keys.indexOf(targetKey);
      const next = [...keys];
      next.splice(from, 1);
      next.splice(to, 0, dragKey);
      onReorder(next);
    }
    setDragKey(null);
    setDragOverKey(null);
  };

  if (entities.length === 0) {
    return <div className="ec-table__empty">No entities found.</div>;
  }

  return (
    <div className="ec-table__wrap">
      <table className="ec-table">
        <thead>
          <tr>
            {visibleCols.map(col => (
              <th
                key={col.key}
                draggable
                onDragStart={() => handleDragStart(col.key)}
                onDragOver={e => handleDragOver(e, col.key)}
                onDrop={() => handleDrop(col.key)}
                onDragEnd={handleDragEnd}
                className={[
                  col.type === 'number' ? 'ec-table__th--num' : '',
                  'ec-table__th--draggable',
                  dragOverKey === col.key && dragKey !== col.key ? 'ec-table__th--drag-over' : '',
                ].filter(Boolean).join(' ')}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entities.map(entity => (
            <tr key={entity.identifier}>
              {visibleCols.map(col => {
                const value = getCellValue(entity, col);
                return (
                  <td
                    key={col.key}
                    className={col.type === 'number' ? 'ec-table__td--num' : ''}
                  >
                    {renderCell(entity, col.key, value, col.type, blueprintMap)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
