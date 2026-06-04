import { visit } from "unist-util-visit";

const attachHashLinkScrollHandler = (node: {
  tagName?: string;
  properties?: { href?: string; onClick?: () => void };
}) => {
  if (node.tagName !== "a" || typeof node.properties?.href !== "string") {
    return;
  }

  const url = node.properties.href;
  if (!url.startsWith("#")) return;

  node.properties.onClick = () => {
    history.pushState({}, "", url);
    const hash = url.replace("#", "");
    const id = decodeURIComponent(hash);
    const element = document.getElementById(id);
    if (!element) return;
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  };
};

/** Rehype plugin: same-page `#heading` links scroll smoothly inside the doc viewer. */
export default function rehypeSmoothScrollHashLinks() {
  return (tree: Parameters<typeof visit>[0]) => {
    visit(tree, "element", attachHashLinkScrollHandler);
  };
}
