import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type MenuItem = {
  label: string;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
};

/**
 * A "⋯ More" overflow menu for a card's secondary/destructive actions, so only
 * the primary action stays a visible button. The popover is rendered in a
 * portal with fixed positioning so it floats above everything - the card is
 * `overflow: hidden`, which would otherwise clip an in-card dropdown. Closes on
 * click-outside / scroll / resize (native menus don't work in Port's iframe).
 */
export function CardMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Anchor the menu to the trigger: below it and right-aligned, flipping above
  // when there isn't room. Clamped to the viewport.
  const place = () => {
    const t = triggerRef.current?.getBoundingClientRect();
    if (!t) return;
    const width = 184;
    const height = items.length * 38 + 8;
    const margin = 8;
    const left = Math.max(margin, Math.min(t.right - width, window.innerWidth - width - margin));
    const below = t.bottom + 6;
    const top =
      below + height > window.innerHeight - margin
        ? Math.max(margin, t.top - height - 6)
        : below;
    setPos({ top, left });
  };

  useLayoutEffect(() => {
    if (open) place();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const close = () => setOpen(false);
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className="cardmenu">
      <button
        ref={triggerRef}
        type="button"
        className="btn btn--ghost btn--sm cardmenu__trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        title="More actions"
        onClick={() => setOpen((o) => !o)}
      >
        ⋯
      </button>
      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="cardmenu__pop"
            role="menu"
            style={{ top: pos.top, left: pos.left }}
          >
            {items.map((it, i) => (
              <button
                key={i}
                type="button"
                role="menuitem"
                className={`cardmenu__item${it.danger ? " cardmenu__item--danger" : ""}`}
                disabled={it.disabled}
                onClick={() => {
                  setOpen(false);
                  it.onClick();
                }}
              >
                {it.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </div>
  );
}
