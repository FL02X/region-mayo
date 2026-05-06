"use client";

import { formatDistanceAndTime } from "@/lib/geo-utils";
import { DistanceResult } from "@/lib/location-service";

interface DistanceBadgeProps {
  distance: DistanceResult | null;
  show: boolean;
}

/**
 * Small badge showing distance and travel time
 * Positioned bottom-right on temple cards
 * Only shows if user has granted GPS permission
 */
export function DistanceBadge({ distance, show }: DistanceBadgeProps) {
  if (!show || !distance) return null;

  return (
    <div
      className="
        absolute bottom-3 right-3
        bg-black/75 text-white
        px-2.5 py-1.5
        rounded-[3px]
        text-[10px] md:text-[11px]
        font-medium
        leading-tight
        backdrop-blur-sm
        pointer-events-none
      "
      aria-label={`Distancia: ${formatDistanceAndTime(distance)}`}
    >
      <div className="flex items-center gap-1">
        <span>{distance.km} km</span>
        <span className="text-white/70">·</span>
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
