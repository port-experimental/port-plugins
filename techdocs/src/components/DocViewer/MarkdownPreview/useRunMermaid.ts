import zenuml from "@mermaid-js/mermaid-zenuml";
import mermaid from "mermaid";
import { useEffect, useRef, useState } from "react";
import { installTrustedTypesDefaultPolicy } from "../../../utils/trustedTypesPolicy";
import {
  preprocessBoxDrawing,
  remapErrorLines,
} from "./preprocessBoxDrawing";

let initPromise: Promise<void> | undefined;
let renderSerial = 0;

function ensureMermaidInit(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      installTrustedTypesDefaultPolicy();
      await mermaid.registerExternalDiagrams([zenuml]);
      mermaid.initialize({
        startOnLoad: false,
        suppressErrorRendering: true,
        fontFamily: "system-ui, sans-serif",
      });
    })();
  }
  return initPromise;
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

    let mermaidInput = trimmed;
    let lineMap = new Map<number, number>();
    try {
      const preprocessed = preprocessBoxDrawing(trimmed);
      mermaidInput = preprocessed.text;
      lineMap = preprocessed.lineMap;
    } catch (error) {
      if (cancelled) return;
      setMermaidError(`Mermaid Chart ${String(error)}`);
      setSvgCode(undefined);
      return;
    }

    ensureMermaidInit()
      .then(() => {
        if (cancelled) return;
        return mermaid.render(renderId, mermaidInput);
      })
      .then((result) => {
        if (cancelled || !result) return;
        setSvgCode(result.svg);
        setMermaidError(undefined);
      })
      .catch((error) => {
        if (cancelled) return;
        const message = String(error);
        const remapped =
          lineMap.size > 0 ? remapErrorLines(message, lineMap) : message;
        setMermaidError(`Mermaid Chart ${remapped}`);
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
