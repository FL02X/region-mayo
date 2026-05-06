import { useEffect, useState } from "react";
import { findNearestChurches } from "@/lib/location-service";
import { DistanceResult } from "@/lib/location-service";
import type { Templo } from "@/lib/types";

interface DistanceMap {
  [temploId: string]: DistanceResult;
}

/**
 * Hook to calculate distances from user location to nearby churches
 * Only works if user has granted GPS permission previously
 */
export function useNearbyChurchDistances(
  templos: Templo[]
): {
  distances: DistanceMap;
  loading: boolean;
  error: string | null;
  hasPermission: boolean;
} {
  const [distances, setDistances] = useState<DistanceMap>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    const calculateDistances = async () => {
      // Check if user has previously granted permission
      const cachedLocation = localStorage.getItem(
        "region-mayo-geolocation-cache"
      );
      const permissionDenied = localStorage.getItem(
        "region-mayo-geolocation-permission"
      );

      if (permissionDenied === "denied" || !cachedLocation) {
        setHasPermission(false);
        return;
      }

      try {
        const { location, timestamp } = JSON.parse(cachedLocation);
        const now = Date.now();
        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

        // Check if cache is still valid
        if (now - timestamp > thirtyDaysMs) {
          setHasPermission(false);
          localStorage.removeItem("region-mayo-geolocation-cache");
          return;
        }

        setHasPermission(true);
        setLoading(true);

        // Find 3 nearest churches
        const nearest = await findNearestChurches(
          location.lat,
          location.lng,
          templos,
          3
        );

        // Build distance map
        const distanceMap: DistanceMap = {};
        nearest.forEach(({ church, distance }) => {
          distanceMap[church.id] = distance;
        });

        setDistances(distanceMap);
        setError(null);
      } catch (err) {
        console.error("Error calculating distances:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        setHasPermission(false);
      } finally {
        setLoading(false);
      }
    };

    calculateDistances();
  }, [templos]);

  return {
    distances,
    loading,
    error,
    hasPermission,
  };
}
