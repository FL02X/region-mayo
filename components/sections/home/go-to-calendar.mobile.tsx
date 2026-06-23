"use client";

// Donde: home, boton flotante hacia #calendario. Viewports: mobile. Funcion: aparece antes del calendario y hace scroll suave.
import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

const CALENDAR_SECTION_ID = "calendario";
const APP_HEADER_SELECTOR = "[data-app-header]";
const FALLBACK_HEADER_HEIGHT = 51;

export function GoToCalendar() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let frameId = 0;

    const updateVisibility = () => {
      const target = document.getElementById(CALENDAR_SECTION_ID);
      if (!target) {
        setVisible(true);
        return;
      }

      const header = document.querySelector<HTMLElement>(APP_HEADER_SELECTOR);
      const headerHeight = header?.offsetHeight ?? FALLBACK_HEADER_HEIGHT;
      const calendarTop = target.getBoundingClientRect().top + window.scrollY;
      const shouldShow = window.scrollY < calendarTop - headerHeight - 1;

      setVisible((current) => (current === shouldShow ? current : shouldShow));
    };

    const scheduleUpdate = () => {
      if (frameId) return;
      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        updateVisibility();
      });
    };

    updateVisibility();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  const handleClick = () => {
    const target = document.getElementById(CALENDAR_SECTION_ID);
    if (target) {
      const header = document.querySelector<HTMLElement>(APP_HEADER_SELECTOR);
      const headerHeight = header?.offsetHeight ?? FALLBACK_HEADER_HEIGHT;
      const rect = target.getBoundingClientRect();
      const top = rect.top + window.scrollY - headerHeight;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div
      aria-hidden={!visible}
      className="fixed bottom-4 right-4 z-[50] md:hidden pointer-events-none"
      style={{
        paddingBottom: "env(safe-area-inset-bottom)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label="Ir al inicio del calendario"
        className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#21252b] text-white shadow-[0_8px_22px_rgba(15,23,42,0.24)] transition-[opacity,transform,box-shadow,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:translate-y-0.5 active:shadow-[0_5px_14px_rgba(15,23,42,0.2)] ${
          visible
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-95 opacity-0"
        }`}
      >
        <ChevronDown className="h-4 w-4" aria-hidden="true" strokeWidth={1.9} />
      </button>
    </div>
  );
}
