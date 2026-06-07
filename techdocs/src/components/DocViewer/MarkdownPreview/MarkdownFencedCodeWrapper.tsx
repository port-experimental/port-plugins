import { Children, isValidElement, type HTMLAttributes, type ReactNode } from "react";

function classNameIncludes(node: ReactNode, token: string): boolean {
  if (!isValidElement<{ className?: string }>(node)) return false;
  const cn = node.props.className;
  return typeof cn === "string" && cn.split(/\s+/).includes(token);
}

function isCopiedChild(node: ReactNode): boolean {
  return classNameIncludes(node, "copied");
}

function isMermaidChild(node: ReactNode): boolean {
  if (!isValidElement<{ className?: string }>(node)) return false;
  const cn = node.props.className;
  if (typeof cn === "string") {
    if (/language-mermaid/i.test(cn)) return true;
    if (
      cn.includes("mermaid-diagram") ||
      cn.includes("mermaid-fallback") ||
      cn.includes("mermaid-error")
    ) {
      return true;
    }
  }
  return false;
}

function isMermaidBlock(children: ReactNode): boolean {
  return Children.toArray(children).some(isMermaidChild);
}

/** Outer wrapper for fenced code blocks: `<pre>` for code, `<div>` for Mermaid diagrams. */
export default function MarkdownFencedCodeWrapper({
  children,
  className,
}: HTMLAttributes<HTMLPreElement>) {
  const content = Children.toArray(children).filter((child) => !isCopiedChild(child));

  if (isMermaidBlock(children)) {
    return (
      <div className={["doc-mermaid-block", className].filter(Boolean).join(" ")}>
        {content}
      </div>
    );
  }

  return <pre className={className}>{content}</pre>;
}
