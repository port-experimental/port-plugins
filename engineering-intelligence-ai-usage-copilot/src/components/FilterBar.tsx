import type { DateRange, OrgOption } from "../types";
import { DateRangePicker } from "./DateRangePicker";
import { OrgFilter } from "./OrgFilter";

type Props = {
  preset: number | null;
  range: DateRange;
  /** Available orgs — OrgFilter only renders when length >= 1. */
  orgOptions: OrgOption[];
  selectedOrg: string | null;
  isDirty: boolean;
  onPreset: (days: number) => void;
  onRange: (range: DateRange) => void;
  onOrg: (id: string | null) => void;
  onSave: () => void;
  onReset: () => void;
};

export function FilterBar({
  preset,
  range,
  orgOptions,
  selectedOrg,
  isDirty,
  onPreset,
  onRange,
  onOrg,
  onSave,
  onReset,
}: Props) {
  return (
    <div className="filter-bar">
      {orgOptions.length >= 1 && (
        <OrgFilter orgs={orgOptions} selected={selectedOrg} onChange={onOrg} />
      )}

      <DateRangePicker
        preset={preset}
        range={range}
        onPreset={onPreset}
        onRange={onRange}
      />

      {isDirty && (
        <div className="filter-group filter-group--save">
          <span className="filter-label" style={{ visibility: "hidden" }}>·</span>
          <div className="filter-actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={onReset}>
              Reset view
            </button>
            <button type="button" className="btn btn--primary btn--sm" onClick={onSave}>
              Save as default view
            </button>
          </div>
        </div>
      )}

      <p className="filter-bar__note">
        ⓘ By default, all GitHub org members who used Copilot are ingested. Counts may differ from Port-registered users depending on your integration mapping.
      </p>
    </div>
  );
}
