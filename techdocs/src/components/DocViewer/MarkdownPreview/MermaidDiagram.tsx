import React, { useMemo } from "react";

import { useRunMermaid } from "./useRunMermaid";

const generateRandomId = () =>
  parseInt(String(Math.random() * 1e15), 10).toString(36);

const hasChildren = (
  props: unknown
): props is { children?: React.ReactNode } =>
  typeof props === "object" && props !== null && "children" in props;

const getTextFromElements = (elements: React.ReactNode): string => {
  if (typeof elements === "string") {
    return elements;
  }
  if (Array.isArray(elements)) {
    return elements.map(getTextFromElements).join("");
  }
  if (React.isValidElement(elements) && hasChildren(elements.props)) {
    return getTextFromElements(elements.props.children);
  }
  return "";
};

export default function MermaidDiagram({
  children,
}: {
  children?: React.ReactNode;
}) {
  const containerElementId = useMemo(
    () => `mermaid-container-${generateRandomId()}`,
    []
  );
  const mermaidCode = useMemo(
    () => getTextFromElements(children),
    [children]
  );

  const { mermaidError, svgCode } = useRunMermaid(mermaidCode);

  if (mermaidError) {
    return (
      <div className="mermaid-error" role="alert" id={containerElementId}>
        <p className="mermaid-error-title">Could not render diagram</p>
        <p className="mermaid-error-detail">{mermaidError}</p>
        <div className="mermaid-fallback">{mermaidCode}</div>
      </div>
    );
  }

  if (svgCode) {
    return (
      <div
        className="mermaid-diagram"
        data-testid="MermaidDiagram"
        dangerouslySetInnerHTML={{ __html: svgCode }}
        id={containerElementId}
      />
    );
  }

  return (
    <div className="mermaid-fallback" id={containerElementId}>
      {mermaidCode}
    </div>
  );
}
