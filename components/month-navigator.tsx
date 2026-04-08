"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const months = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

interface MonthNavigatorProps {
  selectedMonth: Date;
  onMonthSelect: (date: Date) => void;
  eventDates?: Date[];
}

export function MonthNavigator({
  selectedMonth,
  onMonthSelect,
  eventDates = [],
}: MonthNavigatorProps) {
  const [viewYear, setViewYear] = useState(selectedMonth.getFullYear());
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  const navigateYear = (direction: "prev" | "next") => {
    setViewYear((prev) => (direction === "next" ? prev + 1 : prev - 1));
  };

  const isSelected = (monthIndex: number) =>
    selectedMonth.getMonth() === monthIndex &&
    selectedMonth.getFullYear() === viewYear;

  const isCurrentMonth = (monthIndex: number) => {
    if (!currentDate) return false;
    return (
      currentDate.getMonth() === monthIndex &&
      currentDate.getFullYear() === viewYear
    );
  };

  const hasEvents = (monthIndex: number) =>
    eventDates.some(
      (date) =>
        date.getMonth() === monthIndex && date.getFullYear() === viewYear,
    );

  const handleMonthClick = (monthIndex: number) => {
    onMonthSelect(new Date(viewYear, monthIndex, 1));
  };

  return (
    <div className="border border-border bg-card overflow-hidden">
      {/* Year header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <button
          onClick={() => navigateYear("prev")}
          className="flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-foreground transition-colors rounded"
          aria-label="Año anterior"
          style={{ minHeight: "unset", minWidth: "unset" }}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <h3 className="font-semibold text-base tabular-nums">{viewYear}</h3>

        <button
          onClick={() => navigateYear("next")}
          className="flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-foreground transition-colors rounded"
          aria-label="Año siguiente"
          style={{ minHeight: "unset", minWidth: "unset" }}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Month grid — flat cells divided by borders */}
      <div className="grid grid-cols-3 divide-x divide-y divide-border">
        {months.map((month, index) => {
          const selected = isSelected(index);
          const current = isCurrentMonth(index);
          const withEvents = hasEvents(index);

          return (
            <button
              key={month}
              onClick={() => handleMonthClick(index)}
              aria-pressed={selected}
              aria-label={`${month} ${viewYear}${withEvents ? " — con eventos" : ""}`}
              className={[
                "relative py-3.5 text-sm font-medium text-center transition-colors",
                selected
                  ? "bg-primary text-white"
                  : current
                    ? "text-primary font-semibold hover:bg-muted"
                    : withEvents
                      ? "text-foreground hover:bg-muted"
                      : "text-muted-foreground hover:bg-muted",
              ].join(" ")}
              style={{ minHeight: "unset", minWidth: "unset" }}
            >
              {month.slice(0, 3)}

              {/* Event dot — only when there are events and not selected */}
              {withEvents && !selected && (
                <span
                  className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
