"use client";

import { useEffect, useRef, useState } from "react";
import { Inter } from "next/font/google";
import { ArrowRight, LocateFixed } from "lucide-react";
import { useGeolocationState } from "@/hooks/use-geolocation-state";
import { findNearestChurch } from "@/lib/location-service";
import type { Templo } from "@/lib/types";

interface MobileHeroProps {
  src?: string;
  alt?: string;
  templos: Templo[];
}

const MOBILE_HERO_FALLBACK_SRC = "/images/event-conference.jpg";
const DISTANCE_ORDER_ENABLED_KEY = "region-mayo-templos-distance-order-enabled";
const SHOW_DISTANCE_BADGES_KEY = "region-mayo-templos-show-distance-badges";
const GPS_HIGHLIGHT_KEY = "region-mayo-templos-gps-highlight";
const GPS_HIGHLIGHT_USED_KEY = "region-mayo-templos-gps-highlight-consumed";
const SKIP_ONLINE_TOAST_KEY = "rm-skip-online-toast";

const bodyFont = Inter({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  fallback: ["Arial", "Arial Unicode MS", "sans-serif"],
});

export function MobileHero({
  src = MOBILE_HERO_FALLBACK_SRC,
  alt = "Imagen principal móvil",
  templos,
}: MobileHeroProps) {
  const safeInitialSrc = src?.trim() ? src : MOBILE_HERO_FALLBACK_SRC;
  const [displaySrc, setDisplaySrc] = useState(safeInitialSrc);
  const geolocation = useGeolocationState();
  const [locationPhase, setLocationPhase] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [locationError, setLocationError] = useState("");
  const [locationErrorVisible, setLocationErrorVisible] = useState(false);
  const [locationErrorKind, setLocationErrorKind] = useState<
    "permission_denied" | "gps_off" | "timeout" | "unsupported" | "unknown"
  >("unknown");
  const [nearestChurchName, setNearestChurchName] = useState("");
  const [nearestChurchId, setNearestChurchId] = useState("");
  const [nearestChurchDistanceKm, setNearestChurchDistanceKm] = useState<number | null>(null);
  const searchStartRef = useRef<number>(0);
  const locationErrorHideTimerRef = useRef<number | null>(null);
  const locationErrorClearTimerRef = useRef<number | null>(null);

  useEffect(() => {
    setDisplaySrc(safeInitialSrc);
  }, [safeInitialSrc]);

  useEffect(() => {
    return () => {
      searchStartRef.current = 0;
      if (locationErrorHideTimerRef.current) {
        window.clearTimeout(locationErrorHideTimerRef.current);
      }
      if (locationErrorClearTimerRef.current) {
        window.clearTimeout(locationErrorClearTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!locationError) return;

    setLocationErrorVisible(true);

    if (locationErrorHideTimerRef.current) {
      window.clearTimeout(locationErrorHideTimerRef.current);
    }
    if (locationErrorClearTimerRef.current) {
      window.clearTimeout(locationErrorClearTimerRef.current);
    }

    locationErrorHideTimerRef.current = window.setTimeout(() => {
      setLocationErrorVisible(false);
      locationErrorClearTimerRef.current = window.setTimeout(() => {
        setLocationError("");
        setLocationErrorKind("unknown");
      }, 260);
    }, 8000);

    return () => {
      if (locationErrorHideTimerRef.current) {
        window.clearTimeout(locationErrorHideTimerRef.current);
      }
      if (locationErrorClearTimerRef.current) {
        window.clearTimeout(locationErrorClearTimerRef.current);
      }
    };
  }, [locationError]);

  const setLocationFailure = (
    kind: "permission_denied" | "gps_off" | "timeout" | "unsupported" | "unknown",
    message: string,
  ) => {
    setLocationErrorKind(kind);
    setLocationError(message);
  };

  const getLocationErrorMessage = () => {
    switch (locationErrorKind) {
      case "permission_denied":
        return "No aceptaste el permiso de ubicación. Actívalo en los ajustes del navegador para continuar.";
      case "gps_off":
        return "Tu GPS parece estar desactivado. Actívalo e inténtalo de nuevo.";
      case "timeout":
        return "No pudimos obtener tu ubicación a tiempo. Revisa el GPS e inténtalo otra vez.";
      case "unsupported":
        return "Tu navegador o dispositivo no cuenta con tecnología de GPS o ubicación.";
      default:
        return locationError;
    }
  };

  const handleActivateGps = async () => {
    if (locationPhase === "success" && nearestChurchId) {
      window.location.href = `/templos#${nearestChurchId}`;
      return;
    }

    if (locationPhase === "loading") return;

    if (locationErrorHideTimerRef.current) {
      window.clearTimeout(locationErrorHideTimerRef.current);
    }
    if (locationErrorClearTimerRef.current) {
      window.clearTimeout(locationErrorClearTimerRef.current);
    }

    searchStartRef.current = performance.now();
    setLocationPhase("loading");
    setLocationError("");
    setLocationErrorVisible(false);
    setNearestChurchName("");
    setNearestChurchId("");
    setNearestChurchDistanceKm(null);

    try {
      const location = await geolocation.requestGeolocation();

      try {
        sessionStorage.setItem(SKIP_ONLINE_TOAST_KEY, "true");
      } catch {
        // Ignore storage failures (private mode, quota)
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const nearest = await findNearestChurch(location.lat, location.lng, templos);

      const elapsedMs = performance.now() - searchStartRef.current;
      const remainingMs = Math.max(0, 2000 - elapsedMs);
      if (remainingMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, remainingMs));
      }

      if (nearest) {
        const distanceLabel = Math.max(1, Math.round(nearest.distance.km));
        const churchName = nearest.church.temploName || "Iglesia cercana";

        try {
          localStorage.setItem(DISTANCE_ORDER_ENABLED_KEY, "true");
          sessionStorage.setItem(SHOW_DISTANCE_BADGES_KEY, "true");
          sessionStorage.setItem(GPS_HIGHLIGHT_KEY, nearest.church.id);
          sessionStorage.removeItem(GPS_HIGHLIGHT_USED_KEY);
        } catch {
          // Ignore storage failures (private mode, quota)
        }

        setNearestChurchName(churchName);
        setNearestChurchId(nearest.church.id);
        setNearestChurchDistanceKm(distanceLabel);
        setLocationPhase("success");
        return;
      }

      setLocationPhase("error");
      setLocationFailure(
        "unknown",
        "No encontramos iglesias con coordenadas configuradas cerca de ti.",
      );
    } catch (error) {
      const requestError = error as Error & { kind?: string };
      const kind =
        requestError.kind === "permission_denied" ||
        requestError.kind === "gps_off" ||
        requestError.kind === "timeout" ||
        requestError.kind === "unsupported"
          ? requestError.kind
          : "unknown";
      const errorMsg =
        kind === "permission_denied"
          ? "No aceptaste el permiso de ubicación. Actívalo en los ajustes del navegador para continuar."
          : kind === "gps_off"
            ? "Tu GPS parece estar desactivado. Actívalo e inténtalo de nuevo."
            : kind === "timeout"
              ? "No pudimos obtener tu ubicación a tiempo. Revisa el GPS e inténtalo otra vez."
              : kind === "unsupported"
                ? "Tu navegador o dispositivo no cuenta con tecnología de GPS o ubicación."
                : error instanceof Error
                  ? error.message
                  : "Ha ocurrido un error inesperado al buscar la ubicación.";
      setLocationPhase("error");
      setLocationFailure(kind, errorMsg);
    }
  };

  return (
    <section className="md:hidden w-full max-w-[950px] mx-auto bg-white" aria-label="Imagen principal móvil">
      <div className="w-full aspect-[4/3] bg-black overflow-hidden flex items-center justify-center">
        <img
          src={displaySrc}
          alt={alt}
          className="h-full w-full object-cover object-center"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          onError={() => {
            if (displaySrc !== MOBILE_HERO_FALLBACK_SRC) {
              setDisplaySrc(MOBILE_HERO_FALLBACK_SRC);
            }
          }}
        />
      </div>

      <div className={`${bodyFont.className} w-full bg-[#21252b] text-white px-5 py-4`}>
        <div className="flex items-center gap-1.5">
          <img
            src="/images/logo_hero.png"
            alt="Logo de Iglesia Gentil de Cristo"
            className="ml-[-9px] h-25 w-25 shrink-0 rounded-[2px] object-contain"
            loading="eager"
            decoding="async"
          />
          <div className="min-w-0 ml-2">
            <p className="text-[12px] mt-1 leading-tight uppercase tracking-[0.02em] text-white/95">
              Iglesia Gentil de Cristo
            </p>
            <p className="font-sans mt-1 mb-1 text-[24px] pr-[-5px] leading-[1.05] font-bold tracking-[0.01em] text-white">
              Sitio oficial de la IGC Region Mayo
            </p>
          </div>
        </div>
        <div className="mt-3 mb-1 flex w-full flex-col items-start">
          <div className="relative w-fit">
            {locationPhase === "loading" ? (
              <span className="gps-burst-ring gps-burst-ring--visible" aria-hidden="true" />
            ) : null}

            <button
              type="button"
              onClick={handleActivateGps}
              disabled={locationPhase === "loading"}
              data-loading={locationPhase === "loading"}
              className={`gps-gps-button inline-flex w-fit items-center gap-2 rounded-[2px] border-2 border-gray-200/20 px-4 py-3 text-left text-[15px] font-bold leading-none transition-all duration-300 ease-in-out ${
                locationPhase === "success"
                  ? "border-[#4d7a68] bg-[#4d7a68] text-white shadow-[0_8px_22px_rgba(26,58,52,0.22)]"
                  : locationPhase === "loading"
                    ? "border-transparent bg-[#21252b] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
                    : "border-[#FFFFFF] bg-transparent text-white hover:bg-white/5"
              }`}
              aria-label={
                locationPhase === "success"
                  ? `Ir a ${nearestChurchName}`
                  : "Buscar iglesia más cercana por GPS"
              }
            >
              <span className="relative flex min-w-0 items-center gap-2 ">
                <LocateFixed
                  className={`h-4 w-4 shrink-0 transition-colors duration-300 ${
                    locationPhase === "success" ? "text-white" : "text-[#FFFFFF]"
                  }`}
                  aria-hidden="true"
                  strokeWidth={2}
                />
                <span className="min-w-0 transition-all duration-300 ease-in-out">
                  {locationPhase === "loading"
                    ? "Buscando..."
                    : locationPhase === "success"
                      ? `Más cercano: ${nearestChurchName} (${nearestChurchDistanceKm ?? 0} km)`
                      : "Buscar iglesia más cercana"}
                </span>
              </span>
              {locationPhase === "success" ? (
                <ArrowRight className="ml-1 h-7 w-7 shrink-0 text-white/90" aria-hidden="true" strokeWidth={2} />
              ) : null}
            </button>
          </div>

          {locationError ? (
            <div
              className={`overflow-hidden transition-all duration-300 ease-out ${
                locationErrorVisible
                  ? "mt-4 mr-0-5 max-h-20 translate-y-0 opacity-100"
                  : "mt-0 max-h-0 -translate-y-2 opacity-0"
              }`}
            >
              <p className="max-w-[90%] pl-1 text-[13px] leading-tight text-red-200/90">
                {getLocationErrorMessage()}
              </p>
            </div>
          ) : null}
        </div>

        <style>{`
          @keyframes gps-burst-shimmer {
            0% {
              opacity: 0;
              transform: scale(0.985);
            }
            50% {
              opacity: 1;
              transform: scale(1);
            }
            100% {
              opacity: 0;
              transform: scale(1.01);
            }
          }

          @keyframes gps-burst-rainbow {
            0% { background-position: 0% 50%; opacity: 0.45; }
            50% { background-position: 100% 50%; opacity: 0.9; }
            100% { background-position: 0% 50%; opacity: 0.45; }
          }

          .gps-gps-button {
            position: relative;
            isolation: isolate;
            overflow: visible;
          }

          .gps-gps-button::before {
            content: "";
            position: absolute;
            inset: -3px;
            z-index: -1;
            border-radius: 2px;
            background: linear-gradient(
              90deg,
              #ff5f6d,
              #ff9a44,
              #ffd93d,
              #7bdcb5,
              #6bcbef,
              #8f7cff,
              #ff5f6d
            );
            background-size: 260% 260%;
            padding: 2px;
            -webkit-mask:
              linear-gradient(#fff 0 0) content-box,
              linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            opacity: 0;
            transform: scale(0.995);
            transition: opacity 320ms ease-in-out, transform 320ms ease-in-out;
          }

          .gps-gps-button:not(:disabled):hover::before {
            opacity: 0;
          }

          .gps-gps-button[data-loading="true"]::before {
            opacity: 1;
            transform: scale(1);
            animation: gps-burst-rainbow 4.2s ease-in-out infinite;
          }

          .gps-gps-button[data-loading="true"] {
            transition:
              border-color 320ms ease-in-out,
              background-color 320ms ease-in-out,
              color 320ms ease-in-out,
              box-shadow 320ms ease-in-out;
          }

          .gps-burst-ring {
            position: absolute;
            inset: -3px;
            border-radius: 4px;
            background: linear-gradient(
              90deg,
              #ff5f6d,
              #ff9a44,
              #ffd93d,
              #7bdcb5,
              #6bcbef,
              #8f7cff,
              #ff5f6d
            );
            background-size: 260% 260%;
            padding: 2px;
            -webkit-mask:
              linear-gradient(#fff 0 0) content-box,
              linear-gradient(#fff 0 0);
            -webkit-mask-composite: xor;
            mask-composite: exclude;
            box-shadow:
              0 0 0 1px rgba(90, 150, 176, 0.22),
              0 0 12px rgba(143, 124, 255, 0.18);
            opacity: 0;
            transform: scale(0.985);
            animation: gps-burst-shimmer 4.2s ease-in-out infinite;
            pointer-events: none;
            transition: opacity 320ms ease-in-out, transform 320ms ease-in-out;
          }

          .gps-burst-ring--visible {
            opacity: 1;
            transform: scale(1);
          }
        `}</style>
      </div>
    </section>
  );
}
