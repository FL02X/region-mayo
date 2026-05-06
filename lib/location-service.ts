import { Templo } from "@/lib/types";

export interface DistanceResult {
  km: number;
  minutes: number;
  error?: string;
}

/**
 * Haversine formula for calculating straight-line distance
 * Fallback when OSRM is unavailable
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculate driving distance and time using OSRM
 * Falls back to Haversine if API fails
 * Uses sessionStorage for caching to avoid duplicate requests
 */
export async function calculateDistanceAndTime(
  userLat: number,
  userLng: number,
  churchLat: number,
  churchLng: number
): Promise<DistanceResult> {
  // Create cache key
  const cacheKey = `osrm-${userLat}-${userLng}-${churchLat}-${churchLng}`;

  // Check sessionStorage cache first
  const cached = sessionStorage.getItem(cacheKey);
  if (cached) {
    try {
      return JSON.parse(cached);
    } catch {
      // Cache invalid, continue to fetch
    }
  }

  try {
    // OSRM API: coordinates are in [longitude, latitude] order
    const url = `https://router.project-osrm.org/route/v1/driving/${userLng},${userLat};${churchLng},${churchLat}?overview=false`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`OSRM API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== "Ok" || !data.routes || data.routes.length === 0) {
      throw new Error("OSRM returned no routes");
    }

    const route = data.routes[0];
    const distanceKm = route.distance / 1000; // Convert meters to km
    const minutes = Math.round(route.duration / 60); // Convert seconds to minutes

    const result: DistanceResult = {
      km: Math.round(distanceKm * 10) / 10, // Round to 1 decimal place
      minutes,
    };

    // Cache result for this session
    sessionStorage.setItem(cacheKey, JSON.stringify(result));
    return result;
  } catch (error) {
    // Fallback to Haversine for straight-line distance
    console.warn("OSRM request failed, falling back to Haversine:", error);

    const distanceKm = haversineDistance(
      userLat,
      userLng,
      churchLat,
      churchLng
    );

    // Estimate travel time: assume average 50 km/h
    const minutes = Math.round((distanceKm / 50) * 60);

    const result: DistanceResult = {
      km: Math.round(distanceKm * 10) / 10,
      minutes,
      error: "Usando distancia aproximada",
    };

    sessionStorage.setItem(cacheKey, JSON.stringify(result));
    return result;
  }
}

/**
 * Find the nearest church from user location
 * Returns the church with the smallest distance
 */
export async function findNearestChurch(
  userLat: number,
  userLng: number,
  churches: Templo[]
): Promise<{
  church: Templo;
  distance: DistanceResult;
} | null> {
  if (!churches || churches.length === 0) return null;

  // We need church coordinates. Assuming they're available in Templo type
  // If not, you'll need to geocode addresses or add coords to Sanity schema
  const churchesWithCoords = churches.filter(
    (c) => c.latitude && c.longitude
  );

  if (churchesWithCoords.length === 0) return null;

  try {
    const distances = await Promise.all(
      churchesWithCoords.map(async (church) => ({
        church,
        distance: await calculateDistanceAndTime(
          userLat,
          userLng,
          church.latitude!,
          church.longitude!
        ),
      }))
    );

    // Sort by distance and return the nearest
    distances.sort((a, b) => a.distance.km - b.distance.km);
    return distances[0];
  } catch (error) {
    console.error("Error finding nearest church:", error);
    return null;
  }
}

/**
 * Find the 3 nearest churches from user location
 */
export async function findNearestChurches(
  userLat: number,
  userLng: number,
  churches: Templo[],
  limit: number = 3
): Promise<
  Array<{
    church: Templo;
    distance: DistanceResult;
  }>
> {
  if (!churches || churches.length === 0) return [];

  const churchesWithCoords = churches.filter(
    (c) => c.latitude && c.longitude
  );

  if (churchesWithCoords.length === 0) return [];

  try {
    const distances = await Promise.all(
      churchesWithCoords.map(async (church) => ({
        church,
        distance: await calculateDistanceAndTime(
          userLat,
          userLng,
          church.latitude!,
          church.longitude!
        ),
      }))
    );

    // Sort by distance and return top N
    distances.sort((a, b) => a.distance.km - b.distance.km);
    return distances.slice(0, limit);
  } catch (error) {
    console.error("Error finding nearest churches:", error);
    return [];
  }
}
