"use client";

import { useEffect, useState } from "react";
import { Grid2X2, List } from "lucide-react";

export type ViewMode = "grid" | "compact";

interface ViewModeToggleProps {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
  ariaLabel: string;
  disableGrid?: boolean;
}

export function ViewModeToggle({ value, onChange, ariaLabel, disableGrid = false }: ViewModeToggleProps) {
  const [feedbackVisible, setFeedbackVisible] = useState(false);

  const handleChange = (mode: ViewMode) => {
    if (disableGrid && mode === "grid") return;
    onChange(mode);
    setFeedbackVisible(true);
  };

  useEffect(() => {
    if (!feedbackVisible) return;

    const clearFeedback = () => setFeedbackVisible(false);
    document.addEventListener("pointerdown", clearFeedback, true);

    return () => {
      document.removeEventListener("pointerdown", clearFeedback, true);
    };
  }, [feedbackVisible]);

  return (
    <div className="flex shrink-0 items-center gap-2">
      <span className="hidden text-[13px] font-semibold uppercase tracking-[0.08em] text-muted-foreground sm:inline">
        Cambiar vista
      </span>
      <div className="flex border border-border bg-paper" role="group" aria-label={ariaLabel}>
        <button
          type="button"
          onClick={() => handleChange("grid")}
          disabled={disableGrid}
          className={`inline-flex h-9 w-9 items-center justify-center border-r border-border transition-none ${
            value === "grid" ? "bg-[#757575] text-background" : "bg-paper text-muted-foreground"
          } ${feedbackVisible && value === "grid" ? "ring-2 ring-[#3b82f6] ring-inset" : ""} ${
            disableGrid ? "cursor-not-allowed opacity-40" : ""
          }`}
          aria-label="Vista en cuadrícula"
          aria-pressed={value === "grid"}
          aria-disabled={disableGrid}
          title="Vista en cuadrícula"
          style={{ minHeight: "unset", minWidth: "unset" }}
        >
          <Grid2X2 className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => handleChange("compact")}
          className={`inline-flex h-9 w-9 items-center justify-center transition-none ${
            value === "compact" ? "bg-[#757575] text-background" : "bg-paper text-muted-foreground"
          } ${feedbackVisible && value === "compact" ? "ring-2 ring-[#3b82f6] ring-inset" : ""}`}
          aria-label="Vista compacta en lista"
          aria-pressed={value === "compact"}
          title="Vista compacta"
          style={{ minHeight: "unset", minWidth: "unset" }}
        >
          <List className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
