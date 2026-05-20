import { useMemo } from "react";
import type { CalendarEntity } from "../types";
import {
  addMonths,
  formatMonthYear,
  parseDateKey,
  sameMonth,
  startOfMonth,
  weekdayLabels,
} from "../utils/dates";

type CalendarProps = {
  viewMonth: Date;
  entitiesByDate: Map<string, CalendarEntity[]>;
  onSelectDate: (dateKey: string, entities: CalendarEntity[]) => void;
};

type DayCell = {
  date: Date;
  dateKey: string;
  inMonth: boolean;
  entities: CalendarEntity[];
};

function buildMonthGrid(viewMonth: Date, entitiesByDate: Map<string, CalendarEntity[]>): DayCell[] {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const first = startOfMonth(year, month);
  const startOffset = first.getDay();
  const gridStart = new Date(year, month, 1 - startOffset);

  const cells: DayCell[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i
    );
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    const dateKey = `${y}-${m}-${d}`;
    cells.push({
      date,
      dateKey,
      inMonth: sameMonth(date, viewMonth),
      entities: entitiesByDate.get(dateKey) ?? [],
    });
  }
  return cells;
}

export function Calendar({
  viewMonth,
  entitiesByDate,
  onSelectDate,
}: CalendarProps) {
  const weekdays = useMemo(() => weekdayLabels(), []);
  const cells = useMemo(
    () => buildMonthGrid(viewMonth, entitiesByDate),
    [viewMonth, entitiesByDate]
  );

  const todayKey = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, []);

  return (
    <section className="calendar" aria-label="Entity calendar">
      <div className="weekday-row">
        {weekdays.map((label) => (
          <span key={label} className="weekday">
            {label}
          </span>
        ))}
      </div>
      <div className="day-grid">
        {cells.map((cell) => {
          const hasEntities = cell.entities.length > 0;
          const classNames = [
            "day-cell",
            !cell.inMonth && "day-cell--outside",
            cell.dateKey === todayKey && "day-cell--today",
            hasEntities && "day-cell--marked",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={cell.dateKey}
              type="button"
              className={classNames}
              disabled={!hasEntities}
              onClick={() =>
                hasEntities && onSelectDate(cell.dateKey, cell.entities)
              }
              aria-label={
                hasEntities
                  ? `${cell.date.getDate()}, ${cell.entities.length} entities`
                  : `${cell.date.getDate()}`
              }
            >
              <span className="day-number">{cell.date.getDate()}</span>
              {hasEntities && (
                <span className="day-mark" aria-hidden="true">
                  <span className="day-dot" />
                  {cell.entities.length > 1 && (
                    <span className="day-count">{cell.entities.length}</span>
                  )}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function formatDateLabel(dateKey: string): string {
  return parseDateKey(dateKey).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export { addMonths, formatMonthYear };
