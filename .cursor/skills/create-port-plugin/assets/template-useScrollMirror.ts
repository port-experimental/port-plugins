import { useLayoutEffect, useRef, useState } from "react";

/**
 * Syncs a sticky bottom horizontal scrollbar (`.scroll-mirror`) with a wide
 * inner region (`.table-area__body`). Copy from skill assets with the table
 * scroll CSS in template-App.css.
 *
 * Refs:
 * - areaRef → `.table-area__body`
 * - mirrorRef → `.scroll-mirror`
 * - innerRef → `.scroll-mirror__inner`
 */
export function useScrollMirror(deps: unknown[] = []) {
  const areaRef = useRef<HTMLDivElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);

  useLayoutEffect(() => {
    const area = areaRef.current;
    const mirror = mirrorRef.current;
    const inner = innerRef.current;
    if (!area || !mirror || !inner) return;

    const syncMirrorWidth = () => {
      inner.style.width = `${area.scrollWidth}px`;
      mirror.scrollLeft = area.scrollLeft;
      setHasHorizontalOverflow(area.scrollWidth > area.clientWidth + 1);
    };

    const onAreaScroll = () => {
      mirror.scrollLeft = area.scrollLeft;
    };

    const onMirrorScroll = () => {
      area.scrollLeft = mirror.scrollLeft;
    };

    syncMirrorWidth();

    const ro = new ResizeObserver(syncMirrorWidth);
    ro.observe(area);
    const table = area.querySelector("table");
    if (table) ro.observe(table);

    const outer = area.parentElement;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) < 1) return;
      if (area.scrollWidth <= area.clientWidth) return;
      area.scrollLeft += e.deltaX;
      mirror.scrollLeft = area.scrollLeft;
      e.preventDefault();
    };

    area.addEventListener("scroll", onAreaScroll, { passive: true });
    mirror.addEventListener("scroll", onMirrorScroll, { passive: true });
    outer?.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      ro.disconnect();
      area.removeEventListener("scroll", onAreaScroll);
      mirror.removeEventListener("scroll", onMirrorScroll);
      outer?.removeEventListener("wheel", onWheel);
    };
  }, deps);

  return { areaRef, mirrorRef, innerRef, hasHorizontalOverflow };
}
