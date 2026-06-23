// Donde: tarjeta de evento destacado en countdown mobile. Viewports: mobile. Funcion: muestra una unidad animada del contador.
import { useEffect, useRef, useState } from "react";
import type { TimeUnit } from "@/components/sections/home/countdown-section/countdown-utils";

export function FlipCountdownCell({
  value,
  label,
  editorialFontClassName,
  className = "",
  labelClassName = "",
  disabled = false,
}: TimeUnit & {
  editorialFontClassName: string;
  className?: string;
  labelClassName?: string;
  disabled?: boolean;
}) {
  const [displayValue, setDisplayValue] = useState(value);
  const [reduceMotion, setReduceMotion] = useState(false);
  const cellRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const swapTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotionPreference = () => setReduceMotion(mediaQuery.matches);

    updateMotionPreference();
    mediaQuery.addEventListener("change", updateMotionPreference);
    return () =>
      mediaQuery.removeEventListener("change", updateMotionPreference);
  }, []);

  useEffect(() => {
    return () => {
      if (swapTimeoutRef.current !== null) {
        window.clearTimeout(swapTimeoutRef.current);
      }
      animationRef.current?.cancel();
    };
  }, []);

  useEffect(() => {
    if (value === displayValue) return;

    if (reduceMotion) {
      setDisplayValue(value);
      return;
    }

    const cell = cellRef.current;
    if (cell) {
      animationRef.current?.cancel();
      if (swapTimeoutRef.current !== null) {
        window.clearTimeout(swapTimeoutRef.current);
      }

      animationRef.current = cell.animate(
        [
          {
            transform: "perspective(800px) rotateX(0deg)",
            opacity: 1,
            backgroundColor: "rgba(74, 112, 165, 0)",
            boxShadow: "inset 0 0 0 0 rgba(74, 112, 165, 0)",
          },
          {
            transform: "perspective(900px) rotateX(-86deg) scale(0.97)",
            opacity: 0.88,
            backgroundColor: "rgba(74, 112, 165, 0.16)",
            boxShadow: "inset 0 0 0 1px rgba(74, 112, 165, 0.35)",
          },
          {
            transform: "perspective(900px) rotateX(0deg) scale(1)",
            opacity: 1,
            backgroundColor: "rgba(74, 112, 165, 0)",
            boxShadow: "inset 0 0 0 0 rgba(74, 112, 165, 0)",
          },
        ],
        {
          duration: 320,
          easing: "cubic-bezier(0.22, 0.61, 0.36, 1)",
          fill: "none",
        },
      );

      swapTimeoutRef.current = window.setTimeout(() => {
        setDisplayValue(value);
        swapTimeoutRef.current = null;
      }, 210);
    } else {
      setDisplayValue(value);
    }
  }, [value, displayValue, reduceMotion]);

  const displayText = String(displayValue).padStart(2, "0");

  return (
    <div
      ref={cellRef}
      className={`py-3 text-center ${className}`}
      style={{
        willChange: "transform, opacity, background-color, box-shadow",
        transformOrigin: "50% 50%",
      }}
      aria-live="off"
    >
      <div className="relative mx-auto h-6 w-full max-w-[70px]">
        <span
          className={`${editorialFontClassName} mt-1.5 absolute inset-0 flex items-center justify-center text-[30px] font-normal tabular-nums leading-none ${disabled ? "text-muted-foreground" : "text-foreground"}`}
        >
          {displayText}
        </span>
      </div>

      <p
        className={`mt-1.5 text-[11px] uppercase tracking-widest font-medium ${disabled ? "text-muted-foreground/90" : "text-muted-foreground"} ${labelClassName}`}
      >
        {label}
      </p>
    </div>
  );
}
