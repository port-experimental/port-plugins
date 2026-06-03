import { ChevronLeft, ChevronRight } from "lucide-react";
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
import { firstDayOfWeekFromConfig } from "./utils/dates";

export function App() {
  const { params, page, portToken, portApiBaseUrl } = usePostMessageData();
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
    useCalendarEntities(config, portToken, portApiBaseUrl, page);

  const entitiesByDate = useMemo(
    () => groupEntitiesByDate(entities),
    [entities]
  );

  const firstDayOfWeek = useMemo(
    () =>
      config
        ? firstDayOfWeekFromConfig(config.weekStartsOnMonday)
        : 0,
    [config]
  );

  const isViewingCurrentMonth = useMemo(() => {
    const now = new Date();
    return (
      viewMonth.getFullYear() === now.getFullYear() &&
      viewMonth.getMonth() === now.getMonth()
    );
  }, [viewMonth]);

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
          <ChevronLeft size={18} strokeWidth={2} aria-hidden />
        </button>
        <h2 className="month-label">{formatMonthYear(viewMonth)}</h2>
        <button
          type="button"
          className="nav-btn"
          onClick={() => setViewMonth((m) => addMonths(m, 1))}
          aria-label="Next month"
        >
          <ChevronRight size={18} strokeWidth={2} aria-hidden />
        </button>
        <button
          type="button"
          className={
            isViewingCurrentMonth ? "today-btn" : "today-btn today-btn--away"
          }
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
            firstDayOfWeek={firstDayOfWeek}
            entitiesByDate={entitiesByDate}
            onSelectDate={(dateKey, dayEntities) =>
              setSelected({ dateKey, entities: dayEntities })
            }
          />
          {entities.length === 0 && (
            <p className="status muted-inline">
              No entities with a date found for{" "}
              <strong>
                {config.blueprint.title ?? config.blueprint.identifier}
              </strong>
              .{" "}
              {config.createdDateProperty ? (
                <>
                  Dates use blueprint property{" "}
                  <code>{config.createdDateProperty}</code>.
                </>
              ) : (
                <>
                  Dates use entity <code>createdAt</code>.
                </>
              )}
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
