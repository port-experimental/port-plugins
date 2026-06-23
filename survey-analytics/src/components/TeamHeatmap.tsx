import type { AnalyticsResponse, SurveyDefinition } from "../types";
import { buildHeatmap } from "../utils/aggregations";

type Props = {
  def: SurveyDefinition;
  responses: AnalyticsResponse[];
  /** When set, each cell also shows the change vs this comparison survey. */
  compareResponses?: AnalyticsResponse[];
  compareLabel?: string;
};

/** Map a 0–100 score to a red→amber→green background. */
function cellColor(score: number | null): string {
  if (score == null) return "transparent";
  // 0 → red(0deg), 60 → amber, 100 → green(140deg)
  const hue = Math.round((score / 100) * 140);
  return `hsl(${hue}, 65%, 45%)`;
}

function cellText(score: number | null): string {
  return score == null ? "-" : String(score);
}

function delta(cur: number | null, cmp: number | null | undefined): number | null {
  if (typeof cur !== "number" || typeof cmp !== "number") return null;
  return cur - cmp;
}

function Chip({
  score,
  diff,
  overall,
}: {
  score: number | null;
  diff: number | null;
  overall?: boolean;
}) {
  return (
    <span
      className={`heatmap__chip${overall ? " heatmap__chip--overall" : ""}`}
      style={{ background: cellColor(score) }}
    >
      {cellText(score)}
      {diff != null && diff !== 0 && (
        <span className="heatmap__chip-delta">
          {diff > 0 ? "▲" : "▼"}
          {Math.abs(diff)}
        </span>
      )}
    </span>
  );
}

export function TeamHeatmap({ def, responses, compareResponses, compareLabel }: Props) {
  const { rows, allTeams } = buildHeatmap(def, responses);
  if (allTeams.count === 0) return null;

  const dims = def.dimensions;

  // Compare survey: index its rows by team for per-cell deltas.
  const compare =
    compareResponses && compareResponses.length > 0
      ? buildHeatmap(def, compareResponses)
      : null;
  const compareByTeam = new Map((compare?.rows ?? []).map((r) => [r.team, r]));

  return (
    <div className="section">
      <div className="section__header">
        <h3 className="section__title">Team × dimension heatmap</h3>
        <span className="section__hint muted">
          score 0–100 · “-“ = no responses
          {compare ? ` · ▲▼ vs ${compareLabel ?? "comparison"}` : ""}
        </span>
      </div>

      <div className="heatmap__scroll">
        <table className="heatmap">
          <thead>
            <tr>
              <th className="heatmap__corner">Team</th>
              {dims.map((d) => (
                <th key={d.id} className="heatmap__colhead" title={d.name}>
                  {d.name}
                </th>
              ))}
              <th className="heatmap__colhead heatmap__colhead--overall">Overall</th>
              <th className="heatmap__colhead heatmap__colhead--n">n</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const cmp = compare ? compareByTeam.get(row.team) ?? null : null;
              return (
                <tr key={row.team}>
                  <th className="heatmap__rowhead">{row.team}</th>
                  {dims.map((d) => (
                    <td key={d.id} className="heatmap__cell">
                      <Chip
                        score={row.cells[d.id]}
                        diff={cmp ? delta(row.cells[d.id], cmp.cells[d.id]) : null}
                      />
                    </td>
                  ))}
                  <td className="heatmap__cell">
                    <Chip
                      score={row.overall}
                      diff={cmp ? delta(row.overall, cmp.overall) : null}
                      overall
                    />
                  </td>
                  <td className="heatmap__cell heatmap__n">{row.count}</td>
                </tr>
              );
            })}
            {/* All-teams summary row */}
            <tr className="heatmap__summary">
              <th className="heatmap__rowhead">{allTeams.team}</th>
              {dims.map((d) => (
                <td key={d.id} className="heatmap__cell">
                  <Chip
                    score={allTeams.cells[d.id]}
                    diff={compare ? delta(allTeams.cells[d.id], compare.allTeams.cells[d.id]) : null}
                  />
                </td>
              ))}
              <td className="heatmap__cell">
                <Chip
                  score={allTeams.overall}
                  diff={compare ? delta(allTeams.overall, compare.allTeams.overall) : null}
                  overall
                />
              </td>
              <td className="heatmap__cell heatmap__n">{allTeams.count}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
