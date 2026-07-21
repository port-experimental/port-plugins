import { useEffect, useRef, useState } from "react";
import type { OrgOption } from "../types";

type Props = {
  orgs: OrgOption[];
  selected: string | null; // null = "All organizations"
  onChange: (id: string | null) => void;
};

function triggerLabel(orgs: OrgOption[], selected: string | null): string {
  if (!selected) return "All organizations";
  return orgs.find((o) => o.id === selected)?.name ?? selected;
}

export function OrgFilter({ orgs, selected, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  // Always declare hooks; guard the effect body instead of using a conditional early return.
  useEffect(() => {
    if (!open || orgs.length < 2) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, orgs.length]);

  const pick = (id: string | null) => {
    onChange(id);
    setOpen(false);
  };

  // Single-org: display name as a static badge, no dropdown.
  if (orgs.length === 1) {
    return (
      <div className="filter-group org-filter">
        <span className="filter-label">Organization</span>
        <span className="org-filter__badge">{orgs[0].name}</span>
      </div>
    );
  }

  return (
    <div className="filter-group org-filter" ref={rootRef}>
      <span className="filter-label">Organization</span>
      <button
        type="button"
        className={`org-filter__trigger${selected ? " org-filter__trigger--active" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        {triggerLabel(orgs, selected)}
        <span className="dp__caret" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="org-filter__pop" role="listbox" aria-label="Select organization">
          <button
            type="button"
            className={`org-filter__item${!selected ? " org-filter__item--active" : ""}`}
            role="option"
            aria-selected={!selected}
            onClick={() => pick(null)}
          >
            <span className="org-filter__check" aria-hidden="true">{!selected ? "●" : ""}</span>
            All organizations
          </button>
          <div className="org-filter__divider" />
          {orgs.map((o) => (
            <button
              key={o.id}
              type="button"
              className={`org-filter__item${selected === o.id ? " org-filter__item--active" : ""}`}
              role="option"
              aria-selected={selected === o.id}
              onClick={() => pick(o.id)}
            >
              <span className="org-filter__check" aria-hidden="true">
                {selected === o.id ? "●" : ""}
              </span>
              <span className="org-filter__name">{o.name}</span>
              {o.id !== o.name && (
                <span className="org-filter__id">{o.id}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
