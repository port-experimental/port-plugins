import MarkdownPreview from "@uiw/react-markdown-preview";
import "@uiw/react-markdown-preview/markdown.css";
import { useEffect, useMemo, useState, type ComponentProps } from "react";
import type { TechDocEntity } from "../../../types";
import type { InternalDocTarget } from "../../../utils/internalDocLinks";
import { MarkdownLink, type MarkdownNavigate } from "../markdownComponents";
import MarkdownCodeBlock from "./MarkdownCodeBlock";
import MarkdownFencedCodeWrapper from "./MarkdownFencedCodeWrapper";
import "./markdownPreview.css";
import rehypeSmoothScrollHashLinks from "./rehypeSmoothScrollHashLinks";

const allowedElements = [
  "a",
  "style",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "nav",
  "blockquote",
  "dd",
  "div",
  "pre",
  "dl",
  "hr",
  "li",
  "menu",
  "ol",
  "p",
  "ul",
  "b",
  "br",
  "cite",
  "code",
  "em",
  "i",
  "mark",
  "q",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "var",
  "wbr",
  "img",
  "video",
  "svg",
  "caption",
  "col",
  "colgroup",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "input",
  "del",
];

function useMarkdownColorMode(): "light" | "dark" {
  const [mode, setMode] = useState<"light" | "dark">(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
  );

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setMode(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return mode;
}

export interface TechDocsMarkdownPreviewProps {
  value: string;
  currentDoc: TechDocEntity;
  docPathIndex: Map<string, string>;
  resolveLinkTarget: (
    href: string | undefined,
    currentDoc: TechDocEntity
  ) => Promise<InternalDocTarget | null>;
  onNavigate: MarkdownNavigate;
}

export function TechDocsMarkdownPreview({
  value,
  currentDoc,
  docPathIndex,
  resolveLinkTarget,
  onNavigate,
}: TechDocsMarkdownPreviewProps) {
  const dataColorMode = useMarkdownColorMode();

  const linkProps = useMemo(
    () => ({
      currentDoc,
      docPathIndex,
      resolveLinkTarget,
      onNavigate,
    }),
    [currentDoc, docPathIndex, resolveLinkTarget, onNavigate]
  );

  const markdownComponents = useMemo(
    () => ({
      code: MarkdownCodeBlock,
      pre: MarkdownFencedCodeWrapper,
      a: (anchorProps: ComponentProps<"a">) => (
        <MarkdownLink {...anchorProps} {...linkProps} />
      ),
      input: (inputProps: ComponentProps<"input">) => {
        if (inputProps.type === "checkbox") {
          return (
            <input disabled checked={inputProps.checked} type="checkbox" />
          );
        }
        return null;
      },
    }),
    [linkProps]
  );

  return (
    <MarkdownPreview
      className="wmde-markdown-var wmde-markdown doc-markdown-preview"
      source={value}
      skipHtml={false}
      rehypePlugins={[rehypeSmoothScrollHashLinks]}
      allowedElements={allowedElements}
      components={markdownComponents}
      wrapperElement={{ "data-color-mode": dataColorMode }}
    />
  );
}
