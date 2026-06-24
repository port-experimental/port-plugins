import type { AnalyticsResponse, DistBucket, SurveyDefinition } from "../types";
import { aggregateQuestions, scoreDelta } from "../utils/aggregations";

type Props = {
  def: SurveyDefinition;
  responses: AnalyticsResponse[];
  /** When set, each question also shows its change vs this comparison survey. */
  compareResponses?: AnalyticsResponse[];
};

function scoreColor(score: number | null): string {
  if (score == null) return "var(--border)";
  if (score >= 70) return "#10b981";
  if (score >= 50) return "#f59e0b";
  return "#ef4444";
}

const TONE_COLOR: Record<DistBucket["tone"], string> = {
  "very-low": "#ef4444",
  low:        "#f59e0b",
  mid:        "#eab308",
  high:       "#4ade80",
  "very-high":"#10b981",
};

export function QuestionRanking({ def, responses, compareResponses }: Props) {
  const ranked = aggregateQuestions(def, responses);
  const hasAnswers = responses.some((r) => r.answers);
  if (ranked.length === 0 || !hasAnswers) return null;

  // Per-question score from the comparison survey, for a vs-compare delta.
  const compareScores =
    compareResponses && compareResponses.length > 0
      ? new Map(aggregateQuestions(def, compareResponses).map((q) => [q.questionId, q.avgScore]))
      : null;

  return (
    <div className="section">
      <div className="section__header">
        <h3 className="section__title">Questions ranked by score</h3>
        <div className="q-legend">
          {(
            [
              { tone: "very-low", label: "Poor" },
              { tone: "low",      label: "Below avg" },
              { tone: "mid",      label: "Average" },
              { tone: "high",     label: "Good" },
              { tone: "very-high",label: "Excellent" },
            ] as { tone: DistBucket["tone"]; label: string }[]
          ).map(({ tone, label }) => (
            <span key={tone} className="q-legend__item">
              <span
                className="q-legend__swatch"
                style={{ background: TONE_COLOR[tone] }}
              />
              <span className="q-legend__label">{label}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="q-list">
        {ranked.map((q, i) => (
          <div key={q.questionId} className="q-row">
            <span className="q-row__rank">{i + 1}</span>
            <div className="q-row__body">
              <div className="q-row__top">
                <span className="q-row__text" title={q.questionText}>
                  {q.questionText}
                </span>
                <span className="q-row__score-group">
                  <span
                    className="q-row__score"
                    style={{ color: scoreColor(q.avgScore) }}
                  >
                    {q.avgScore != null ? q.avgScore : "-"}
                  </span>
                  {(() => {
                    const d = compareScores
                      ? scoreDelta(q.avgScore, compareScores.get(q.questionId) ?? null)
                      : null;
                    return d != null && d !== 0 ? (
                      <span className={`q-row__delta ${d > 0 ? "delta--up" : "delta--down"}`}>
                        {d > 0 ? "↑" : "↓"} {Math.abs(d)}
                      </span>
                    ) : null;
                  })()}
                </span>
              </div>
              {q.buckets.length > 0 && (
                <div className="q-dist-wrap">
                  <div
                    className="q-dist"
                    role="img"
                    aria-label="Answer distribution"
                  >
                    {q.buckets.map((b) => (
                      <span
                        key={b.label}
                        className="q-dist__seg"
                        style={{
                          width: `${b.pct}%`,
                          background: TONE_COLOR[b.tone],
                        }}
                        title={`${b.label}: ${b.count} (${b.pct}%)`}
                      >
                        {b.pct >= 12 && q.type === "likert" ? `${b.label}` : ""}
                      </span>
                    ))}
                  </div>
                  {q.type === "single_choice" && (
                    <div className="q-dist__choice-labels">
                      {q.buckets.map((b) => (
                        <span
                          key={b.label}
                          className="q-dist__choice-label"
                          style={{ width: `${b.pct}%` }}
                          title={`${b.label}: ${b.count} (${b.pct}%)`}
                        >
                          {b.pct >= 8 ? (b.shortLabel ?? b.label) : ""}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="q-row__meta">
                {q.dimensionName && (
                  <span className="q-row__dim">{q.dimensionName}</span>
                )}
                {q.reverse && (
                  <span className="q-row__reverse" title="Lower agreement = better score">
                    ↺ reverse scored
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
