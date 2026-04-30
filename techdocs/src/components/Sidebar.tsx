import { useCallback, useMemo, useState, type UIEvent } from "react";
import type { TechDocEntity } from "../types";

interface SidebarProps {
  docs: TechDocEntity[];
  activeDocId: string | null;
  onSelect: (docId: string) => void;
  /** When true, more catalog pages can be loaded (API returned a non-empty `next`). */
  hasMoreDocs?: boolean;
  isFetchingMoreDocs?: boolean;
  onLoadMoreDocs?: () => void;
}

interface TreeNode {
  label: string;
  docId?: string;
  children: Map<string, TreeNode>;
}

function buildTree(docs: TechDocEntity[]): Map<string, TreeNode> {
  const repos = new Map<string, TreeNode>();

  for (const doc of docs) {
    const repoName = doc.relations.repository;
    if (!repos.has(repoName)) {
      repos.set(repoName, { label: repoName, children: new Map() });
    }
    const repoNode = repos.get(repoName)!;

    const folderPath = doc.properties.folderPath;
    if (!folderPath) {
      repoNode.children.set(doc.identifier, {
        label: doc.title,
        docId: doc.identifier,
        children: new Map(),
      });
      continue;
    }

    const segments = folderPath.split("/");
    let current = repoNode;
    for (const seg of segments) {
      if (!current.children.has(seg)) {
        current.children.set(seg, { label: seg, children: new Map() });
      }
      current = current.children.get(seg)!;
    }

    current.children.set(doc.identifier, {
      label: doc.title,
      docId: doc.identifier,
      children: new Map(),
    });
  }

  return repos;
}

function TreeItem({
  node,
  depth,
  activeDocId,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  activeDocId: string | null;
  onSelect: (docId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children.size > 0;
  const isDoc = !!node.docId;
  const isActive = isDoc && node.docId === activeDocId;

  const handleClick = () => {
    if (isDoc) {
      onSelect(node.docId!);
    } else if (hasChildren) {
      setExpanded(!expanded);
    }
  };

  return (
    <li className="tree-item">
      <button
        className={`tree-button ${isActive ? "tree-active" : ""} ${isDoc ? "tree-doc" : "tree-folder"}`}
        style={{ paddingLeft: `${12 + depth * 16}px` }}
        onClick={handleClick}
        title={node.label}
      >
        {!isDoc && hasChildren && (
          <span className={`tree-chevron ${expanded ? "expanded" : ""}`}>
            &#9654;
          </span>
        )}
        <span className="tree-label">{node.label}</span>
      </button>
      {hasChildren && expanded && (
        <ul className="tree-list">
          {Array.from(node.children.values()).map((child) => (
            <TreeItem
              key={child.docId ?? child.label}
              node={child}
              depth={depth + 1}
              activeDocId={activeDocId}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

const SCROLL_LOAD_THRESHOLD_PX = 72;

export function Sidebar({
  docs,
  activeDocId,
  onSelect,
  hasMoreDocs = false,
  isFetchingMoreDocs = false,
  onLoadMoreDocs,
}: SidebarProps) {
  const tree = useMemo(() => buildTree(docs), [docs]);

  const handleScroll = useCallback(
    (e: UIEvent<HTMLElement>) => {
      if (!hasMoreDocs || isFetchingMoreDocs || !onLoadMoreDocs) return;
      const el = e.currentTarget;
      const distanceToBottom =
        el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceToBottom <= SCROLL_LOAD_THRESHOLD_PX) {
        onLoadMoreDocs();
      }
    },
    [hasMoreDocs, isFetchingMoreDocs, onLoadMoreDocs]
  );

  if (docs.length === 0) {
    return (
      <nav className="sidebar">
        <div className="sidebar-header">Documentation</div>
        <p className="sidebar-empty">No documents found.</p>
      </nav>
    );
  }

  return (
    <nav className="sidebar" onScroll={handleScroll}>
      <div className="sidebar-header">Documentation</div>
      <ul className="tree-list tree-root">
        {Array.from(tree.values()).map((repoNode) => (
          <li key={repoNode.label} className="tree-repo">
            <div className="tree-repo-label">{repoNode.label}</div>
            <ul className="tree-list">
              {Array.from(repoNode.children.values()).map((child) => (
                <TreeItem
                  key={child.docId ?? child.label}
                  node={child}
                  depth={0}
                  activeDocId={activeDocId}
                  onSelect={onSelect}
                />
              ))}
            </ul>
          </li>
        ))}
      </ul>
      {isFetchingMoreDocs ? (
        <div className="sidebar-loading-more" role="status" aria-live="polite">
          Loading more…
        </div>
      ) : null}
    </nav>
  );
}
