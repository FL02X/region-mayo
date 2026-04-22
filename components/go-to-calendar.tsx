"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

export function GoToCalendar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const checkTop = () => {
      setVisible(window.scrollY <= 8);
    };

    checkTop();
    window.addEventListener("scroll", checkTop, { passive: true });
    return () => window.removeEventListener("scroll", checkTop);
  }, []);

  if (!visible) return null;

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
        <button
          onClick={handleClick}
          aria-label="Ir al Calendario"
          className="w-full flex items-center justify-center gap-3 h-20 rounded-none bg-[#2f5e93]/16 backdrop-blur-sm text-[#05223a] text-lg font-semibold px-4"
        >
          <span className="leading-tight">Ir al Calendario</span>
          <ChevronDown className="h-7 w-10 transform scale-x-150" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
