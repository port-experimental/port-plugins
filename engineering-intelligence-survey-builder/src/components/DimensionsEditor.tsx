import { TextArea, TextInput } from "./Field";
import type { Dimension } from "../types";

type Props = {
  dimensions: Dimension[];
  onUpdate: (index: number, patch: Partial<Dimension>) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  onMove: (index: number, dir: -1 | 1) => void;
  atMax?: boolean;
};

export function DimensionsEditor({
  dimensions,
  onUpdate,
  onAdd,
  onRemove,
  onMove,
  atMax,
}: Props) {
  return (
    <div className="section">
      <p className="muted small">
        Dimensions group questions for scoring (e.g. "Satisfaction"). Map each
        rating question to a dimension to get a per-dimension score. Surveys can
        also have no dimensions - questions then appear under "Wrap-up".
      </p>

      {dimensions.length === 0 && (
        <div className="empty-inline">No dimensions yet.</div>
      )}

      <div className="dim-list">
        {dimensions.map((d, i) => (
          <div key={d.id} className="dim-row">
            <span
              className="dim-row__dot"
              style={{ background: d.color || "#888" }}
              aria-hidden="true"
            />
            <div className="dim-row__fields">
              <div className="grid grid--name-color">
                <TextInput
                  value={d.name}
                  placeholder="Dimension name"
                  onChange={(e) => onUpdate(i, { name: e.target.value })}
                />
                <input
                  type="color"
                  className="color"
                  value={d.color || "#6366f1"}
                  onChange={(e) => onUpdate(i, { color: e.target.value })}
                  aria-label="Dimension color"
                />
              </div>
              <TextArea
                rows={2}
                value={d.description || ""}
                placeholder="Optional description"
                onChange={(e) => onUpdate(i, { description: e.target.value })}
              />
            </div>
            <div className="row-actions">
              <button
                type="button"
                className="iconbtn"
                title="Move up"
                disabled={i === 0}
                onClick={() => onMove(i, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="iconbtn"
                title="Move down"
                disabled={i === dimensions.length - 1}
                onClick={() => onMove(i, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                className="iconbtn iconbtn--danger"
                title="Remove dimension"
                onClick={() => onRemove(i)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn--ghost" onClick={onAdd} disabled={atMax}>
        + Add dimension
      </button>
      {atMax && (
        <p className="muted small" style={{ marginTop: 6 }}>
          Maximum of 8 dimensions reached.
        </p>
      )}
    </div>
  );
}
