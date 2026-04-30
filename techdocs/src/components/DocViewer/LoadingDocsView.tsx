import { useEffect, useRef } from "react";

export function LoadingDocsView() {
  const rotorRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const periodMs =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 2000
        : 800;

    let frameId = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const el = rotorRef.current;
      if (el) {
        const elapsed = now - start;
        const deg = ((elapsed % periodMs) / periodMs) * 360;
        el.setAttribute("transform", `rotate(${deg} 25 25)`);
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, []);

  return (
    <div
      className="docs-fetch-state docs-fetch-state--loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="docs-fetch-card">
        <svg
          className="docs-fetch-spinner-svg"
          viewBox="0 0 50 50"
          width="48"
          height="48"
          aria-hidden
        >
          <circle
            className="docs-fetch-spinner-track"
            cx="25"
            cy="25"
            r="21"
            fill="none"
            strokeWidth="4"
          />
          <g ref={rotorRef} className="docs-fetch-spinner-rotor">
            <circle
              className="docs-fetch-spinner-head"
              cx="25"
              cy="25"
              r="21"
              fill="none"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="33 99"
            />
          </g>
        </svg>
        <h1 className="docs-fetch-title">Loading documentation</h1>
      </div>
    </div>
  );
}
