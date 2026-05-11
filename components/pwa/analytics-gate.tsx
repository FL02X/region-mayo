"use client";

import { useEffect, useState } from "react";
import { Analytics } from "@vercel/analytics/next";
import { onPreferenceChange, readAnalyticsOptIn } from "@/lib/preferences";

export function AnalyticsGate() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(readAnalyticsOptIn());

    const stopListening = onPreferenceChange((detail) => {
      if (detail.key === "rm-analytics-opt-in") {
        setEnabled(detail.value === "true");
      }
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key === "rm-analytics-opt-in") {
        setEnabled(event.newValue === "true");
      }
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      stopListening();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  if (!enabled) return null;
  return <Analytics />;
}
