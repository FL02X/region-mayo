"use client";

import { useState, useEffect } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getRegionCalendarParts, getRegionMonthStart } from "@/lib/region-date";

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

function getCalendarMonthDate(year: number, monthIndex: number) {
  return getRegionMonthStart(new Date(Date.UTC(year, monthIndex, 1, 12)));
}

interface MonthNavigatorProps {
  selectedMonth: Date;
  onMonthSelect: (date: Date, options?: { suppressScroll?: boolean }) => void;
  eventDates?: Date[];
}

export function MonthNavigator({
  selectedMonth,
  onMonthSelect,
  eventDates = [],
}: MonthNavigatorProps) {
  const selectedParts = getRegionCalendarParts(selectedMonth);
  const [viewYear, setViewYear] = useState(selectedParts.year);
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [isDesktopPickerOpen, setIsDesktopPickerOpen] = useState(false);
  const [isMobilePickerOpen, setIsMobilePickerOpen] = useState(false);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  useEffect(() => {
    setViewYear(getRegionCalendarParts(selectedMonth).year);
  }, [selectedMonth]);

  const navigateYear = (direction: "prev" | "next") => {
    setViewYear((prev) => (direction === "next" ? prev + 1 : prev - 1));
  };

  const isSelected = (monthIndex: number) =>
    getRegionCalendarParts(selectedMonth).month === monthIndex + 1 &&
    getRegionCalendarParts(selectedMonth).year === viewYear;

  const isCurrentMonth = (monthIndex: number) => {
    if (!currentDate) return false;
    const currentParts = getRegionCalendarParts(currentDate);
    return (
      currentParts.month === monthIndex + 1 &&
      currentParts.year === viewYear
    );
  };

  const hasEvents = (monthIndex: number) =>
    eventDates.some(
      (date) =>
        getRegionCalendarParts(date).month === monthIndex + 1 &&
        getRegionCalendarParts(date).year === viewYear,
    );

  const getEventCount = (monthIndex: number) =>
    eventDates.filter(
      (date) =>
        getRegionCalendarParts(date).month === monthIndex + 1 &&
        getRegionCalendarParts(date).year === viewYear,
    ).length;

  const handleMonthClick = (monthIndex: number) => {
    onMonthSelect(getCalendarMonthDate(viewYear, monthIndex));
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const delta = direction === "next" ? 1 : -1;
    const next = getCalendarMonthDate(
      selectedParts.year,
      selectedParts.month - 1 + delta,
    );
    onMonthSelect(next);
    setViewYear(getRegionCalendarParts(next).year);
  };

  // Mobile: navigate without letting the page auto-scroll. We do this by
  // remembering the current scroll position and restoring it shortly after
  // the parent/consumer may trigger a scroll. This suppression is only used
  // for the small prev/next buttons on mobile — selections from the full
  // month grid should behave normally (allowing scroll).
  const navigateMonthWithoutScroll = (direction: "prev" | "next") => {
    const delta = direction === "next" ? 1 : -1;
    const next = getCalendarMonthDate(
      selectedParts.year,
      selectedParts.month - 1 + delta,
    );

    onMonthSelect(next, { suppressScroll: true });
    setViewYear(getRegionCalendarParts(next).year);
  };

  const handleMobileMonthNavClick = (direction: "prev" | "next") => {
    navigateMonthWithoutScroll(direction);

    // Touch devices can keep the tapped button focused, which leaves a ghost
    // selected state behind. Clearing focus restores the original appearance.
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (active instanceof HTMLElement) {
        active.blur();
      }
    });
  };

  const selectDesktopMonth = (monthIndex: number) => {
    onMonthSelect(getCalendarMonthDate(viewYear, monthIndex));
    setIsDesktopPickerOpen(false);
  };

  return (
    <>
      {/* Desktop: horizontal month picker */}
      <div className="hidden h-14 items-center gap-2 rounded-[2px] border border-border/80 bg-card px-3 md:flex">
        <button
          onClick={() => navigateMonth("prev")}
          className="inline-flex h-9 items-center gap-1 rounded-[2px] px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
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
              className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-[2px] bg-[var(--surface-pane-soft)] px-4 text-sm font-semibold text-[var(--brand-ink)] transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              aria-label="Seleccionar mes y año"
              style={{ minHeight: "unset", minWidth: "unset" }}
            >
              <span className="truncate">
                {months[getRegionCalendarParts(selectedMonth).month - 1]} {getRegionCalendarParts(selectedMonth).year}
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
          className="inline-flex h-9 items-center gap-1 rounded-[2px] px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
          aria-label="Mes siguiente"
          title="Mes siguiente"
          style={{ minHeight: "unset", minWidth: "unset" }}
        >
          <span>Mes siguiente</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Mobile: month picker similar to desktop but adapted */}
      <div className="flex h-14 items-center gap-2 rounded-[2px] border border-border/80 bg-paper px-2.5 md:hidden">
        <button
          onClick={() => handleMobileMonthNavClick("prev")}
          className="inline-flex h-10 items-center gap-0.5 rounded-[2px] px-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
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
              className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-[2px] bg-paper px-3 text-[15px] font-semibold text-[var(--brand-ink)] transition-colors hover:bg-muted/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
              aria-label="Seleccionar mes y año"
              style={{ minHeight: "unset", minWidth: "unset" }}
            >
              <span className="truncate">
                {months[getRegionCalendarParts(selectedMonth).month - 1].slice(0, 3)} {getRegionCalendarParts(selectedMonth).year}
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
                        onMonthSelect(getCalendarMonthDate(viewYear, index));
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
          onClick={() => handleMobileMonthNavClick("next")}
          className="inline-flex h-10 items-center gap-0.5 rounded-[2px] px-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
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
