import type { CSSProperties } from "react";
import type { AnswerValue, Question, Scale } from "../types";

type Props = {
  question: Question;
  scale: Scale;
  value: AnswerValue;
  invalid?: boolean;
  onChange: (value: AnswerValue) => void;
};

/** Renders the appropriate control for any question type - the core of the
 *  dynamic, definition-driven form. */
export function QuestionField({ question, scale, value, invalid, onChange }: Props) {
  const q = question;
  return (
    <fieldset className={`question${invalid ? " question--invalid" : ""}`}>
      <legend className="question__text">
        {q.text}
        {q.required && (
          <span className="question__req" aria-hidden="true">
            {" "}
            *
          </span>
        )}
      </legend>
      {q.helpText && <p className="question__help">{q.helpText}</p>}
      <div className="question__control">
        <Control question={q} scale={scale} value={value} onChange={onChange} />
      </div>
      {invalid && (
        <p className="question__error" role="alert">
          Please answer this question.
        </p>
      )}
    </fieldset>
  );
}

function Control({ question: q, scale, value, onChange }: Omit<Props, "invalid">) {
  switch (q.type) {
    case "likert":
      return (
        <ScaleButtons
          min={scale.min}
          max={scale.max}
          minLabel={scale.minLabel}
          maxLabel={scale.maxLabel}
          value={typeof value === "number" ? value : null}
          onChange={(n) => onChange(n)}
        />
      );
    case "nps":
      return (
        <ScaleButtons
          min={0}
          max={10}
          minLabel="Not at all likely"
          maxLabel="Extremely likely"
          value={typeof value === "number" ? value : null}
          onChange={(n) => onChange(n)}
        />
      );
    case "boolean":
      return (
        <div className="choices choices--inline">
          {[
            { v: true, label: "Yes" },
            { v: false, label: "No" },
          ].map((opt) => (
            <button
              key={opt.label}
              type="button"
              className={`chip${value === opt.v ? " chip--on" : ""}`}
              aria-pressed={value === opt.v}
              onClick={() => onChange(opt.v)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );
    case "single_choice":
      return (
        <div className="choices">
          {(q.choices ?? []).map((c) => (
            <label key={c.value} className="choice">
              <input
                type="radio"
                name={q.id}
                checked={value === c.value}
                onChange={() => onChange(c.value)}
              />
              <span>{c.label}</span>
            </label>
          ))}
        </div>
      );
    case "multi_choice": {
      const selected = Array.isArray(value) ? value : [];
      return (
        <div className="choices">
          {(q.choices ?? []).map((c) => {
            const on = selected.includes(c.value);
            return (
              <label key={c.value} className="choice">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() =>
                    onChange(
                      on
                        ? selected.filter((v) => v !== c.value)
                        : [...selected, c.value]
                    )
                  }
                />
                <span>{c.label}</span>
              </label>
            );
          })}
        </div>
      );
    }
    case "text":
      return (
        <textarea
          className="textarea"
          rows={3}
          value={typeof value === "string" ? value : ""}
          placeholder="Type your answer…"
          onChange={(e) => onChange(e.target.value)}
        />
      );
    default:
      return null;
  }
}

function ScaleButtons({
  min,
  max,
  minLabel,
  maxLabel,
  value,
  onChange,
}: {
  min: number;
  max: number;
  minLabel: string;
  maxLabel: string;
  value: number | null;
  onChange: (n: number) => void;
}) {
  const points: number[] = [];
  for (let i = min; i <= max; i++) points.push(i);
  return (
    <div className="scale">
      <div className="scale__buttons" role="radiogroup">
        {points.map((n) => {
          // Position 0..1 across the scale → hue 0 (red) … 140 (green).
          // A subtle tint so the scale reads as a low→high continuum.
          const frac = max > min ? (n - min) / (max - min) : 0.5;
          const hue = Math.round(frac * 140);
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              className={`scale__btn${value === n ? " scale__btn--on" : ""}`}
              style={
                {
                  "--tint-bg": `hsla(${hue}, 60%, 50%, 0.10)`,
                  "--tint-bd": `hsla(${hue}, 60%, 45%, 0.32)`,
                } as CSSProperties
              }
              onClick={() => onChange(n)}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="scale__labels">
        <span>{minLabel}</span>
        <span>{maxLabel}</span>
      </div>
    </div>
  );
}
