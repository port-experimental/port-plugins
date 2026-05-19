import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { matchesQuery } from "../utils/filter";

export type PickerOption = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
};

type AddPickerProps = {
  label: string;
  placeholder: string;
  options: PickerOption[];
  disabled?: boolean;
  loading?: boolean;
  onSelect: (option: PickerOption) => void;
  secondaryPanel?: ReactNode;
};

export function AddPicker({
  label,
  placeholder,
  options,
  disabled,
  loading,
  onSelect,
  secondaryPanel,
}: AddPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const filtered = options.filter((option) =>
    matchesQuery(query, [option.title, option.id, option.subtitle, option.meta])
  );

  return (
    <div className="mf-add" ref={rootRef}>
      <button
        type="button"
        className="mf-add__trigger"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={`${inputId}-panel`}
        onClick={() => setOpen((value) => !value)}
      >
        + Add
      </button>
      {open && (
        <div className="mf-add__panel" id={`${inputId}-panel`} role="dialog">
          <label className="mf-add__label" htmlFor={inputId}>
            {label}
          </label>
          {secondaryPanel}
          <input
            id={inputId}
            className="mf-add__input"
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />
          <div className="mf-add__results" role="listbox" aria-label={label}>
            {loading && <p className="mf-add__hint">Loading…</p>}
            {!loading && filtered.length === 0 && (
              <p className="mf-add__hint">No matches.</p>
            )}
            {!loading &&
              filtered.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  role="option"
                  className="mf-add__option"
                  onClick={() => {
                    onSelect(option);
                    setQuery("");
                    setOpen(false);
                  }}
                >
                  <span className="mf-add__option-title">{option.title}</span>
                  <span className="mf-add__option-meta">
                    {[option.id, option.meta, option.subtitle]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
