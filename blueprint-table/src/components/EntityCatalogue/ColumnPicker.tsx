import { Column } from './types';

interface ColumnPickerProps {
  columns: Column[];       // non-fixed columns for the active tab
  hidden: Set<string>;
  onToggle: (key: string) => void;
  onClose: () => void;
}

export function ColumnPicker({ columns, hidden, onToggle, onClose }: ColumnPickerProps) {
  return (
    <div className="col-picker" role="dialog" aria-label="Column visibility">
      <div className="col-picker__header">
        <span className="col-picker__title">Columns</span>
        <button className="col-picker__close" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <ul className="col-picker__list">
        {columns.map(col => (
          <li key={col.key}>
            <label className="col-picker__item">
              <input
                type="checkbox"
                checked={!hidden.has(col.key)}
                onChange={() => onToggle(col.key)}
              />
              <span>{col.label}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
