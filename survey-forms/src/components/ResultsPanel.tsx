import { useMemo } from "react";
import type { SurveyDefinition, SurveyResponseRecord } from "../types";
import { EmptyState } from "./EmptyState";

type Props = {
  definition: SurveyDefinition;
  responses: SurveyResponseRecord[];
};

export function ResultsPanel({ definition, responses }: Props) {
  const agg = useMemo(
    () => aggregate(definition, responses),
    [definition, responses]
  );

  if (responses.length === 0) {
    return (
      <EmptyState
        title="No responses yet"
        hint="Aggregated, anonymous results appear here once people submit the survey."
      />
    );
  }

  return (
    <div className="results">
      <div className="results__summary">
        <Stat label="Responses" value={String(responses.length)} />
        {agg.overall != null && (
          <Stat label="Overall" value={String(agg.overall)} suffix="/100" />
        )}
      </div>

      <div className="meters">
        {agg.dimensions.map((d) => (
          <div className="meter" key={d.id}>
            <div className="meter__head">
              <span className="meter__name">{d.name}</span>
              <span className="meter__value">
                {d.score != null ? d.score : "-"}
              </span>
            </div>
            <div className="meter__track">
              <span
                className="meter__fill"
                style={
                  {
                    width: `${d.score ?? 0}%`,
                    ["--meter" as string]: d.color ?? "#3b82f6",
                  } as object
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="stat">
      <span className="stat__value">
        {value}
        {suffix && <span className="stat__suffix">{suffix}</span>}
      </span>
      <span className="stat__label">{label}</span>
    </div>
  );
}

function mean(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function aggregate(def: SurveyDefinition, responses: SurveyResponseRecord[]) {
  const dimensions = def.dimensions.map((d) => {
    const scores = responses
      .map((r) => r.dimensionScores?.[d.id])
      .filter((s): s is number => typeof s === "number");
    return { id: d.id, name: d.name, color: d.color, score: mean(scores) };
  });

  const overall = mean(
    responses
      .map((r) => r.overallScore)
      .filter((s): s is number => typeof s === "number")
  );

  return { dimensions, overall };
}
