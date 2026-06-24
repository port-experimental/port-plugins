import { useState } from "react";
import type { AnalyticsResponse, SurveyDefinition } from "../types";

type Props = {
  responses: AnalyticsResponse[];
  def: SurveyDefinition;
};

const PAGE_SIZE = 10;

export function ResponsesTable({ responses, def }: Props) {
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const sorted = [...responses].sort(
    (a, b) =>
      new Date(b.submittedAt ?? 0).getTime() -
      new Date(a.submittedAt ?? 0).getTime()
  );

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const visible = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (responses.length === 0) return null;

  const hasTeams = responses.some((r) => r.team);
  const hasAnswers = responses.some((r) => r.answers);

  const textQuestions = def.questions.filter((q) => q.type === "text");

  return (
    <div className="section">
      <div className="section__header">
        <h3 className="section__title">Response log</h3>
        <span className="section__hint muted">{responses.length} responses</span>
      </div>

      <div className="resp-table">
        <div className="resp-head">
          <span className="resp-col resp-col--date">Date</span>
          {hasTeams && <span className="resp-col resp-col--team">Team</span>}
          <span className="resp-col resp-col--score">Score</span>
          {hasAnswers && textQuestions.length > 0 && (
            <span className="resp-col resp-col--expand" />
          )}
        </div>

        {visible.map((r) => {
          const isExpanded = expanded.has(r.identifier);
          const textAnswers = textQuestions
            .map((q) => ({
              question: q.text,
              answer: r.answers?.[q.id],
            }))
            .filter((a) => a.answer && String(a.answer).trim());

          return (
            <div key={r.identifier} className="resp-row-wrapper">
              <div
                className={`resp-row ${isExpanded ? "resp-row--expanded" : ""}`}
                onClick={() => hasAnswers && textAnswers.length > 0 && toggle(r.identifier)}
                style={{ cursor: hasAnswers && textAnswers.length > 0 ? "pointer" : "default" }}
              >
                <span className="resp-col resp-col--date">
                  {r.submittedAt ? formatDate(r.submittedAt) : "-"}
                </span>
                {hasTeams && (
                  <span className="resp-col resp-col--team">
                    {r.team ? <span className="team-tag">{r.team}</span> : <span className="muted">-</span>}
                  </span>
                )}
                <span className="resp-col resp-col--score">
                  {r.overallScore != null ? (
                    <span
                      className="score-pill"
                      style={{ background: scoreBackground(r.overallScore) }}
                    >
                      {r.overallScore}
                    </span>
                  ) : (
                    <span className="muted">-</span>
                  )}
                </span>
                {hasAnswers && textQuestions.length > 0 && (
                  <span className="resp-col resp-col--expand">
                    {textAnswers.length > 0 && (
                      <button
                        type="button"
                        className="expand-btn"
                        onClick={(e) => { e.stopPropagation(); toggle(r.identifier); }}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                      >
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    )}
                  </span>
                )}
              </div>

              {isExpanded && textAnswers.length > 0 && (
                <div className="resp-detail">
                  {textAnswers.map(({ question, answer }) => (
                    <div key={question} className="resp-detail__row">
                      <div className="resp-detail__question">{question}</div>
                      <div className="resp-detail__answer">{String(answer)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ← Prev
          </button>
          <span className="pagination__info muted">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function scoreBackground(score: number): string {
  if (score >= 70) return "rgba(16,185,129,0.15)";
  if (score >= 50) return "rgba(245,158,11,0.15)";
  return "rgba(239,68,68,0.15)";
}
