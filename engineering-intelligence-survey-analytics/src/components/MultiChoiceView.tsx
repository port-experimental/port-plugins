import type { MultiChoiceDetail } from "../types";

type Props = {
  details: MultiChoiceDetail[];
  /** Same questions aggregated for the "Compare with" survey, for pp deltas. */
  compareDetails?: MultiChoiceDetail[];
  /** Title of the compare survey (used in the delta tooltip). */
  compareLabel?: string;
  /** Active team filter, shown as a scope chip when set. */
  teamLabel?: string;
};

/**
 * Multi-select questions ("select all that apply") carry no score, so they're
 * absent from "Questions ranked by score". This is their sibling section on the
 * Overview: per option, how many respondents picked it and what share that is.
 * When a compare survey is selected, each option also shows the percentage-point
 * change vs that survey. Renders nothing when no multi-select question has been
 * answered.
 */
export function MultiChoiceView({
  details,
  compareDetails,
  compareLabel,
  teamLabel,
}: Props) {
  const answered = details.filter((d) => d.respondents > 0);
  if (answered.length === 0) return null;

  // questionId -> (optionValue -> pct) for the compare survey. Only questions
  // the compare survey actually answered get a baseline (else no delta shown).
  const comparePct = new Map<string, Map<string, number>>();
  for (const d of compareDetails ?? []) {
    if (d.respondents === 0) continue;
    comparePct.set(d.questionId, new Map(d.options.map((o) => [o.value, o.pct])));
  }

  return (
    <div className="section">
      <div className="section__header">
        <h3 className="section__title">Multi-select responses</h3>
        {teamLabel && <span className="section__hint muted">{teamLabel}</span>}
      </div>

      {answered.map((d) => {
        const base = comparePct.get(d.questionId);
        return (
          <div key={d.questionId} className="mc-q">
            <div className="mc-q__head">
              <span className="mc-q__text" title={d.questionText}>
                {d.questionText}
              </span>
              <span className="mc-q__meta muted">
                {d.dimensionName ? `${d.dimensionName} · ` : ""}
                {d.respondents}{" "}
                {d.respondents === 1 ? "respondent" : "respondents"}
              </span>
            </div>

            <div className="mc-list">
              {d.options.map((o) => {
                const delta = base ? o.pct - (base.get(o.value) ?? 0) : null;
                return (
                  <div key={o.value} className="mc-row">
                    <span className="mc-row__label" title={o.label}>
                      {o.label}
                    </span>
                    <div className="mc-row__track">
                      <span
                        className="mc-row__fill"
                        style={{ width: `${o.pct}%` }}
                      />
                    </div>
                    <span className="mc-row__val">
                      {o.count} · {o.pct}%
                    </span>
                    {delta != null && delta !== 0 ? (
                      <span
                        className={`mc-row__delta ${delta > 0 ? "delta--up" : "delta--down"}`}
                        title={compareLabel ? `vs ${compareLabel}` : undefined}
                      >
                        {delta > 0 ? "↑" : "↓"} {Math.abs(delta)}pp
                      </span>
                    ) : (
                      base && (
                        <span
                          className="mc-row__delta mc-row__delta--flat muted"
                          title={compareLabel ? `vs ${compareLabel}` : undefined}
                        >
                          0pp
                        </span>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
