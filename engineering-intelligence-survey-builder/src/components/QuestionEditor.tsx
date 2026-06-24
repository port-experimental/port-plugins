import { Field, Select, TextArea, TextInput, Toggle } from "./Field";
import { ChoicesEditor } from "./ChoicesEditor";
import {
  QUESTION_TYPES,
  type Choice,
  type Dimension,
  type Question,
  type QuestionType,
  type Scale,
} from "../types";

type Props = {
  question: Question;
  index: number;
  total: number;
  dimensions: Dimension[];
  scale: Scale;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (patch: Partial<Question>) => void;
  onChangeType: (type: QuestionType) => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
};

const TYPE_LABEL: Record<QuestionType, string> = Object.fromEntries(
  QUESTION_TYPES.map((t) => [t.value, t.label])
) as Record<QuestionType, string>;

const hasChoices = (t: QuestionType) => t === "single_choice" || t === "multi_choice";
const canScore = (t: QuestionType) =>
  t === "likert" || t === "single_choice" || t === "boolean";

export function QuestionEditor({
  question: q,
  index,
  total,
  dimensions,
  scale,
  expanded,
  onToggle,
  onUpdate,
  onChangeType,
  onRemove,
  onMove,
}: Props) {
  const dimName = q.dimension
    ? dimensions.find((d) => d.id === q.dimension)?.name
    : undefined;

  return (
    <div className={`qcard${expanded ? " qcard--open" : ""}`}>
      <div className="qcard__head">
        <button type="button" className="qcard__grip" onClick={onToggle} aria-expanded={expanded}>
          <span className="qcard__num">{index + 1}</span>
          <span className="qcard__summary">
            <span className="qcard__text">{q.text.trim() || <em>Untitled question</em>}</span>
            <span className="qcard__tags">
              <span className="tag">{TYPE_LABEL[q.type]}</span>
              {dimName && <span className="tag tag--dim">{dimName}</span>}
              {q.required && <span className="tag tag--req">required</span>}
              {q.reverse && <span className="tag tag--rev">reverse</span>}
            </span>
          </span>
          <span className="qcard__chev" aria-hidden="true">{expanded ? "▾" : "▸"}</span>
        </button>
        <div className="row-actions">
          <button type="button" className="iconbtn" title="Move up" disabled={index === 0} onClick={() => onMove(-1)}>↑</button>
          <button type="button" className="iconbtn" title="Move down" disabled={index === total - 1} onClick={() => onMove(1)}>↓</button>
          <button type="button" className="iconbtn iconbtn--danger" title="Remove question" onClick={onRemove}>✕</button>
        </div>
      </div>

      {expanded && (
        <div className="qcard__body">
          <Field label="Question text">
            <TextArea
              rows={2}
              value={q.text}
              placeholder="What do you want to ask?"
              onChange={(e) => onUpdate({ text: e.target.value })}
            />
          </Field>

          <div className="grid grid--2">
            <Field label="Type">
              <Select
                value={q.type}
                onChange={(v) => onChangeType(v as QuestionType)}
                options={QUESTION_TYPES.map((t) => ({ value: t.value, label: t.label }))}
              />
            </Field>
            {canScore(q.type) && (
              <Field label="Dimension" hint="Groups this question's score.">
                <Select
                  value={q.dimension ?? ""}
                  onChange={(v) => onUpdate({ dimension: v || undefined })}
                  options={[
                    { value: "", label: "- None -" },
                    ...dimensions.map((d) => ({ value: d.id, label: d.name || d.id })),
                  ]}
                />
              </Field>
            )}
          </div>

          {q.type === "likert" && (
            <p className="muted small">
              Uses the survey scale ({scale.min}–{scale.max}: “{scale.minLabel}” → “{scale.maxLabel}”).
            </p>
          )}
          {q.type === "nps" && (
            <p className="muted small">Fixed 0–10 recommendation scale.</p>
          )}

          {hasChoices(q.type) && (
            <ChoicesEditor
              choices={q.choices ?? []}
              scored={q.type === "single_choice"}
              onChange={(choices: Choice[]) => onUpdate({ choices })}
            />
          )}

          <Field label="Help text" hint="Optional guidance shown under the question.">
            <TextInput
              value={q.helpText ?? ""}
              placeholder="Optional"
              onChange={(e) => onUpdate({ helpText: e.target.value || undefined })}
            />
          </Field>

          <div className="qcard__toggles">
            <Toggle
              checked={!!q.required}
              onChange={(v) => onUpdate({ required: v })}
              label="Required"
            />
            {q.type === "likert" && (
              <Toggle
                checked={!!q.reverse}
                onChange={(v) => onUpdate({ reverse: v })}
                label="Reverse-scored"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
