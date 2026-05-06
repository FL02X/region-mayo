import { useEffect, useState } from "react";

export interface UserLocation {
  lat: number;
  lng: number;
}

export interface GeolocationState {
  userLocation: UserLocation | null;
  permissionDenied: boolean;
  permissionGranted: boolean;
  loading: boolean;
  error: string | null;
}

const GEOLOCATION_CACHE_KEY = "region-mayo-geolocation-cache";
const GEOLOCATION_PERMISSION_KEY = "region-mayo-geolocation-permission";
const CACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface CacheData {
  location: UserLocation;
  timestamp: number;
}

/**
 * Hook to manage geolocation state with localStorage caching.
 * - Caches permission status for 30 days
 * - Never asks again if user denies
 * - Returns {userLocation, permissionDenied, permissionGranted, loading, error}
 */
export function useGeolocationState(): GeolocationState & { requestGeolocation: () => Promise<UserLocation> } {
  const [state, setState] = useState<GeolocationState>({
    userLocation: null,
    permissionDenied: false,
    permissionGranted: false,
    loading: false,
    error: null,
  });

  useEffect(() => {
    // Check if permission was previously denied
    const permissionDenied = localStorage.getItem(GEOLOCATION_PERMISSION_KEY);
    if (permissionDenied === "denied") {
      setState(prev => ({ ...prev, permissionDenied: true }));
      return;
    }

    // DEBUG: Comentado chequeo y escritura inicial del estado de permisos nativo
    /*
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then(result => {
        if (result.state === 'granted') {
          setState(prev => ({ ...prev, permissionGranted: true }));
        } else if (result.state === 'denied') {
          localStorage.setItem(GEOLOCATION_PERMISSION_KEY, "denied");
          setState(prev => ({ ...prev, permissionDenied: true }));
        }
      }).catch(() => {
        // Ignore, some browsers might not support permissions query for geolocation
      });
    }
    */

    // Check if we have cached location data
    const cachedData = localStorage.getItem(GEOLOCATION_CACHE_KEY);
    if (cachedData) {
      try {
        const { location, timestamp }: CacheData = JSON.parse(cachedData);
        const now = Date.now();

        // If cache is still valid (within 30 days), use it
        if (now - timestamp < CACHE_DURATION_MS) {
          setState(prev => ({
            ...prev,
            userLocation: location,
            permissionGranted: true, // Since we have cached location, assume granted
          }));
          return;
        }
      } catch {
        // Cache is invalid, clear it
        localStorage.removeItem(GEOLOCATION_CACHE_KEY);
      }
    }
  }, []);

  const requestGeolocation = () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    return new Promise<UserLocation>((resolve, reject) => {
      if (!navigator.geolocation) {
        setState({
          userLocation: null,
          permissionDenied: false,
          permissionGranted: false,
          loading: false,
          error: "Tu navegador o dispositivo no cuenta con tecnología de GPS o ubicación.",
        });
        reject(new Error("Geolocation not supported"));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: UserLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };

          const cacheData: CacheData = {
            location,
            timestamp: Date.now(),
          };
          localStorage.setItem(
            GEOLOCATION_CACHE_KEY,
            JSON.stringify(cacheData)
          );
          localStorage.removeItem(GEOLOCATION_PERMISSION_KEY);

          setState({
            userLocation: location,
            permissionDenied: false,
            permissionGranted: true,
            loading: false,
            error: null,
          });

          resolve(location);
        },
        (error) => {
          let errorMessage = "No fue posible determinar tu ubicación actual. Revisa si tu GPS está encendido.";

          if (error.code === error.PERMISSION_DENIED) {
            errorMessage = "Has denegado el permiso para acceder a tu ubicación. Para usar esta función, actívalo en los ajustes de tu navegador.";
            // DEBUG: Comentado para demostrar la funcionalidad.
            // localStorage.setItem(GEOLOCATION_PERMISSION_KEY, "denied");
            setState({
              userLocation: null,
              permissionDenied: true,
              permissionGranted: false,
              loading: false,
              error: errorMessage,
            });
          } else {
            setState({
              userLocation: null,
              permissionDenied: false,
              permissionGranted: false,
              loading: false,
              error: errorMessage,
            });
          }

          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  return {
    ...state,
    requestGeolocation,
  };
}
