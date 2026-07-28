import type { SurveyMeta } from "../types";

type Props = {
  surveys: SurveyMeta[];
  frameworks: string[];
  frameworkFilter: string;
  primaryId: string | null;
  compareId: string | null;
  teamFilter: string;
  allTeams: string[];
  onFramework: (fw: string) => void;
  onPrimary: (id: string) => void;
  onCompare: (id: string) => void;
  onTeam: (team: string) => void;
};

function fmtMonthYear(iso: string | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function surveyLabel(s: SurveyMeta): string {
  const date = fmtMonthYear(s.publishedAt ?? s.createdAt);
  const base = date ? `${s.title} · ${date}` : s.title;
  return s.status === "closed" ? `${base} (closed)` : base;
}

export function FilterBar({
  surveys,
  frameworks,
  frameworkFilter,
  primaryId,
  compareId,
  teamFilter,
  allTeams,
  onFramework,
  onPrimary,
  onCompare,
  onTeam,
}: Props) {
  const sorted = [...surveys].sort(
    (a, b) =>
      new Date(b.publishedAt ?? b.createdAt ?? 0).getTime() -
      new Date(a.publishedAt ?? a.createdAt ?? 0).getTime()
  );

  return (
    <div className="filter-bar">
      {frameworks.length > 0 && (
        <div className="filter-group">
          <label className="filter-label" htmlFor="fb-framework">
            Framework
          </label>
          <select
            id="fb-framework"
            className="filter-select"
            value={frameworkFilter}
            onChange={(e) => onFramework(e.target.value)}
          >
            <option value="">All frameworks</option>
            {frameworks.map((fw) => (
              <option key={fw} value={fw}>
                {fw}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="filter-group">
        <label className="filter-label" htmlFor="fb-primary">
          Survey
        </label>
        <select
          id="fb-primary"
          className="filter-select"
          value={primaryId ?? ""}
          onChange={(e) => onPrimary(e.target.value)}
        >
          <option value="" disabled>
            Select a survey…
          </option>
          {sorted.map((s) => (
            <option key={s.identifier} value={s.identifier}>
              {surveyLabel(s)}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <label className="filter-label" htmlFor="fb-compare">
          Compare with
        </label>
        <select
          id="fb-compare"
          className="filter-select"
          value={compareId ?? ""}
          onChange={(e) => onCompare(e.target.value)}
          disabled={!primaryId}
        >
          <option value="">None</option>
          {sorted
            .filter((s) => s.identifier !== primaryId)
            .map((s) => (
              <option key={s.identifier} value={s.identifier}>
                {surveyLabel(s)}
              </option>
            ))}
        </select>
      </div>

      {allTeams.length > 0 && (
        <div className="filter-group">
          <label className="filter-label" htmlFor="fb-team">
            Team
          </label>
          <select
            id="fb-team"
            className="filter-select"
            value={teamFilter}
            onChange={(e) => onTeam(e.target.value)}
          >
            <option value="">All teams</option>
            {allTeams.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
