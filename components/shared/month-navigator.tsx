"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [viewYear, setViewYear] = useState(selectedMonth.getUTCFullYear());
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [isDesktopPickerOpen, setIsDesktopPickerOpen] = useState(false);
  const [isMobilePickerOpen, setIsMobilePickerOpen] = useState(false);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    setViewYear(selectedMonth.getUTCFullYear());
  }, [selectedMonth]);

  const navigateYear = (direction: "prev" | "next") => {
    setViewYear((prev) => (direction === "next" ? prev + 1 : prev - 1));
  };

  const isSelected = (monthIndex: number) =>
    selectedMonth.getUTCMonth() === monthIndex &&
    selectedMonth.getUTCFullYear() === viewYear;

  const isCurrentMonth = (monthIndex: number) => {
    if (!currentDate) return false;
    return (
      currentDate.getUTCMonth() === monthIndex &&
      currentDate.getUTCFullYear() === viewYear
    );
  };

  const hasEvents = (monthIndex: number) =>
    eventDates.some(
      (date) =>
        date.getUTCMonth() === monthIndex && date.getUTCFullYear() === viewYear,
    );

  const getEventCount = (monthIndex: number) =>
    eventDates.filter(
      (date) =>
        date.getUTCMonth() === monthIndex && date.getUTCFullYear() === viewYear,
    ).length;

  const handleMonthClick = (monthIndex: number) => {
    onMonthSelect(new Date(Date.UTC(viewYear, monthIndex, 1)));
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const delta = direction === "next" ? 1 : -1;
    const next = new Date(
      Date.UTC(
        selectedMonth.getUTCFullYear(),
        selectedMonth.getUTCMonth() + delta,
        1,
      )
    );
    onMonthSelect(next);
    setViewYear(next.getUTCFullYear());
  };

  // Mobile: navigate without letting the page auto-scroll. We do this by
  // remembering the current scroll position and restoring it shortly after
  // the parent/consumer may trigger a scroll. This suppression is only used
  // for the small prev/next buttons on mobile — selections from the full
  // month grid should behave normally (allowing scroll).
  const navigateMonthWithoutScroll = (direction: "prev" | "next") => {
    if (typeof window === "undefined") {
      navigateMonth(direction);
      return;
    }

    const previousY = window.scrollY || window.pageYOffset || 0;

    navigateMonth(direction);

    // Restore scroll after a short delay. Use requestAnimationFrame twice to
    // increase the chance we restore after any layout/scroll side-effects.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo({ top: previousY, left: 0, behavior: "instant" as ScrollBehavior });
      });
    });
  };

  const selectDesktopMonth = (monthIndex: number) => {
    onMonthSelect(new Date(Date.UTC(viewYear, monthIndex, 1)));
    setIsDesktopPickerOpen(false);
  };

  return (
    <>
      {/* Desktop: horizontal month picker */}
      <div className="hidden md:flex items-center border border-border bg-card h-12 px-2">
        <button
          onClick={() => navigateMonth("prev")}
          className="inline-flex items-center gap-1 h-9 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label="Mes anterior"
          title="Mes anterior"
          style={{ minHeight: "unset", minWidth: "unset" }}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Mes anterior</span>
        </button>

        <Popover open={isDesktopPickerOpen} onOpenChange={setIsDesktopPickerOpen}>
          <PopoverTrigger asChild>
            <button
              className="mx-1 flex-1 h-9 px-3 border border-border text-sm font-semibold text-foreground bg-background hover:bg-muted/60 transition-colors inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              aria-label="Seleccionar mes y año"
              style={{ minHeight: "unset", minWidth: "unset" }}
            >
              <span className="truncate">
                {months[selectedMonth.getUTCMonth()]} {selectedMonth.getUTCFullYear()}
              </span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 transition-transform ${
                  isDesktopPickerOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
          </PopoverTrigger>

          <PopoverContent className="w-[340px] p-3" align="center" sideOffset={8}>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <button
                  onClick={() => navigateYear("prev")}
                  className="flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  aria-label="Año anterior"
                  title="Año anterior"
                  style={{ minHeight: "unset", minWidth: "unset" }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h3 className="font-semibold text-sm tabular-nums">{viewYear}</h3>
                <button
                  onClick={() => navigateYear("next")}
                  className="flex items-center justify-center h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  aria-label="Año siguiente"
                  title="Año siguiente"
                  style={{ minHeight: "unset", minWidth: "unset" }}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-4 gap-1">
                {months.map((month, index) => {
                  const selected = isSelected(index);
                  const current = isCurrentMonth(index);
                  const withEvents = hasEvents(index);
                  const eventCount = getEventCount(index);

                  return (
                    <button
                      key={`${month}-${viewYear}`}
                      onClick={() => selectDesktopMonth(index)}
                      aria-pressed={selected}
                      aria-label={`${month} ${viewYear}`}
                      className={[
                        "relative h-14 px-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
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
                      <span className="block leading-none">{month.slice(0, 3)}</span>
                      {/* event count intentionally hidden per request */}
                    </button>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <button
          onClick={() => navigateMonth("next")}
          className="inline-flex items-center gap-1 h-9 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label="Mes siguiente"
          title="Mes siguiente"
          style={{ minHeight: "unset", minWidth: "unset" }}
        >
          <span>Mes siguiente</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile: month picker similar to desktop but adapted */}
      <div className="md:hidden border border-border bg-card h-11 px-2 flex items-center">
        <button
          onClick={() => navigateMonthWithoutScroll("prev")}
          className="inline-flex items-center gap-1 h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label="Mes anterior"
          title="Mes anterior"
          style={{ minHeight: "unset", minWidth: "unset" }}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Ant.</span>
        </button>

        <Popover open={isMobilePickerOpen} onOpenChange={setIsMobilePickerOpen}>
          <PopoverTrigger asChild>
            <button
              className="mx-1 flex-1 h-8 px-2 border border-border text-sm font-semibold text-foreground bg-background hover:bg-muted/60 transition-colors inline-flex items-center justify-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              aria-label="Seleccionar mes y año"
              style={{ minHeight: "unset", minWidth: "unset" }}
            >
              <span className="truncate">
                {months[selectedMonth.getUTCMonth()].slice(0, 3)} {selectedMonth.getUTCFullYear()}
              </span>
              <ChevronDown
                className={`h-3 w-3 shrink-0 transition-transform ${
                  isMobilePickerOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
          </PopoverTrigger>

          <PopoverContent className="w-[280px] p-3" align="center" sideOffset={6}>
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <button
                  onClick={() => navigateYear("prev")}
                  className="flex items-center justify-center h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  aria-label="Año anterior"
                  title="Año anterior"
                  style={{ minHeight: "unset", minWidth: "unset" }}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <h3 className="font-semibold text-sm tabular-nums">{viewYear}</h3>
                <button
                  onClick={() => navigateYear("next")}
                  className="flex items-center justify-center h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                  aria-label="Año siguiente"
                  title="Año siguiente"
                  style={{ minHeight: "unset", minWidth: "unset" }}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-1">
                {months.map((month, index) => {
                  const selected = isSelected(index);
                  const current = isCurrentMonth(index);
                  const withEvents = hasEvents(index);

                  return (
                    <button
                      key={`${month}-${viewYear}`}
                      onClick={() => {
                        onMonthSelect(new Date(Date.UTC(viewYear, index, 1)));
                        setIsMobilePickerOpen(false);
                      }}
                      aria-pressed={selected}
                      aria-label={`${month} ${viewYear}`}
                      className={[
                        "relative h-12 px-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60",
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
                      <span className="block leading-none">{month.slice(0, 3)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <button
          onClick={() => navigateMonthWithoutScroll("next")}
          className="inline-flex items-center gap-1 h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label="Mes siguiente"
          title="Mes siguiente"
          style={{ minHeight: "unset", minWidth: "unset" }}
        >
          <span>Sig.</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </>
  );
}
