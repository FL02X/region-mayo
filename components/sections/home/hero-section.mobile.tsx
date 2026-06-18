"use client";

import { useEffect, useRef, useState } from "react";
import { Newsreader } from "next/font/google";
import { ArrowRight, MapPin } from "lucide-react";
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
const GPS_CTA_COLOR = "";
const HERO_WATERMARK_LEFT = "84%";
const HERO_WATERMARK_TOP = "73%";
const HERO_WATERMARK_LAYER_HEIGHT = "170px";
const HERO_WATERMARK_OPACITY = 1;
const MOBILE_HERO_IMAGE_WIDTH = 1242;
const editorialFont = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  preload: false,
});

export function MobileHero({
  src = MOBILE_HERO_FALLBACK_SRC,
  alt = "Imagen principal móvil",
  templos,
}: MobileHeroProps) {
  const safeInitialSrc = getMobileHeroImageSrc(src);
  const [displaySrc, setDisplaySrc] = useState(safeInitialSrc);
  const geolocation = useGeolocationState();
  const [locationPhase, setLocationPhase] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [locationError, setLocationError] = useState("");
  const [locationErrorVisible, setLocationErrorVisible] = useState(false);
  const [locationErrorKind, setLocationErrorKind] = useState<
    "permission_denied" | "gps_off" | "timeout" | "unsupported" | "unknown"
  >("unknown");
  const [nearestChurchName, setNearestChurchName] = useState("");
  const [nearestChurchId, setNearestChurchId] = useState("");
  const [nearestChurchDistanceKm, setNearestChurchDistanceKm] = useState<
    number | null
  >(null);
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
    kind:
      | "permission_denied"
      | "gps_off"
      | "timeout"
      | "unsupported"
      | "unknown",
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

      const nearest = await findNearestChurch(
        location.lat,
        location.lng,
        templos,
      );

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
    <section
      className="md:hidden w-full max-w-[950px] mx-auto bg-white"
      aria-label="Imagen principal móvil"
    > 
    {/* mobile-hero-print-image */}
      <div className="relative w-full aspect-[1.65] bg-black overflow-hidden flex items-center justify-center">
        <img
          src={displaySrc}
          alt={alt}
          data-offline-required="true"
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

      <div
        data-mobile-hero-title-band
        className="paper-cut-y relative z-10 -mt-[10px] w-full bg-[#21252b] border-[#000000] px-5 pb-3 pt-3 font-sans text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-10px_18px_rgba(20,35,50,0.10)]"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 overflow-visible"
          style={{ height: HERO_WATERMARK_LAYER_HEIGHT }}
        >
          {/* <img
            src="/images/logo_hero2.png"
            alt=""
            aria-hidden="true"
            className="pointer-events-none absolute h-[105px] w-[105px] select-none object-contain"
            style={{
              left: "85%",
              top: "74%",
              opacity: 0.9,
              transform: "translate(-50%, -50%)",
            }}
          /> */}
          <span
            className="absolute h-[155px] w-[155px] select-none bg-brand"
            style={{
              left: HERO_WATERMARK_LEFT,
              top: HERO_WATERMARK_TOP,
              opacity: HERO_WATERMARK_OPACITY,
              filter: "",
              transform: "translate(-50%, -50%)",
              WebkitMaskImage: "url('/images/logo_hero.png')",
              maskImage: "url('/images/logo_hero.png')",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "center",
              maskPosition: "center",
              WebkitMaskSize: "contain",
              maskSize: "contain",
            }}
          />
        </div>
        <div className="relative z-10 flex items-center">
          <div className="ml-1 min-w-0">
            <p className="text-[13px] mt-1 leading-tight uppercase tracking-[0.02em] text-white/95">
              Iglesia Gentil de Cristo
            </p>
            <p
              className={`${editorialFont.className} mt-1.5 mb-1.5 text-[36px] pr-[-5px] font-bold text-4xl leading-[1.125] tracking-tight text-white`}
            >
              Calendario de la{" "}
              <span className="block font-normal">Región Mayo</span>
            </p>
            <p className="max-w-[30ch] text-[13px] leading-snug text-white/70 mt-2">
              Eventos, avisos e información de nuestras iglesias de la Región
              Mayo.
            </p>
          </div>
        </div>
        <div className="mt-5 mb-1 flex w-full flex-col items-start">
          <div className="relative w-fit">
            <button
              type="button"
              onClick={handleActivateGps}
              disabled={locationPhase === "loading"}
              data-loading={locationPhase === "loading"}
              className={`gps-gps-button relative z-10 inline-flex w-fit items-center gap-2 rounded-[2px] border-2 px-5 py-3 text-left text-[15px] font-bold leading-none text-white transition-all duration-300 ease-in-out ${
                locationPhase === "success"
                  ? "btn-sucess border-[#4E7A68] text-white shadow-none"
                  : locationPhase === "loading"
                    ? "border-transparent bg-transparent text-white shadow-none"
                    : "border-gray-200/20 bg-transparent hover:border-[#0b6ea6] hover:bg-[#0b6ea6]"
              }`}
              aria-label={
                locationPhase === "success"
                  ? `Ir a ${nearestChurchName}`
                  : "Buscar iglesia más cercana por GPS"
              }
            >
              <span className="relative flex min-w-0 items-center gap-2 ">
                <MapPin
                  className="h-4 w-4 shrink-0 text-white transition-colors duration-300"
                  aria-hidden="true"
                  strokeWidth={2}
                />
                {locationPhase === "success" ? (
                  <span className="flex min-w-0 flex-col items-start gap-1 transition-all duration-300 ease-in-out">
                    <span className="text-[11px] font-semibold leading-none text-white/80">
                      Iglesia más cercana
                    </span>
                    <span className="min-w-0 text-[15px] font-extrabold leading-tight text-white">
                      {nearestChurchName} · {nearestChurchDistanceKm ?? 0} km
                    </span>
                  </span>
                ) : (
                  <span className="min-w-0 transition-all duration-300 ease-in-out">
                    {locationPhase === "loading"
                      ? "Buscando iglesia cercana..."
                      : "Ubicar la iglesia más cercana"}
                  </span>
                )}
              </span>
              {locationPhase === "success" ? (
                <ArrowRight
                  className="ml-1 h-7 w-7 shrink-0 text-white/90"
                  aria-hidden="true"
                  strokeWidth={2}
                />
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
              #6b7280,
              #94a3b8,
              #cbd5e1,
              #60a5fa,
              #3b82f6,
              #94a3b8,
              #6b7280
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
        `}</style>
      </div>
    </section>
  );
}

function getMobileHeroImageSrc(value: string | undefined) {
  const source = value?.trim() ? value : MOBILE_HERO_FALLBACK_SRC;
  if (source.startsWith("/")) return source;

  try {
    const url = new URL(source);
    if (url.hostname !== "cdn.sanity.io") return source;

    url.searchParams.set("w", String(MOBILE_HERO_IMAGE_WIDTH));
    url.searchParams.set("q", "58");
    url.searchParams.set("fit", "max");
    url.searchParams.set("auto", "format");
    return url.toString();
  } catch {
    return source;
  }
}
