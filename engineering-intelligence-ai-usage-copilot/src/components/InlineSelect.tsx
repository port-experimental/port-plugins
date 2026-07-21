import { useEffect, useRef, useState, type ReactNode } from "react";

type Option<T> = { value: T; label: string; icon?: ReactNode };

type Props<T extends string> = {
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
};

export function InlineSelect<T extends string>({ value, options, onChange }: Props<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const current = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pick = (v: T) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <div className="isel" ref={rootRef}>
      <button
        type="button"
        className="isel__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {current?.icon && <span className="isel__icon" aria-hidden="true">{current.icon}</span>}
        {current?.label ?? value}
        <span className="isel__caret" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="isel__pop" role="listbox">
          {options.map((o) => (
            <button
              key={o.value}
              type="button"
              className={`isel__item${o.value === value ? " isel__item--active" : ""}`}
              role="option"
              aria-selected={o.value === value}
              onClick={() => pick(o.value)}
            >
              <span className="isel__check" aria-hidden="true">
                {o.value === value ? "✓" : ""}
              </span>
              {o.icon && <span className="isel__icon" aria-hidden="true">{o.icon}</span>}
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
