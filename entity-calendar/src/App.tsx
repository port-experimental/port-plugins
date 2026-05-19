import { useMemo, useState } from "react";
import "./App.css";
import {
  Calendar,
  addMonths,
  formatDateLabel,
  formatMonthYear,
} from "./components/Calendar";
import { EntityModal } from "./components/EntityModal";
import {
  groupEntitiesByDate,
  useCalendarEntities,
} from "./hooks/useCalendarEntities";
import { usePostMessageData } from "./hooks/usePostMessageData";
import type { CalendarEntity } from "./types";
import { configFromParams } from "./utils/config";

export function App() {
  const { params, portToken, portApiBaseUrl } = usePostMessageData();
  const config = configFromParams(params);

  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selected, setSelected] = useState<{
    dateKey: string;
    entities: CalendarEntity[];
  } | null>(null);

  const { data: entities = [], isLoading, isError, error } =
    useCalendarEntities(config, portToken, portApiBaseUrl);

  const entitiesByDate = useMemo(
    () => groupEntitiesByDate(entities),
    [entities]
  );

  if (!portApiBaseUrl || !portToken) {
    return (
      <div className="shell">
        <p className="muted">
          Waiting for Port context… If you opened this file directly, embed it
          in a Port dashboard instead.
        </p>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="shell">
        <p className="muted">
          Configure the <strong>Blueprint</strong> parameter for this widget.
        </p>
      </div>
    );
  }

  return (
    <div className="shell">
      <header className="toolbar">
        <button
          type="button"
          className="nav-btn"
          onClick={() => setViewMonth((m) => addMonths(m, -1))}
          aria-label="Previous month"
        >
          ‹
        </button>
        <h2 className="month-label">{formatMonthYear(viewMonth)}</h2>
        <button
          type="button"
          className="nav-btn"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
        >
          ›
        </button>
        <button
          type="button"
          className="today-btn"
          onClick={() => {
            const now = new Date();
            setViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
          }}
        >
          Today
        </button>
      </header>

      {isLoading && <p className="status">Loading entities…</p>}
      {isError && (
        <pre className="error" role="alert">
          {error instanceof Error ? error.message : "Failed to load entities"}
        </pre>
      )}

      {!isLoading && !isError && (
        <>
          <Calendar
            viewMonth={viewMonth}
            entitiesByDate={entitiesByDate}
            onSelectDate={(dateKey, dayEntities) =>
              setSelected({ dateKey, entities: dayEntities })
            }
          />
          {entities.length === 0 && (
            <p className="status muted-inline">
              No entities with a date found for{" "}
              <strong>{config.blueprint.title}</strong>. Dates use entity{" "}
              <code>createdAt</code>
              {config.createdDateProperty
                ?? ` or property "${config.createdDateProperty}"`}
              .
            </p>
          )}
        </>
      )}

      {selected && (
        <EntityModal
          dateLabel={formatDateLabel(selected.dateKey)}
          entities={selected.entities}
          blueprintIdentifier={config.blueprint.identifier}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
