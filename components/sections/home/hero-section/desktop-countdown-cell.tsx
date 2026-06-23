// Donde: tarjeta de evento en hero desktop. Viewports: desktop. Funcion: muestra una unidad animada del countdown.
import { useEffect, useState } from "react";

export function CompactCountdownCell({
  value,
  label,
  disabled = false,
}: {
  value: number;
  label: string;
  disabled?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value === displayValue) return;

    setIsAnimating(true);
    const swapTimer = window.setTimeout(() => setDisplayValue(value), 120);
    const endTimer = window.setTimeout(() => setIsAnimating(false), 280);

    return () => {
      window.clearTimeout(swapTimer);
      window.clearTimeout(endTimer);
    };
  }, [value, displayValue]);

  return (
    <div className="py-2.5 text-center">
      <div
        className={`text-[24px] font-bold tabular-nums leading-none transition-transform duration-200 ${
          isAnimating ? "-translate-y-[1px] scale-[0.97]" : "translate-y-0 scale-100"
        } ${disabled ? "text-[#5b6876]" : "text-[#1f2833]"}`}
      >
        {String(displayValue).padStart(2, "0")}
      </div>
      <p
        className={`text-[9px] uppercase tracking-[0.14em] mt-1 font-semibold ${
          disabled ? "text-[#7a8490]" : "text-[#5b6876]"
        }`}
      >
        {label}
      </p>
    </div>
  );
}
