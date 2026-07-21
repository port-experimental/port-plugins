import type { MetricTotals } from "../types";
import { fmtCompact, fmtInt, fmtPct } from "../utils/format";

type Props = {
  current: MetricTotals;
  previous: MetricTotals | null;
  seatsConfigured: boolean;
};

type Delta = { dir: "up" | "down"; text: string } | null;

/** Percent change for count metrics. */
function countDelta(cur: number, prev: number | undefined): Delta {
  if (prev == null || prev === 0) return null;
  const pct = ((cur - prev) / prev) * 100;
  if (Math.abs(pct) < 0.5) return null;
  return { dir: pct > 0 ? "up" : "down", text: `${Math.abs(pct).toFixed(0)}%` };
}

/** Percentage-point change for rate metrics (0..1 inputs). */
function rateDelta(cur: number | null, prev: number | null | undefined): Delta {
  if (cur == null || prev == null) return null;
  const pp = (cur - prev) * 100;
  if (Math.abs(pp) < 0.1) return null;
  return { dir: pp > 0 ? "up" : "down", text: `${Math.abs(pp).toFixed(1)}pp` };
}

function KpiCard({
  label,
  value,
  suffix,
  sub,
  delta,
  muted,
}: {
  label: string;
  value: string;
  suffix?: string;
  sub?: string;
  delta?: Delta;
  muted?: boolean;
}) {
  return (
    <div className={`kpi${muted ? " kpi--muted" : ""}`}>
      <div className="kpi__value-row">
        <span className="kpi__value">
          {value}
          {suffix && <span className="kpi__suffix">{suffix}</span>}
        </span>
        {delta && (
          <span className={`kpi__delta kpi__delta--${delta.dir}`}>
            {delta.dir === "up" ? "▲" : "▼"} {delta.text}
          </span>
        )}
      </div>
      <span className="kpi__label">{label}</span>
      {sub && <span className="kpi__sub">{sub}</span>}
    </div>
  );
}

export function KpiStrip({ current, previous, seatsConfigured }: Props) {
  return (
    <div className="summary-strip">
      <KpiCard
        label="Active users"
        value={fmtInt(current.activeUsersMonthly)}
        sub={`avg · ${fmtInt(current.activeUsersDaily)} daily · ${fmtInt(
          current.activeUsersWeekly
        )} weekly`}
        delta={countDelta(current.activeUsersMonthly, previous?.activeUsersMonthly)}
      />
      <KpiCard
        label="Adoption rate"
        value={seatsConfigured ? fmtPct(current.adoptionRate) : "–"}
        sub={seatsConfigured ? "of licensed seats (MAU)" : "Set licensed seats param"}
        muted={!seatsConfigured}
        delta={
          seatsConfigured
            ? rateDelta(current.adoptionRate, previous?.adoptionRate)
            : null
        }
      />
      <KpiCard
        label="Acceptance rate"
        value={fmtPct(current.acceptanceRate)}
        sub="accepted ÷ suggested"
        delta={rateDelta(current.acceptanceRate, previous?.acceptanceRate)}
      />
      <KpiCard
        label="Lines accepted"
        value={fmtCompact(current.linesAccepted)}
        delta={countDelta(current.linesAccepted, previous?.linesAccepted)}
      />
      <KpiCard
        label="Suggestions"
        value={fmtCompact(current.suggestions)}
        delta={countDelta(current.suggestions, previous?.suggestions)}
      />
      <KpiCard
        label="Copilot PRs"
        value={fmtInt(current.copilotPrs)}
        sub="created + reviewed"
        delta={countDelta(current.copilotPrs, previous?.copilotPrs)}
      />
    </div>
  );
}
