import React from "react";
import { FileCode2, FileText, Image, Paperclip, Plus, Trash2 } from "lucide-react";
import { FILE_TYPE_META } from "../constants";
import type { SkillFile, SkillFileType } from "../types";

type Props = {
  files: SkillFile[];
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: (type: Exclude<SkillFileType, "skill_md">) => void;
  onRemove: (id: string) => void;
};

const GROUPS: Exclude<SkillFileType, "skill_md">[] = [
  "reference",
  "script",
  "asset",
  "other",
];

function iconFor(type: SkillFileType) {
  switch (type) {
    case "script":
      return FileCode2;
    case "asset":
      return Image;
    case "other":
      return Paperclip;
    default:
      return FileText;
  }
}

export function FileManager({ files, selectedId, onSelect, onAdd, onRemove }: Props) {
  const skillMd = files.find((f) => f.type === "skill_md");

  return (
    <div className="file-manager">
      {skillMd && (
        <FileRow
          file={skillMd}
          selected={skillMd.id === selectedId}
          onSelect={onSelect}
        />
      )}

      {GROUPS.map((type) => {
        const groupFiles = files.filter((f) => f.type === type);
        return (
          <div key={type} className="file-group">
            <div className="file-group-head">
              <span className="file-group-label">{FILE_TYPE_META[type].plural}</span>
              <button
                type="button"
                className="icon-btn"
                title={`Add ${FILE_TYPE_META[type].label.toLowerCase()}`}
                aria-label={`Add ${FILE_TYPE_META[type].label.toLowerCase()}`}
                onClick={() => onAdd(type)}
              >
                <Plus size={14} aria-hidden />
              </button>
            </div>
            {groupFiles.map((file) => (
              <FileRow
                key={file.id}
                file={file}
                selected={file.id === selectedId}
                onSelect={onSelect}
                onRemove={onRemove}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function FileRow({
  file,
  selected,
  onSelect,
  onRemove,
}: {
  file: SkillFile;
  selected: boolean;
  onSelect: (id: string) => void;
  onRemove?: (id: string) => void;
}) {
  const Icon = iconFor(file.type);
  const name = file.path.split("/").pop() || file.path || "untitled";
  return (
    <div className={selected ? "file-row selected" : "file-row"}>
      <button type="button" className="file-row-main" onClick={() => onSelect(file.id)}>
        <Icon size={14} aria-hidden className="file-row-icon" />
        <span className="file-row-name" title={file.path}>
          {name}
        </span>
      </button>
      {onRemove && (
        <button
          type="button"
          className="icon-btn icon-btn-danger"
          title="Remove file"
          aria-label={`Remove ${name}`}
          onClick={() => onRemove(file.id)}
        >
          <Trash2 size={13} aria-hidden />
        </button>
      )}
    </div>
  );
}
