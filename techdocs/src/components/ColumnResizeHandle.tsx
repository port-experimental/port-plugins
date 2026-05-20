import { useCallback } from "react";

type ColumnResizeHandleProps = {
  /** Positive when the pointer moves right */
  onDrag: (deltaX: number) => void;
  ariaLabel: string;
};

export function ColumnResizeHandle({
  onDrag,
  ariaLabel,
}: ColumnResizeHandleProps) {
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      const el = e.currentTarget;
      el.setPointerCapture(e.pointerId);
      let lastX = e.clientX;

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - lastX;
        lastX = ev.clientX;
        if (dx !== 0) onDrag(dx);
      };

      const onUp = (ev: PointerEvent) => {
        el.releasePointerCapture(ev.pointerId);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [onDrag]
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={ariaLabel}
      className="column-resize-handle"
      onPointerDown={onPointerDown}
    />
  );
}
