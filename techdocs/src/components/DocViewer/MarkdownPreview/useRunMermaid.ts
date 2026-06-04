import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";
import { installTrustedTypesDefaultPolicy } from "../../../utils/trustedTypesPolicy";

let initialized = false;
let renderSerial = 0;

function ensureMermaidInit() {
  if (initialized) return;
  installTrustedTypesDefaultPolicy();
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "loose",
    suppressErrorRendering: true,
    fontFamily: "system-ui, sans-serif",
  });
  initialized = true;
}

export function useRunMermaid(mermaidCode: string) {
  const [svgCode, setSvgCode] = useState<string>();
  const [mermaidError, setMermaidError] = useState<string>();
  const instanceId = useRef(
    `mermaid-${parseInt(String(Math.random() * 1e15), 10).toString(36)}`
  );

  useEffect(() => {
    const trimmed = mermaidCode.trim();
    if (!trimmed) {
      setSvgCode(undefined);
      setMermaidError(undefined);
      return;
    }

    let cancelled = false;
    const renderId = `${instanceId.current}-${++renderSerial}`;
    ensureMermaidInit();

    mermaid
      .render(renderId, trimmed)
      .then((result) => {
        if (cancelled) return;
        setSvgCode(result.svg);
        setMermaidError(undefined);
      })
      .catch((error) => {
        if (cancelled) return;
        setMermaidError(`Mermaid Chart ${String(error)}`);
        setSvgCode(undefined);
      });

    return () => {
      cancelled = true;
    };
  }, [mermaidCode]);

  if (!mermaidCode.trim()) {
    return { svgCode: "", mermaidError: undefined };
  }

  return { svgCode, mermaidError };
}
