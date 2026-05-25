"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export function GoToCalendar() {
  const [visible, setVisible] = useState(false);

  const hiddenForNow = true;

  useEffect(() => {
    const checkTop = () => {
      setVisible(window.scrollY <= 8);
    };

    checkTop();
    window.addEventListener("scroll", checkTop, { passive: true });
    return () => window.removeEventListener("scroll", checkTop);
  }, []);

  if (hiddenForNow || !visible) return null;

  const handleClick = () => {
    const target = document.getElementById("calendario");
    if (target) {
      const rect = target.getBoundingClientRect();
      const top = rect.top + window.scrollY - 54;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div
      aria-hidden={!visible}
      className="fixed left-0 right-0 bottom-0 z-[40] md:hidden pointer-events-none"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}
    >
      {/* Overlay removed per request; button will sit flush to content */}

      <div className="pointer-events-auto w-full relative z-10">
        <div className="absolute -top-6 left-0 right-0 h-8 pointer-events-none">
          <div className="h-full bg-gradient-to-t from-[#2f5e93]/24 to-transparent backdrop-blur-sm" />
        </div>
        <button
          onClick={handleClick}
          aria-label="Ir al Calendario"
          className="w-full flex items-center justify-center gap-2 h-14 rounded-none bg-gradient-to-t from-[#2f5e93]/20 to-[#2f5e93]/8 backdrop-blur-sm text-[#05223a] text-base font-semibold px-3"
        >
          <span className="leading-tight">Ir al Calendario</span>
          <ChevronDown className="h-6 w-8 transform scale-x-125" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
