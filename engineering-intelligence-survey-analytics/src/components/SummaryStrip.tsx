import { scoreDelta } from "../utils/aggregations";

type Props = {
  count: number;
  overall: number | null;
  avgPerTeam: number | null;
  teamsResponded?: number;
  teamsTotal?: number;
  weakestDim?: { name: string; score: number } | null;
  compareOverall?: number | null;
  compareLabel?: string;
};

export function SummaryStrip({
  count,
  overall,
  avgPerTeam,
  teamsResponded,
  teamsTotal,
  weakestDim,
  compareOverall,
  compareLabel,
}: Props) {
  // Deltas only appear when the user picks a survey in "Compare with".
  const isCompare = compareOverall != null;
  const overallDelta = isCompare ? scoreDelta(overall, compareOverall ?? null) : null;

  const teamsValue =
    teamsResponded != null && teamsTotal != null && teamsTotal > teamsResponded
      ? `${teamsResponded} / ${teamsTotal}`
      : teamsResponded != null
        ? `${teamsResponded}`
        : null;

  return (
    <div className="summary-strip">
      <KpiCard label="Responses" value={String(count)} />
      <KpiCard
        label="Overall score"
        value={overall != null ? String(overall) : "-"}
        suffix={overall != null ? "/100" : undefined}
        deltaRaw={overallDelta}
        compareLabel={compareLabel}
      />
      {avgPerTeam != null && (
        <KpiCard
          label="Avg / team"
          value={Number.isInteger(avgPerTeam) ? String(avgPerTeam) : avgPerTeam.toFixed(1)}
        />
      )}
      {teamsValue != null && (
        <KpiCard label="Teams responded" value={teamsValue} />
      )}
      {weakestDim != null && (
        <KpiCard
          label="⚠ Needs attention"
          value={weakestDim.name}
          sub={`Lowest score: ${weakestDim.score}/100`}
          warn
        />
      )}
    </div>
  );
}

function KpiCard({
  label,
  value,
  suffix,
  sub,
  deltaRaw,
  compareLabel,
  warn,
}: {
  label: string;
  value: string;
  suffix?: string;
  sub?: string;
  deltaRaw?: number | null;
  compareLabel?: string;
  warn?: boolean;
}) {
  const delta =
    deltaRaw != null && deltaRaw !== 0 ? (
      <span
        className={`kpi__delta ${deltaRaw > 0 ? "kpi__delta--up" : "kpi__delta--down"}`}
        title={compareLabel ? `vs ${compareLabel}` : undefined}
      >
        {deltaRaw > 0 ? "▲" : "▼"} {Math.abs(deltaRaw)}
      </span>
    ) : null;

  return (
    <div className={`kpi${warn ? " kpi--warn" : ""}`}>
      <div className="kpi__value-row">
        <span className="kpi__value">
          {value}
          {suffix && <span className="kpi__suffix">{suffix}</span>}
        </span>
        {delta}
      </div>
      <span className="kpi__label">{label}</span>
      {sub && <span className="kpi__sub">{sub}</span>}
    </div>
  );
}
