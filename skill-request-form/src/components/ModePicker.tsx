import { useRef } from "react";
import { FileUp, PencilLine, RefreshCw, Sparkles } from "lucide-react";

type Props = {
  onWrite: () => void;
  onAi: () => void;
  onUpload: (content: string, fileName: string) => void;
  onUpdate: () => void;
};

export function ModePicker({ onWrite, onAi, onUpload, onUpdate }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    const text = await file.text();
    onUpload(text, file.name);
  };

  return (
    <div className="picker">
      <div>
        <h2 className="picker-title">Skill Request</h2>
        <p className="muted-block">
          Create a new skill or update an existing one. You can review and edit
          everything before submitting it for approval.
        </p>
      </div>

      <div className="picker-grid">
        <button type="button" className="picker-card" onClick={onAi}>
          <span className="picker-icon picker-icon-ai">
            <Sparkles size={20} aria-hidden />
          </span>
          <span className="picker-card-title">Create with AI</span>
          <span className="picker-card-desc">
            Describe what the skill should do and let Port AI draft it.
          </span>
        </button>

        <button type="button" className="picker-card" onClick={onWrite}>
          <span className="picker-icon picker-icon-write">
            <PencilLine size={20} aria-hidden />
          </span>
          <span className="picker-card-title">Write it myself</span>
          <span className="picker-card-desc">
            Start from a template and author the SKILL.md by hand.
          </span>
        </button>

        <button
          type="button"
          className="picker-card"
          onClick={() => fileRef.current?.click()}
        >
          <span className="picker-icon picker-icon-upload">
            <FileUp size={20} aria-hidden />
          </span>
          <span className="picker-card-title">Upload a SKILL.md</span>
          <span className="picker-card-desc">
            Already have a skill file? Upload it and add supporting files.
          </span>
        </button>

        <button type="button" className="picker-card" onClick={onUpdate}>
          <span className="picker-icon picker-icon-update">
            <RefreshCw size={20} aria-hidden />
          </span>
          <span className="picker-card-title">Update existing skill</span>
          <span className="picker-card-desc">
            Search for an existing skill, edit its files, and propose changes.
          </span>
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept=".md,.markdown,text/markdown,text/plain"
        className="visually-hidden"
        onChange={(e) => {
          void handleFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
