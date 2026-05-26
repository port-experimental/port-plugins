import { useState, useMemo, useCallback, useEffect } from "react";
import "./App.css";
import { usePostMessageData } from "./hooks/usePostMessageData";
import { useMediaQuery } from "./hooks/useMediaQuery";
import { Sidebar } from "./components/Sidebar";
import { DocViewer } from "./components/DocViewer/DocView";
import { ColumnResizeHandle } from "./components/ColumnResizeHandle";
import {
  readSidebarWidth,
  writeSidebarWidth,
} from "./utils/columnWidthStorage";
import type { PluginConfig, Params } from "./types";
import { useDocs } from "./hooks/useDocs";
import { LoadingDocsView } from "./components/DocViewer/LoadingDocsView";
import { ErrorDocView } from "./components/DocViewer/ErrorDocView";

function blueprintParamValue(value: unknown, fallback: string): string {
  if (value == null || value === "") return fallback;
  if (typeof value === "string") {
    const t = value.trim();
    return t ? t : fallback;
  }
  if (typeof value === "object" && value !== null && "identifier" in value) {
    const id = (value as { identifier: unknown }).identifier;
    if (typeof id === "string" && id.trim()) return id.trim();
  }
  return fallback;
}

function configFromParams(params: Params): PluginConfig {
  const techDocBlueprint = blueprintParamValue(
    params["techDocBlueprint"]?.value,
    "techDoc"
  );
  const techdocsSourceBlueprint = blueprintParamValue(
    params["techdocsSourceBlueprint"]?.value,
    "githubRepository"
  );
  return {
    techDocBlueprint,
    techdocsSourceBlueprint,
    relatedToDirection: "downstream",
  };
}

export function App() {
  const { params, portToken, portApiBaseUrl } = usePostMessageData();
  const config = configFromParams(params);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const layoutStacked = useMediaQuery("(max-width: 768px)");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(readSidebarWidth);
  const {
    docs,
    isLoading,
    error,
    fetchMoreDocs,
    hasMoreDocs,
    isFetchingMoreDocs,
  } = useDocs(config);

  const onSidebarDrag = useCallback((deltaX: number) => {
    setSidebarWidth((w) => {
      const next = Math.min(560, Math.max(180, w + deltaX));
      writeSidebarWidth(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (activeDocId == null) return;
    if (!docs.some((d) => d.identifier === activeDocId)) {
      setActiveDocId(null);
    }
  }, [docs, activeDocId]);

  useEffect(() => {
    if (!layoutStacked) setMobileSidebarOpen(false);
  }, [layoutStacked]);

  useEffect(() => {
    if (!layoutStacked || !mobileSidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileSidebarOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [layoutStacked, mobileSidebarOpen]);

  const handleSelectDoc = useCallback(
    (docId: string) => {
      setActiveDocId(docId);
      if (layoutStacked) setMobileSidebarOpen(false);
    },
    [layoutStacked]
  );

  const activeDoc = useMemo(
    () => docs.find((d) => d.identifier === activeDocId) ?? null,
    [docs, activeDocId]
  );

  if (!portApiBaseUrl || !portToken) {
    return (
      <div className="shell">
        <p className="muted">
          Waiting for Port context... If you opened this file directly, embed it
          in a Port dashboard or entity page instead.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingDocsView />;
  }

  if (error) {
    return <ErrorDocView error={error} />;
  }

  return (
    <div className="layout">
      {layoutStacked ? (
        <div
          className={`layout-sidebar-mobile ${mobileSidebarOpen ? "is-open" : ""}`}
        >
          {!mobileSidebarOpen ? (
            <button
              type="button"
              className="sidebar-mobile-reveal"
              aria-expanded={mobileSidebarOpen}
              aria-controls="sidebar-mobile-panel"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <span className="sidebar-mobile-reveal-label">Documentation</span>
              <span className="sidebar-mobile-reveal-icon" aria-hidden>
                &#9776;
              </span>
            </button>
          ) : null}
          <div
            className="sidebar-mobile-backdrop"
            aria-hidden={!mobileSidebarOpen}
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div
            id="sidebar-mobile-panel"
            className="sidebar-mobile-panel"
            role="dialog"
            aria-modal={mobileSidebarOpen}
            aria-label="Documentation"
            aria-hidden={!mobileSidebarOpen}
          >
            <div className="sidebar-mobile-toolbar">
              <button
                type="button"
                className="sidebar-mobile-close"
                aria-label="Close documentation list"
                onClick={() => setMobileSidebarOpen(false)}
              >
                &#10005;
              </button>
            </div>
            <Sidebar
              docs={docs}
              activeDocId={activeDocId}
              onSelect={handleSelectDoc}
              hasMoreDocs={hasMoreDocs}
              isFetchingMoreDocs={isFetchingMoreDocs}
              onLoadMoreDocs={fetchMoreDocs}
            />
          </div>
        </div>
      ) : (
        <>
          <div
            className="layout-sidebar-column"
            style={{ width: sidebarWidth }}
          >
            <Sidebar
              docs={docs}
              activeDocId={activeDocId}
              onSelect={handleSelectDoc}
              hasMoreDocs={hasMoreDocs}
              isFetchingMoreDocs={isFetchingMoreDocs}
              onLoadMoreDocs={fetchMoreDocs}
            />
          </div>
          <ColumnResizeHandle
            ariaLabel="Resize sidebar"
            onDrag={onSidebarDrag}
          />
        </>
      )}
      <DocViewer
        doc={activeDoc}
        docs={docs}
        onSelectDoc={handleSelectDoc}
      />
    </div>
  );
}
