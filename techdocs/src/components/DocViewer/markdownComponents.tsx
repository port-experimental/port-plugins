import { useMemo, useState, type ComponentProps } from "react";
import type { Components } from "react-markdown";
import type { TechDocEntity } from "../../types";
import {
  isExternalHref,
  resolveInternalDocTarget,
  resolveInternalHrefSpec,
  type InternalDocTarget,
} from "../../utils/internalDocLinks";

export type MarkdownNavigate = (target: InternalDocTarget) => void;

type AnchorProps = ComponentProps<"a">;

type MarkdownLinkProps = AnchorProps & {
  currentDoc: TechDocEntity;
  docPathIndex: Map<string, string>;
  resolveLinkTarget: (
    href: string | undefined,
    currentDoc: TechDocEntity
  ) => Promise<InternalDocTarget | null>;
  onNavigate: MarkdownNavigate;
};

function MarkdownLink({
  href,
  children,
  className,
  currentDoc,
  docPathIndex,
  resolveLinkTarget,
  onNavigate,
  ...rest
}: MarkdownLinkProps) {
  const [resolving, setResolving] = useState(false);

  const loadedTarget = resolveInternalDocTarget(href, currentDoc, docPathIndex);
  const hrefSpec = loadedTarget ? null : resolveInternalHrefSpec(href, currentDoc);
  const isInternal = Boolean(loadedTarget || hrefSpec);

  const handleClick = async () => {
    if (loadedTarget) {
      onNavigate(loadedTarget);
      return;
    }
    if (!hrefSpec || resolving) return;
    if (hrefSpec.kind === "hash") {
      onNavigate(hrefSpec);
      return;
    }
    setResolving(true);
    try {
      const target = await resolveLinkTarget(href, currentDoc);
      if (target) onNavigate(target);
    } finally {
      setResolving(false);
    }
  };

  if (isInternal) {
    return (
      <button
        type="button"
        className={["doc-inline-link", className].filter(Boolean).join(" ")}
        disabled={resolving}
        aria-busy={resolving}
        onClick={() => void handleClick()}
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

interface UseMarkdownComponentsOptions {
  currentDoc: TechDocEntity;
  docPathIndex: Map<string, string>;
  resolveLinkTarget: (
    href: string | undefined,
    currentDoc: TechDocEntity
  ) => Promise<InternalDocTarget | null>;
  onNavigate: MarkdownNavigate;
}

export function useMarkdownComponents({
  currentDoc,
  docPathIndex,
  resolveLinkTarget,
  onNavigate,
}: UseMarkdownComponentsOptions): Components {
  return useMemo(
    () => ({
      a: (linkProps: AnchorProps) => (
        <MarkdownLink
          {...linkProps}
          currentDoc={currentDoc}
          docPathIndex={docPathIndex}
          resolveLinkTarget={resolveLinkTarget}
          onNavigate={onNavigate}
        />
      ),
    }),
    [currentDoc, docPathIndex, resolveLinkTarget, onNavigate]
  );
}
