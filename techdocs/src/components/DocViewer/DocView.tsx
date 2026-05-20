import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { TechDocEntity } from "../../types";
import { pickLastUpdatedRaw } from "../../utils/techDocProperties";

interface DocViewerProps {
  doc: TechDocEntity | null;
}

function formatDisplayDate(iso: string): string {
  const d = new Date(iso.trim());
  if (Number.isNaN(d.getTime())) return iso.trim();
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function DocViewer({ doc }: DocViewerProps) {
  if (!doc) {
    return (
      <div className="doc-viewer doc-empty">
        <div className="doc-empty-card">
          <p className="doc-empty-title">Choose a document</p>
          <p className="doc-empty-sub">
            Pick a page from the sidebar to read the documentation.
          </p>
        </div>
      </div>
    );
  }

  const { content, filePath, url } = doc.properties;
  const breadcrumb = filePath || "README.md";

  const props = doc.properties as Record<string, unknown>;
  const lastUpdateRaw = pickLastUpdatedRaw(props, doc.updatedAt);
  const lastUpdateLabel = lastUpdateRaw ? formatDisplayDate(lastUpdateRaw) : null;

  return (
    <div className="doc-viewer">
      <div className="doc-body">
        <div className="doc-main">
          <div className="doc-content-surface">
            <header className="doc-header">
              <div className="doc-header-left">
                <p className="doc-header-eyebrow">Documentation</p>
                <h1 className="doc-title">{doc.title}</h1>
                <div className="doc-header-row">
                  <div className="doc-header-row-start">
                    {lastUpdateLabel ? (
                      <div className="doc-meta" aria-label="Document metadata">
                        <span className="doc-meta-item">
                          <svg
                            className="doc-meta-svg"
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden
                          >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 6v6l4 2" />
                          </svg>
                          Last update: {lastUpdateLabel}
                        </span>
                      </div>
                    ) : null}
                  </div>
                  <div className="doc-header-row-end">
                    {url ? (
                      <a
                        href={url}
                        className="doc-source-file-link"
                        target="_blank"
                        rel="noopener noreferrer"
                        title={url}
                        aria-label={`View source (${breadcrumb}) in new tab`}
                      >
                        <span className="doc-source-file-cta">View source</span>
                        <svg
                          className="doc-source-file-icon"
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                          <polyline points="15 3 21 3 21 9" />
                          <line x1="10" y1="14" x2="21" y2="3" />
                        </svg>
                      </a>
                    ) : (
                      <span className="doc-source-file-path--solo">
                        {breadcrumb}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </header>
            <div className="doc-prose-region">
              <article className="doc-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content || "*No content available.*"}
                </ReactMarkdown>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
