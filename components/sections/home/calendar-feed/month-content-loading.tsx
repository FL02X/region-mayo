// Donde: planner mensual mobile en home. Viewports: mobile. Funcion: muestra skeleton mientras cambia el mes activo.
import { getRegionCalendarParts } from "@/lib/region-date";
import { CALENDAR_MONTHS } from "@/components/sections/home/calendar-feed/calendar-copy";

export function MonthContentLoading({ month }: { month: Date }) {
  const parts = getRegionCalendarParts(month);
  const monthName = CALENDAR_MONTHS[parts.month - 1];

  return (
    <div
      className="min-h-[360px] border border-border-line bg-paper-highlight px-4 py-4"
      role="status"
      aria-live="polite"
      aria-label={`Cargando eventos de ${monthName} ${parts.year}`}
    >
      <div className="space-y-3" aria-hidden="true">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 border border-border-line bg-paper p-2"
          >
            <div className="h-14 w-1 shrink-0 animate-pulse rounded-[2px] bg-brand/35" />
            <div className="h-14 w-14 shrink-0 animate-pulse bg-paper-dark" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3 w-20 animate-pulse bg-brand/25" />
              <div className="h-4 w-full max-w-[220px] animate-pulse bg-ink-muted-light/25" />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 border-t border-border-line pt-4" aria-hidden="true">
        <div className="space-y-3 bg-paper p-4">
          <div className="h-44 animate-pulse bg-paper-dark" />
          <div className="h-4 w-24 animate-pulse bg-brand/25" />
          <div className="h-5 w-4/5 animate-pulse bg-ink-muted-light/25" />
          <div className="h-3 w-full animate-pulse bg-ink-muted-light/20" />
          <div className="h-3 w-2/3 animate-pulse bg-ink-muted-light/20" />
        </div>
      </div>
    </div>
  );
}
