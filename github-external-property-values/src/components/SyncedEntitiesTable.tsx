import type { SyncedEntityRow } from "../types";
import { buildEntityPageUrl } from "../utils/portalUrl";
import { PropertyValuePill } from "./PropertyValuePill";
import { RunStatusLink } from "./RunStatusLink";

export function SyncedEntitiesTable({
  rows,
  targetBlueprint,
  targetBlueprintTitle,
  propertyTitle,
  propertyEnumColors,
  showRunColumn,
}: {
  rows: SyncedEntityRow[];
  targetBlueprint: string;
  targetBlueprintTitle: string;
  propertyTitle: string;
  propertyEnumColors?: Record<string, string>;
  showRunColumn: boolean;
}) {
  return (
    <div className="table-wrap">
      <table className="synced-table">
        <thead>
          <tr>
            <th>{targetBlueprintTitle}</th>
            <th>{propertyTitle}</th>
            {showRunColumn && <th>Latest sync run</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.identifier}>
              <td>
                <a
                  className="synced-table__link"
                  href={buildEntityPageUrl(targetBlueprint, row.identifier)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {row.title}
                </a>
              </td>
              <td>
                <PropertyValuePill
                  value={row.propertyValue}
                  enumColors={propertyEnumColors}
                />
              </td>
              {showRunColumn && (
                <td>
                  <RunStatusLink run={row.latestRun} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
