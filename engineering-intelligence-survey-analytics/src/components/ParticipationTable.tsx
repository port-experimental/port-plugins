import type { AnalyticsResponse } from "../types";
import { buildParticipation } from "../utils/aggregations";

type Props = {
  responses: AnalyticsResponse[];
  targets: Record<string, number> | undefined;
};

function rateColor(rate: number | null): string {
  if (rate == null) return "var(--text-faint)";
  if (rate >= 70) return "#10b981";
  if (rate >= 40) return "#f59e0b";
  return "#ef4444";
}

export function ParticipationTable({ responses, targets }: Props) {
  const { rows, totalResponses, totalTarget } = buildParticipation(
    responses,
    targets
  );
  if (rows.length === 0) return null;

  const totalRate =
    totalTarget && totalTarget > 0
      ? Math.round((totalResponses / totalTarget) * 100)
      : null;

  return (
    <div className="section">
      <div className="section__header">
        <h3 className="section__title">Participation by team</h3>
        {totalRate != null && (
          <span className="section__hint muted">
            {totalResponses}/{totalTarget} overall · {totalRate}%
          </span>
        )}
      </div>

      <div className="part-table">
        {rows.map((r) => (
          <div key={r.team} className="part-row">
            <span className="part-row__team">{r.team}</span>
            <span className="part-row__count">
              {r.responses}
              {r.target != null ? ` / ${r.target}` : ""}
            </span>
            <div className="part-row__track">
              <span
                className="part-row__fill"
                style={{
                  width: `${Math.min(100, r.rate ?? (r.responses > 0 ? 100 : 0))}%`,
                  background: rateColor(r.rate),
                }}
              />
            </div>
            <span
              className="part-row__rate"
              style={{ color: rateColor(r.rate) }}
            >
              {r.rate != null ? `${r.rate}%` : "-"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
