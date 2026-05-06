import { DistanceResult } from "./location-service";

/**
 * Format distance and time for display
 * Example: "5 km · 10 min en coche"
 */
export function formatDistanceAndTime(distance: DistanceResult): string {
  const distText = `${distance.km} km`;
  const timeText = `${distance.minutes} min en coche`;

  return `${distText} · ${timeText}`;
}

/**
 * Format distance only
 * Example: "5 km"
 */
export function formatDistance(km: number): string {
  return `${Math.round(km * 10) / 10} km`;
}

/**
 * Format time only
 * Example: "10 min"
 */
export function formatTime(minutes: number): string {
  return `${minutes} min`;
}

/**
 * Extract coordinates from address using OpenStreetMap Nominatim
 * Free geocoding service, no API key required
 * Use with caution - Nominatim has rate limits
 */
export async function geocodeAddress(address: string): Promise<{
  lat: number;
  lng: number;
} | null> {
  try {
    const params = new URLSearchParams({
      q: address,
      format: "json",
      limit: "1",
    });

    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params}`,
      {
        headers: {
          "User-Agent": "Region-Mayo-App",
        },
      }
    );

    if (!response.ok) throw new Error(`Geocoding failed: ${response.status}`);

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const result = data[0];
    return {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}
