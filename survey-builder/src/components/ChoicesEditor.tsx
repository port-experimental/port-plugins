import { TextInput } from "./Field";
import { shortId } from "../utils/draft";
import type { Choice } from "../types";

type Props = {
  choices: Choice[];
  /** Whether to expose a per-choice score input (single_choice only). */
  scored: boolean;
  onChange: (choices: Choice[]) => void;
};

export function ChoicesEditor({ choices, scored, onChange }: Props) {
  const update = (i: number, patch: Partial<Choice>) =>
    onChange(choices.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));

  const remove = (i: number) => onChange(choices.filter((_, idx) => idx !== i));

  const add = () =>
    onChange([
      ...choices,
      { value: `opt-${shortId()}`, label: `Option ${choices.length + 1}` },
    ]);

  return (
    <div className="choices-editor">
      <div className="choices-editor__head">
        <span>Choices</span>
        {scored && <span className="choices-editor__scorehead">Score</span>}
      </div>
      {choices.map((c, i) => (
        <div key={c.value} className={`choice-row${scored ? " choice-row--scored" : ""}`}>
          <TextInput
            value={c.label}
            placeholder={`Option ${i + 1}`}
            onChange={(e) => update(i, { label: e.target.value })}
          />
          {scored && (
            <TextInput
              type="number"
              className="input input--num"
              value={typeof c.score === "number" ? c.score : ""}
              placeholder="-"
              title="Higher score = more favorable. Leave blank to keep this choice unscored."
              onChange={(e) =>
                update(i, {
                  score: e.target.value === "" ? undefined : Number(e.target.value),
                })
              }
            />
          )}
          <button
            type="button"
            className="iconbtn iconbtn--danger"
            title="Remove choice"
            disabled={choices.length <= 1}
            onClick={() => remove(i)}
          >
            ✕
          </button>
        </div>
      ))}
      <button type="button" className="btn btn--ghost btn--sm" onClick={add}>
        + Add choice
      </button>
    </div>
  );
}
