import { useMemo, type ComponentProps } from "react";
import type { Components } from "react-markdown";
import type { TechDocEntity } from "../../types";
import {
  buildDocPathIndex,
  isExternalHref,
  resolveInternalDocTarget,
  type InternalDocTarget,
} from "../../utils/internalDocLinks";

export type MarkdownNavigate = (target: InternalDocTarget) => void;

type AnchorProps = ComponentProps<"a">;

interface UseMarkdownComponentsOptions {
  currentDoc: TechDocEntity;
  docs: TechDocEntity[];
  onNavigate: MarkdownNavigate;
}

export function useMarkdownComponents({
  currentDoc,
  docs,
  onNavigate,
}: UseMarkdownComponentsOptions): Components {
  const docPathIndex = useMemo(() => buildDocPathIndex(docs), [docs]);

  return useMemo(() => {
    function MarkdownLink({
      href,
      children,
      className,
      ...rest
    }: AnchorProps) {
      const target = resolveInternalDocTarget(href, currentDoc, docPathIndex);

      if (target) {
        return (
          <button
            type="button"
            className={["doc-inline-link", className].filter(Boolean).join(" ")}
            onClick={() => onNavigate(target)}
          >
            {children}
          </button>
        );
      }

      const external = href && isExternalHref(href);
      return (
        <a
          {...rest}
          href={href}
          className={className}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : undefined)}
        >
          {children}
        </a>
      );
    }

    return { a: MarkdownLink };
  }, [currentDoc, docPathIndex, onNavigate]);
}
