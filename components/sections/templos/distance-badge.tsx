"use client";

import { formatDistanceAndTime } from "@/lib/geo-utils";
import { DistanceResult } from "@/lib/location-service";
import { CarFront, Route } from "lucide-react";

interface DistanceBadgeProps {
  distance: DistanceResult | null;
  show: boolean;
}

/**
 * Small badge showing distance and travel time
 * Positioned bottom-left on mobile and top-left on desktop
 * Only shows if user has granted GPS permission
 */
export function DistanceBadge({ distance, show }: DistanceBadgeProps) {
  if (!show || !distance) return null;

  return (
    <div
      className="
        absolute left-3 bottom-3 md:top-3 md:bottom-auto
        bg-black/75 text-white
        px-2.5 py-2
        rounded-[3px]
        text-[10px] md:text-[11px]
        font-medium
        leading-tight
        backdrop-blur-sm
        pointer-events-none
        shadow-[0_1px_2px_rgba(0,0,0,0.18)]
      "
      aria-label={`Distancia: ${formatDistanceAndTime(distance)}`}
    >
      <div className="flex items-center gap-1.5">
        <Route className="h-3 w-3 shrink-0 text-white/80" aria-hidden="true" />
        <span>{distance.km} km</span>
      </div>
      <div className="mt-0.5 flex items-center gap-1.5">
        <CarFront className="h-3 w-3 shrink-0 text-white/80" aria-hidden="true" />
        <span>{distance.minutes} min</span>
      </div>
      {distance.error && (
        <div className="text-[9px] text-white/50 mt-0.5">
          {distance.error}
        </div>
      )}
    </div>
  );
}
