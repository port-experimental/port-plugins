import { useMemo } from "react";
import type { CalendarEntity } from "../types";
import {
  addMonths,
  formatMonthYear,
  sameDay,
  startOfMonth,
  toDateKey,
} from "../utils/dates";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Props = {
  viewMonth: Date;
  byDateKey: Map<string, CalendarEntity[]>;
  selectedDate: Date | null;
  onSelectDate: (date: Date, entities: CalendarEntity[]) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onToday: () => void;
};

export function Calendar({
  viewMonth,
  byDateKey,
  selectedDate,
  onSelectDate,
  onPrevMonth,
  onNextMonth,
  onToday,
}: Props) {
  const cells = useMemo(() => buildMonthCells(viewMonth), [viewMonth]);
  const today = new Date();

  return (
    <section className="calendar" aria-label="Entity creation calendar">
      <div className="calendar-toolbar">
        <button type="button" className="nav-btn" onClick={onPrevMonth} aria-label="Previous month">
          ‹
        </button>
        <h2 className="calendar-month">{formatMonthYear(viewMonth)}</h2>
        <button type="button" className="nav-btn" onClick={onNextMonth} aria-label="Next month">
          ›
        </button>
        <button type="button" className="today-btn" onClick={onToday}>
          Today
        </button>
      </div>

      <div className="calendar-grid" role="grid">
        {WEEKDAYS.map((day) => (
          <div key={day} className="weekday" role="columnheader">
            {day}
          </div>
        ))}
        {cells.map((cell) => {
          const key = toDateKey(cell.date);
          const entities = byDateKey.get(key) ?? [];
          const hasEntities = entities.length > 0;
          const isToday = sameDay(cell.date, today);
          const isSelected =
            selectedDate != null && sameDay(cell.date, selectedDate);
          const inMonth =
            cell.date.getMonth() === viewMonth.getMonth() &&
            cell.date.getFullYear() === viewMonth.getFullYear();

          return (
            <button
              key={key + (inMonth ? "in" : "out")}
              type="button"
              role="gridcell"
              className={[
                "day-cell",
                !inMonth && "day-cell--outside",
                hasEntities && "day-cell--marked",
                isToday && "day-cell--today",
                isSelected && "day-cell--selected",
              ]
                .filter(Boolean)
                .join(" ")}
              disabled={!hasEntities}
              onClick={() => onSelectDate(cell.date, entities)}
              aria-label={
                hasEntities
                  ? `${cell.date.getDate()}, ${entities.length} entities`
                  : `${cell.date.getDate()}, no entities`
              }
            >
              <span className="day-number">{cell.date.getDate()}</span>
              {hasEntities && (
                <span className="day-mark" aria-hidden="true">
                  <span className="day-count">{entities.length}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

function buildMonthCells(viewMonth: Date): { date: Date }[] {
  const first = startOfMonth(viewMonth.getFullYear(), viewMonth.getMonth());
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  const cells: { date: Date }[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    cells.push({ date: d });
  }
  return cells;
}

export function initialViewMonth(): Date {
  return startOfMonth(new Date().getFullYear(), new Date().getMonth());
}

export { addMonths };
