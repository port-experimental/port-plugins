import { useState } from "react";
import { QuestionEditor } from "./QuestionEditor";
import {
  QUESTION_TYPES,
  type Dimension,
  type Question,
  type QuestionType,
  type Scale,
} from "../types";

type Props = {
  questions: Question[];
  dimensions: Dimension[];
  scale: Scale;
  onUpdate: (index: number, patch: Partial<Question>) => void;
  onChangeType: (index: number, type: QuestionType) => void;
  onAdd: (type: QuestionType) => string; // returns the new question id
  onRemove: (index: number) => void;
  onMove: (index: number, dir: -1 | 1) => void;
};

export function QuestionsEditor({
  questions,
  dimensions,
  scale,
  onUpdate,
  onChangeType,
  onAdd,
  onRemove,
  onMove,
}: Props) {
  // Open as a collapsed outline; expand a question on demand (a newly-added one
  // auto-expands). Avoids dumping every editor open on a long survey.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addType, setAddType] = useState<QuestionType>("likert");

  const add = () => {
    const id = onAdd(addType);
    setExpandedId(id); // open the freshly-added question
  };

  return (
    <div className="section">
      {questions.length === 0 && (
        <div className="empty-inline">
          No questions yet - add your first one below.
        </div>
      )}

      <div className="qlist">
        {questions.map((q, i) => (
          <QuestionEditor
            key={q.id}
            question={q}
            index={i}
            total={questions.length}
            dimensions={dimensions}
            scale={scale}
            expanded={expandedId === q.id}
            onToggle={() => setExpandedId((cur) => (cur === q.id ? null : q.id))}
            onUpdate={(patch) => onUpdate(i, patch)}
            onChangeType={(t) => onChangeType(i, t)}
            onRemove={() => {
              if (expandedId === q.id) setExpandedId(null);
              onRemove(i);
            }}
            onMove={(dir) => onMove(i, dir)}
          />
        ))}
      </div>

      <div className="qadd">
        <select
          className="select"
          value={addType}
          onChange={(e) => setAddType(e.target.value as QuestionType)}
          aria-label="New question type"
        >
          {QUESTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label} - {t.hint}
            </option>
          ))}
        </select>
        <button type="button" className="btn btn--cta" onClick={add}>
          + Add question
        </button>
      </div>
    </div>
  );
}
