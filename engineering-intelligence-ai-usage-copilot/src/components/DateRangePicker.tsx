import { useEffect, useRef, useState } from "react";
import type { DateRange } from "../types";
import {
  RANGE_PRESETS,
  isoDay,
  lastMonthRange,
  presetRange,
  thisMonthRange,
  todayIso,
} from "../utils/aggregations";
import { fmtDayShort } from "../utils/format";

type Props = {
  /** Active day-count preset (7/14/30/…), or null when the range is custom. */
  preset: number | null;
  range: DateRange;
  onPreset: (days: number) => void;
  onRange: (range: DateRange) => void;
};

const DOW = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

type MonthPreset = { id: string; label: string; make: () => DateRange };

const MONTH_PRESETS: MonthPreset[] = [
  { id: "thisMonth", label: "This month", make: thisMonthRange },
  { id: "lastMonth", label: "Last month", make: lastMonthRange },
];

type Cell = { iso: string; day: number; inMonth: boolean };

/** 6-week (42-cell) grid for a month, Sunday-first, with adjacent-month spill. */
function monthMatrix(year: number, month: number): Cell[] {
  const first = new Date(Date.UTC(year, month, 1));
  const startDow = first.getUTCDay();
  const cells: Cell[] = [];
  const push = (d: Date, inMonth: boolean) =>
    cells.push({ iso: isoDay(d), day: d.getUTCDate(), inMonth });

  for (let i = startDow; i > 0; i--) {
    push(new Date(Date.UTC(year, month, 1 - i)), false);
  }
  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  for (let d = 1; d <= daysInMonth; d++) {
    push(new Date(Date.UTC(year, month, d)), true);
  }
  while (cells.length % 7 !== 0) {
    const next = new Date(`${cells[cells.length - 1].iso}T00:00:00Z`);
    next.setUTCDate(next.getUTCDate() + 1);
    push(next, false);
  }
  return cells;
}

function monthLabel(year: number, month: number): string {
  return new Date(Date.UTC(year, month, 1)).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Left-month anchor for the two-month view: the month *before* `iso`, so the
 * anchor month lands on the right (matching the current-month-on-right layout).
 */
function anchorView(iso: string): { year: number; month: number } {
  const d = new Date(`${iso}T00:00:00Z`);
  const a = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1));
  return { year: a.getUTCFullYear(), month: a.getUTCMonth() };
}

function triggerLabel(preset: number | null, range: DateRange): string {
  if (preset != null) {
    const p = RANGE_PRESETS.find((x) => x.value === preset);
    if (p) return p.label;
  }
  return `${fmtDayShort(range.from)} – ${fmtDayShort(range.to)}`;
}

function CalendarMonth({
  year,
  month,
  from,
  to,
  hoverIso,
  today,
  onPick,
  onHover,
  className,
}: {
  year: number;
  month: number;
  from: string;
  to: string;
  /** Hovered ISO date — used to preview the range while second click is pending. */
  hoverIso: string;
  today: string;
  onPick: (iso: string) => void;
  onHover: (iso: string) => void;
  className?: string;
}) {
  const cells = monthMatrix(year, month);
  const hasRange = !!from && !!to;

  // Pending-range preview: shown when start is set but end is not yet clicked.
  const pendingStart = from && !to ? (hoverIso < from ? hoverIso : from) : "";
  const pendingEnd   = from && !to ? (hoverIso < from ? from       : hoverIso) : "";

  return (
    <div className={`cal${className ? ` ${className}` : ""}`}>
      <div className="cal__month">{monthLabel(year, month)}</div>
      <div className="cal__dow">
        {DOW.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="cal__grid">
        {cells.map((c) => {
          const future = c.iso > today;
          const inRange   = hasRange && c.iso >= from && c.iso <= to;
          const inPreview = !!pendingStart && c.iso >= pendingStart && c.iso <= pendingEnd;
          const isStart   = c.iso === from;
          const isEnd     = c.iso === to;
          const cls = [
            "cal__day",
            c.inMonth ? "" : "cal__day--out",
            future ? "cal__day--disabled" : "",
            inRange   ? "cal__day--range"   : "",
            inPreview ? "cal__day--preview" : "",
            isStart   ? "cal__day--start"   : "",
            isEnd     ? "cal__day--end"     : "",
            c.iso === today ? "cal__day--today" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={c.iso}
              type="button"
              className={cls}
              disabled={future}
              aria-label={c.iso}
              aria-pressed={isStart || isEnd}
              onClick={() => onPick(c.iso)}
              onMouseEnter={() => onHover(c.iso)}
            >
              {c.day}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function DateRangePicker({ preset, range, onPreset, onRange }: Props) {
  const [open, setOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(range.from);
  const [draftTo, setDraftTo] = useState(range.to);
  const [draftPreset, setDraftPreset] = useState<number | null>(preset);
  const [view, setView] = useState(() => anchorView(range.to));
  const [hoverIso, setHoverIso] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const today = todayIso();

  // Re-seed the draft from committed values each time the popover opens so an
  // abandoned edit (Cancel / click-away) never leaks into the next session.
  const openPicker = () => {
    setDraftFrom(range.from);
    setDraftTo(range.to);
    setDraftPreset(preset);
    setView(anchorView(range.to));
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const pickDay = (iso: string) => {
    if (iso > today) return;
    setDraftPreset(null);
    if (!draftFrom || (draftFrom && draftTo)) {
      setDraftFrom(iso);
      setDraftTo("");
    } else if (iso < draftFrom) {
      setDraftTo(draftFrom);
      setDraftFrom(iso);
    } else {
      setDraftTo(iso);
    }
  };

  const applyDaysPreset = (days: number) => {
    const r = presetRange(days);
    setDraftFrom(r.from);
    setDraftTo(r.to);
    setDraftPreset(days);
  };

  const applyMonthPreset = (p: MonthPreset) => {
    const r = p.make();
    setDraftFrom(r.from);
    setDraftTo(r.to);
    setDraftPreset(null);
  };

  const commit = () => {
    if (!draftFrom || !draftTo) return;
    if (draftPreset != null) onPreset(draftPreset);
    else onRange({ from: draftFrom, to: draftTo });
    setOpen(false);
  };

  const shiftView = (delta: number) => {
    setView((v) => {
      const d = new Date(Date.UTC(v.year, v.month + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    });
  };

  // The right-hand month is view+1; block navigating it past the current month.
  const right = new Date(Date.UTC(view.year, view.month + 1, 1));
  const todayD = new Date(`${today}T00:00:00Z`);
  const nextDisabled =
    right.getUTCFullYear() * 12 + right.getUTCMonth() >=
    todayD.getUTCFullYear() * 12 + todayD.getUTCMonth();

  const monthActive = (p: MonthPreset): boolean => {
    if (draftPreset != null) return false;
    const r = p.make();
    return draftFrom === r.from && draftTo === r.to;
  };
  const anyPresetActive =
    draftPreset != null || MONTH_PRESETS.some(monthActive);

  return (
    <div className="filter-group date-picker" ref={rootRef}>
      <span className="filter-label">Date range</span>
      <button
        type="button"
        className="dp__trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openPicker())}
      >
        <span className="dp__cal-icon" aria-hidden="true">
          🗓
        </span>
        {triggerLabel(preset, range)}
        <span className="dp__caret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open && (
        <div className="dp__pop" role="dialog" aria-label="Select date range">
          <div className="dp__body">
            <div className="dp__rail">
              {RANGE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  className={`dp__preset${
                    draftPreset === p.value ? " dp__preset--active" : ""
                  }`}
                  onClick={() => applyDaysPreset(p.value)}
                >
                  {draftPreset === p.value ? "✓ " : ""}
                  {p.label}
                </button>
              ))}
              {MONTH_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`dp__preset${
                    monthActive(p) ? " dp__preset--active" : ""
                  }`}
                  onClick={() => applyMonthPreset(p)}
                >
                  {monthActive(p) ? "✓ " : ""}
                  {p.label}
                </button>
              ))}
              <button
                type="button"
                className={`dp__preset${
                  !anyPresetActive ? " dp__preset--active" : ""
                }`}
                onClick={() => setDraftPreset(null)}
              >
                {!anyPresetActive ? "✓ " : ""}Custom
              </button>
            </div>

            <div className="dp__cals">
              <div className="dp__cal-nav">
                <button
                  type="button"
                  className="dp__nav-btn"
                  aria-label="Previous month"
                  onClick={() => shiftView(-1)}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="dp__nav-btn"
                  aria-label="Next month"
                  disabled={nextDisabled}
                  onClick={() => shiftView(1)}
                >
                  ›
                </button>
              </div>
              <div
                className="dp__cal-grid"
                onMouseLeave={() => setHoverIso("")}
              >
                <CalendarMonth
                  year={view.year}
                  month={view.month}
                  from={draftFrom}
                  to={draftTo}
                  hoverIso={hoverIso}
                  today={today}
                  onPick={pickDay}
                  onHover={setHoverIso}
                />
                <CalendarMonth
                  className="cal--second"
                  year={right.getUTCFullYear()}
                  month={right.getUTCMonth()}
                  from={draftFrom}
                  to={draftTo}
                  hoverIso={hoverIso}
                  today={today}
                  onPick={pickDay}
                  onHover={setHoverIso}
                />
              </div>
            </div>
          </div>

          <div className="dp__footer">
            <span className="dp__summary">
              {draftFrom && draftTo
                ? `${fmtDayShort(draftFrom)} – ${fmtDayShort(draftTo)}`
                : draftFrom
                  ? `${fmtDayShort(draftFrom)} – …`
                  : "Pick a start date"}
            </span>
            <div className="dp__actions">
              <button
                type="button"
                className="dp__btn dp__btn--ghost"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="dp__btn dp__btn--primary"
                disabled={!draftFrom || !draftTo}
                onClick={commit}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
