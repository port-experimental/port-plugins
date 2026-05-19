import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type OverflowMenuProps = {
  onClearTab: () => void;
  onClearAll: () => void;
};

export function OverflowMenu({ onClearTab, onClearAll }: OverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  return (
    <div className="mf-menu" ref={menuRef}>
      <button
        type="button"
        className="mf-menu__trigger"
        aria-label="More options"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <MoreHorizontal size={18} strokeWidth={2} aria-hidden="true" />
      </button>
      {open && (
        <div className="mf-menu__panel" role="menu">
          <button
            type="button"
            role="menuitem"
            className="mf-menu__item"
            onClick={() => {
              onClearTab();
              setOpen(false);
            }}
          >
            Clear current tab
          </button>
          <button
            type="button"
            role="menuitem"
            className="mf-menu__item mf-menu__item--danger"
            onClick={() => {
              onClearAll();
              setOpen(false);
            }}
          >
            Clear all favorites
          </button>
        </div>
      )}
    </div>
  );
}
