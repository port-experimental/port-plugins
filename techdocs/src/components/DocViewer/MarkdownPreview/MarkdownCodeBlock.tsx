import type { HTMLAttributes } from "react";

import MermaidDiagram from "./MermaidDiagram";

export default function MarkdownCodeBlock({
  children,
  className,
}: HTMLAttributes<HTMLElement>) {
  const isMermaid =
    !!className && /^language-mermaid/.test(className.toLowerCase());

  if (isMermaid) {
    return <MermaidDiagram>{children}</MermaidDiagram>;
  }

  return <code className={String(className)}>{children}</code>;
}
