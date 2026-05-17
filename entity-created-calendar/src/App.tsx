import { useCallback, useEffect, useState } from "react";
import "./App.css";
import {
  Calendar,
  addMonths,
  initialViewMonth,
} from "./components/Calendar";
import { EntityModal } from "./components/EntityModal";
import { useCalendarEntities } from "./hooks/useCalendarEntities";
import { usePostMessageData } from "./hooks/usePostMessageData";
import type { CalendarEntity } from "./types";
import { configFromParams } from "./utils/config";
import { startOfMonth } from "./utils/dates";

type ModalState = {
  date: Date;
  entities: CalendarEntity[];
};

export function App() {
  const { params, portToken, portApiBaseUrl } = usePostMessageData();
  const config = configFromParams(params);

  const [viewMonth, setViewMonth] = useState(initialViewMonth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [modal, setModal] = useState<ModalState | null>(null);

  const { isLoading, isError, error, byDateKey } = useCalendarEntities(
    config,
    portToken,
    portApiBaseUrl
  );

  const closeModal = useCallback(() => {
    setModal(null);
    setSelectedDate(null);
  }, []);

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modal, closeModal]);

  const handleSelectDate = useCallback(
    (date: Date, entities: CalendarEntity[]) => {
      setSelectedDate(date);
      setModal({ date, entities });
    },
    []
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
      {isLoading && <p className="status-banner">Loading entities…</p>}
      {isError && (
        <p className="error-banner" role="alert">
          {error instanceof Error ? error.message : "Failed to load entities"}
        </p>
      )}

      <Calendar
        viewMonth={viewMonth}
        byDateKey={byDateKey}
        selectedDate={selectedDate}
        onSelectDate={handleSelectDate}
        onPrevMonth={() => setViewMonth((m) => addMonths(m, -1))}
        onNextMonth={() => setViewMonth((m) => addMonths(m, 1))}
        onToday={() => {
          const now = new Date();
          setViewMonth(startOfMonth(now.getFullYear(), now.getMonth()));
        }}
      />

      {modal && (
        <EntityModal
          date={modal.date}
          blueprintIdentifier={config.blueprint.identifier}
          entities={modal.entities}
          onClose={closeModal}
        />
      )}
    </div>
  );
}
