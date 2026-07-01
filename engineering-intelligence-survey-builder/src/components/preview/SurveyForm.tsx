import { useMemo, useState, type FormEvent } from "react";
import { isAnswered, missingRequired, scaleFor } from "../../scoring";
import type { Answers, AnswerValue, Question, SurveyDefinition } from "../../types";
import { ErrorBanner } from "../ErrorBanner";
import { QuestionField } from "./QuestionField";

type Props = {
  definition: SurveyDefinition;
  respondentLabel: string;
  submitting: boolean;
  errorMessage?: string;
  onSubmit: (answers: Answers) => void;
};

type Group = {
  key: string;
  name?: string;
  description?: string;
  color?: string;
  questions: Question[];
};

export function SurveyForm({
  definition,
  respondentLabel,
  submitting,
  errorMessage,
  onSubmit,
}: Props) {
  const [answers, setAnswers] = useState<Answers>({});
  const [showErrors, setShowErrors] = useState(false);

  const setAnswer = (id: string, v: AnswerValue) =>
    setAnswers((a) => ({ ...a, [id]: v }));

  const total = definition.questions.length;
  const answeredCount = definition.questions.filter((q) =>
    isAnswered(q, answers[q.id] ?? null)
  ).length;

  const missing = useMemo(
    () => new Set(missingRequired(definition, answers).map((q) => q.id)),
    [definition, answers]
  );
  const groups = useMemo(() => buildGroups(definition), [definition]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (missing.size > 0) {
      setShowErrors(true);
      return;
    }
    onSubmit(answers);
  };

  return (
    <form className="survey" onSubmit={handleSubmit}>
      {definition.description && (
        <p className="survey__intro">{definition.description}</p>
      )}

      {groups.map((g) => (
        <section key={g.key} className="group">
          {g.name && (
            <header className="group__head">
              <h3 className="group__title">
                {g.color && (
                  <span
                    className="group__dot"
                    style={{ ["--dot" as string]: g.color } as object}
                    aria-hidden="true"
                  />
                )}
                {g.name}
              </h3>
              {g.description && <p className="group__desc">{g.description}</p>}
            </header>
          )}
          <div className="group__questions">
            {g.questions.map((q) => (
              <QuestionField
                key={q.id}
                question={q}
                scale={scaleFor(definition, q)}
                value={answers[q.id] ?? null}
                invalid={showErrors && missing.has(q.id)}
                onChange={(v) => setAnswer(q.id, v)}
              />
            ))}
          </div>
        </section>
      ))}

      {errorMessage && (
        <ErrorBanner title="Could not submit your response" message={errorMessage} />
      )}

      <footer className="survey__footer">
        <div className="progress" aria-hidden="true">
          <div className="progress__track">
            <span
              className="progress__fill"
              style={{ width: `${total ? (answeredCount / total) * 100 : 0}%` }}
            />
          </div>
        </div>
        <div className="survey__actions">
          <span className="muted">
            {answeredCount}/{total} answered · {respondentLabel}
          </span>
          <button type="submit" className="btn btn--primary" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit response"}
          </button>
        </div>
        {showErrors && missing.size > 0 && (
          <p className="survey__hint" role="alert">
            {missing.size} required question
            {missing.size === 1 ? "" : "s"} still need an answer.
          </p>
        )}
      </footer>
    </form>
  );
}

/** Group questions under their dimension; dimensionless ones go to "Wrap-up". */
function buildGroups(def: SurveyDefinition): Group[] {
  const byDim = new Map<string, Question[]>();
  const general: Question[] = [];

  for (const q of def.questions) {
    const dim = q.dimension && def.dimensions.some((d) => d.id === q.dimension)
      ? q.dimension
      : null;
    if (dim) {
      (byDim.get(dim) ?? byDim.set(dim, []).get(dim)!).push(q);
    } else {
      general.push(q);
    }
  }

  const groups: Group[] = [];
  for (const d of def.dimensions) {
    const qs = byDim.get(d.id);
    if (qs && qs.length) {
      groups.push({
        key: d.id,
        name: d.name,
        description: d.description,
        color: d.color,
        questions: qs,
      });
    }
  }
  if (general.length) {
    // Only label the leftover questions "Wrap-up" when there are real dimension
    // sections above them. If they are the whole survey, show no section header.
    const name = groups.length > 0 ? "Wrap-up" : undefined;
    groups.push({ key: "_general", name, questions: general });
  }
  return groups;
}
