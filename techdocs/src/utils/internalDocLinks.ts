import type { TechDocEntity } from "../types";

const EXTERNAL_HREF = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

export type InternalDocTarget =
  | { kind: "doc"; docId: string; hash: string | null }
  | { kind: "hash"; hash: string };

/** True for http(s), mailto, //, etc. Fragment-only hrefs are not external. */
export function isExternalHref(href: string): boolean {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#")) return false;
  return EXTERNAL_HREF.test(trimmed);
}

export function splitHrefHash(href: string): {
  pathPart: string;
  hash: string | null;
} {
  const hashIdx = href.indexOf("#");
  if (hashIdx === -1) return { pathPart: href, hash: null };
  return {
    pathPart: href.slice(0, hashIdx),
    hash: href.slice(hashIdx + 1) || null,
  };
}

function dirname(filePath: string): string {
  const idx = filePath.lastIndexOf("/");
  return idx === -1 ? "" : filePath.slice(0, idx);
}

/** Normalize a repo-relative path (POSIX-style, no leading slash). */
export function normalizeRepoPath(path: string): string {
  const parts = path.split("/").filter((p) => p !== "" && p !== ".");
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "..") {
      stack.pop();
      continue;
    }
    stack.push(part);
  }
  return stack.join("/");
}

export function resolveRepoRelativePath(
  baseFilePath: string,
  hrefPath: string
): string {
  const trimmed = hrefPath.trim();
  if (!trimmed) return normalizeRepoPath(baseFilePath);
  if (trimmed.startsWith("/")) {
    return normalizeRepoPath(trimmed.slice(1));
  }
  const baseDir = dirname(baseFilePath);
  const combined = baseDir ? `${baseDir}/${trimmed}` : trimmed;
  return normalizeRepoPath(combined);
}

export function buildDocPathIndex(
  docs: TechDocEntity[]
): Map<string, string> {
  const index = new Map<string, string>();
  for (const doc of docs) {
    const repo = doc.relations.repository;
    const filePath = doc.properties.filePath?.trim();
    if (!repo || !filePath) continue;
    index.set(docPathKey(repo, normalizeRepoPath(filePath)), doc.identifier);
  }
  return index;
}

function docPathKey(repo: string, filePath: string): string {
  return `${repo}\0${filePath}`;
}

function lookupDocId(
  index: Map<string, string>,
  repo: string,
  filePath: string
): string | undefined {
  const normalized = normalizeRepoPath(filePath);
  const direct = index.get(docPathKey(repo, normalized));
  if (direct) return direct;

  if (!/\.(?:md|markdown)$/i.test(normalized)) {
    const withMd = index.get(docPathKey(repo, `${normalized}.md`));
    if (withMd) return withMd;
    const readme = index.get(
      docPathKey(repo, `${normalized}/README.md`)
    );
    if (readme) return readme;
  }

  return undefined;
}

/**
 * Resolves a markdown href to another techDoc in the same repository, if possible.
 */
export function resolveInternalDocTarget(
  href: string | undefined,
  currentDoc: TechDocEntity,
  docPathIndex: Map<string, string>
): InternalDocTarget | null {
  if (!href?.trim()) return null;
  if (isExternalHref(href)) return null;

  const repo = currentDoc.relations.repository;
  if (!repo) return null;

  const { pathPart, hash } = splitHrefHash(href);
  const trimmedPath = pathPart.trim();

  if (!trimmedPath) {
    if (hash) return { kind: "hash", hash };
    return null;
  }

  const baseFilePath =
    currentDoc.properties.filePath?.trim() || "README.md";
  const resolved = resolveRepoRelativePath(baseFilePath, trimmedPath);
  const docId = lookupDocId(docPathIndex, repo, resolved);
  if (!docId) return null;

  return { kind: "doc", docId, hash };
}
