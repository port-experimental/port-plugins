import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { fetchSkillFiles, type SkillFile } from "./api/skills";
import { usePostMessageData } from "./hooks/usePostMessageData";

/* ── Types ── */

type FileGroup = {
  type: SkillFile["type"];
  label: string;
  files: SkillFile[];
};

const GROUP_ORDER: Exclude<SkillFile["type"], "skill_md">[] = [
  "reference",
  "script",
  "asset",
  "other",
];

const GROUP_LABELS: Record<string, string> = {
  reference: "References",
  script: "Scripts",
  asset: "Assets",
  other: "Other Files",
};

function buildGroups(files: SkillFile[]): { skillMd: SkillFile | undefined; groups: FileGroup[] } {
  const skillMd = files.find((f) => f.type === "skill_md");
  const groups: FileGroup[] = GROUP_ORDER
    .map((type) => ({ type, label: GROUP_LABELS[type], files: files.filter((f) => f.type === type) }))
    .filter((g) => g.files.length > 0);
  return { skillMd, groups };
}

function isMarkdown(file: SkillFile): boolean {
  return file.type === "skill_md" || file.path.toLowerCase().endsWith(".md");
}

function fileName(path: string): string {
  return path.split("/").pop() || path || "untitled";
}

/* ── Icons ── */

function IconFile({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M9 12h6M9 16h4M6 2h8l4 4v16a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconCode({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M16 18l6-6-6-6M8 6l-6 6 6 6"
        stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconImage({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M21 15l-5-5L5 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function FileIcon({ type }: { type: SkillFile["type"] }) {
  if (type === "script") return <IconCode />;
  if (type === "asset") return <IconImage />;
  return <IconFile />;
}

/* ── Sub-components ── */

function Spinner({ msg }: { msg: string }) {
  return (
    <div className="state-panel">
      <svg className="spinner" width="20" height="20" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5"
          strokeDasharray="50" strokeDashoffset="15" />
      </svg>
      <span>{msg}</span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="state-panel">
      <IconFile size={28} />
      <p className="state-msg">No content found for this skill.</p>
      <p className="state-sub">The skill may not have a version or SKILL.md file yet.</p>
    </div>
  );
}

function Badge({ label, variant }: { label: string; variant: "green" | "blue" | "purple" | "gray" }) {
  return <span className={`badge badge-${variant}`}>{label}</span>;
}

function FileNav({
  skillMd,
  groups,
  selectedPath,
  onSelect,
}: {
  skillMd: SkillFile | undefined;
  groups: FileGroup[];
  selectedPath: string;
  onSelect: (path: string) => void;
}) {
  return (
    <nav className="file-nav">
      {skillMd && (
        <button
          type="button"
          className={`file-nav-row ${selectedPath === skillMd.path ? "file-nav-row-active" : ""}`}
          onClick={() => onSelect(skillMd.path)}
          title={skillMd.path}
        >
          <IconFile />
          <span className="file-nav-name">SKILL.md</span>
        </button>
      )}

      {groups.map((group) => (
        <div key={group.type} className="file-nav-group">
          <div className="file-nav-group-label">{group.label}</div>
          {group.files.map((file) => (
            <button
              key={file.path}
              type="button"
              className={`file-nav-row ${selectedPath === file.path ? "file-nav-row-active" : ""}`}
              onClick={() => onSelect(file.path)}
              title={file.path}
            >
              <FileIcon type={file.type} />
              <span className="file-nav-name">{fileName(file.path)}</span>
            </button>
          ))}
        </div>
      ))}
    </nav>
  );
}

function FileContent({ file }: { file: SkillFile }) {
  if (isMarkdown(file)) {
    return (
      <div className="markdown-body">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{file.content}</ReactMarkdown>
      </div>
    );
  }
  return (
    <pre className="raw-content">{file.content}</pre>
  );
}

/* ── Main app ── */

export default function App() {
  const { entity, portToken, portApiBaseUrl } = usePostMessageData();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);

  const ctx = { baseUrl: portApiBaseUrl ?? "", token: portToken ?? "" };
  const ready = !!portApiBaseUrl && !!portToken && !!entity?.identifier;

  const filesQuery = useQuery({
    queryKey: ["skill-view-files", entity?.identifier, portToken],
    queryFn: () => fetchSkillFiles(ctx, entity!.identifier),
    enabled: ready,
    staleTime: 60 * 1000,
  });

  if (!portApiBaseUrl || !portToken) return <Spinner msg="Connecting to Port…" />;
  if (!entity?.identifier) {
    return (
      <div className="state-panel">
        <p className="state-msg">Embed this widget on a skill entity page.</p>
      </div>
    );
  }
  if (filesQuery.isLoading) return <Spinner msg="Loading skill content…" />;
  if (filesQuery.isError) {
    return (
      <div className="state-panel state-error">
        <p className="state-msg">Failed to load skill content.</p>
        <p className="state-sub">
          {filesQuery.error instanceof Error ? filesQuery.error.message : "Unknown error"}
        </p>
        <button className="retry-btn" onClick={() => void filesQuery.refetch()}>Retry</button>
      </div>
    );
  }

  const files = filesQuery.data ?? [];
  if (files.length === 0) return <EmptyState />;

  const { skillMd, groups } = buildGroups(files);
  const hasSupporting = groups.length > 0;

  // Default selection: SKILL.md, or first file
  const activePath = selectedPath ?? skillMd?.path ?? files[0]?.path ?? "";
  const activeFile = files.find((f) => f.path === activePath) ?? files[0];

  // Metadata from entity properties
  const props = entity.properties ?? {};
  const location = props.location as string | undefined;
  const status = props.status as string | undefined;

  return (
    <div className="viewer">
      {/* Header */}
      <div className="viewer-header">
        <div className="viewer-title">{entity.title ?? entity.identifier}</div>
        <div className="viewer-badges">
          {status === "active"     && <Badge label="Active"     variant="green"  />}
          {status === "deprecated" && <Badge label="Deprecated" variant="gray"   />}
          {status === "draft"      && <Badge label="Draft"      variant="blue"   />}
          {location === "global"   && <Badge label="Global"     variant="purple" />}
          {location === "project"  && <Badge label="Project"    variant="blue"   />}
        </div>
      </div>

      {/* Body: nav + content (nav only shown when supporting files exist) */}
      <div className={`viewer-body ${hasSupporting ? "viewer-body-split" : ""}`}>
        {hasSupporting && (
          <FileNav
            skillMd={skillMd}
            groups={groups}
            selectedPath={activePath}
            onSelect={setSelectedPath}
          />
        )}

        <div className="content-pane">
          {activeFile && <FileContent file={activeFile} />}
        </div>
      </div>
    </div>
  );
}
