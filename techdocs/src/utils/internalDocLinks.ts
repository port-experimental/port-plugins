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

/** Normalized paths to try when matching `filePath` in search or the loaded index. */
export function filePathSearchCandidates(resolvedPath: string): string[] {
  const normalized = normalizeRepoPath(resolvedPath);
  const candidates = new Set<string>([normalized]);
  if (!/\.(?:md|markdown)$/i.test(normalized)) {
    candidates.add(`${normalized}.md`);
    candidates.add(`${normalized}/README.md`);
  }
  return [...candidates];
}

function lookupDocId(
  index: Map<string, string>,
  repo: string,
  filePath: string
): string | undefined {
  for (const candidate of filePathSearchCandidates(filePath)) {
    const id = index.get(docPathKey(repo, candidate));
    if (id) return id;
  }
  return undefined;
}

export type InternalHrefSpec =
  | { kind: "hash"; hash: string }
  | { kind: "doc"; filePath: string; hash: string | null };

/** Repo-relative markdown href (same-repo), before checking loaded docs or the API. */
export function resolveInternalHrefSpec(
  href: string | undefined,
  currentDoc: TechDocEntity
): InternalHrefSpec | null {
  if (!href?.trim()) return null;
  if (isExternalHref(href)) return null;
  if (!currentDoc.relations.repository) return null;

  const { pathPart, hash } = splitHrefHash(href);
  const trimmedPath = pathPart.trim();

  if (!trimmedPath) {
    if (hash) return { kind: "hash", hash };
    return null;
  }

  const baseFilePath =
    currentDoc.properties.filePath?.trim() || "README.md";
  const filePath = resolveRepoRelativePath(baseFilePath, trimmedPath);
  return { kind: "doc", filePath, hash };
}

/**
 * Resolves a markdown href to another techDoc in the same repository, if possible.
 */
export function resolveInternalDocTarget(
  href: string | undefined,
  currentDoc: TechDocEntity,
  docPathIndex: Map<string, string>
): InternalDocTarget | null {
  const spec = resolveInternalHrefSpec(href, currentDoc);
  if (!spec) return null;
  if (spec.kind === "hash") return spec;

  const repo = currentDoc.relations.repository;
  const docId = lookupDocId(docPathIndex, repo, spec.filePath);
  if (!docId) return null;

  return { kind: "doc", docId, hash: spec.hash };
}
