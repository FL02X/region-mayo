"use client";

// Donde: home, hero superior mobile. 
// Viewports: mobile.
// Funcion: muestra el hero oficial o el anuncio del recorrido actual.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronRightSmall } from "griddy-icons";
import { useGeolocationState } from "@/hooks/use-geolocation-state";
import { findNearestChurch } from "@/lib/location-service";
import type { Templo } from "@/lib/types";
import {
  DISTANCE_ORDER_ENABLED_KEY,
  GPS_HIGHLIGHT_KEY,
  GPS_HIGHLIGHT_USED_KEY,
  getLocationErrorMessage,
  MOBILE_HERO_COPY,
  MOBILE_HERO_FALLBACK_SRC,
  SHOW_DISTANCE_BADGES_KEY,
  SKIP_ONLINE_TOAST_KEY,
  type LocationErrorKind,
} from "@/components/sections/home/hero-section/mobile-hero-config";
import {
  MobileHeroGpsButton,
  MobileHeroGpsError,
  MobileHeroImage,
  MobileHeroTitleBand,
} from "@/components/sections/home/hero-section/mobile-hero-frontend";
import { getMobileHeroImageSrc } from "@/components/sections/home/hero-section/mobile-hero-image-utils";

interface MobileHeroProps {
  src?: string;
  alt?: string;
  templos: Templo[];
  announcement?: {
    year: number;
    imageUrl: string;
  } | null;
}

export function MobileHero({
  src = MOBILE_HERO_FALLBACK_SRC,
  alt = MOBILE_HERO_COPY.fallbackAlt,
  templos,
  announcement,
}: MobileHeroProps) {
  const safeInitialSrc = getMobileHeroImageSrc(announcement?.imageUrl ?? src);
  const [displaySrc, setDisplaySrc] = useState(safeInitialSrc);
  const geolocation = useGeolocationState();
  const [locationPhase, setLocationPhase] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [locationError, setLocationError] = useState("");
  const [locationErrorVisible, setLocationErrorVisible] = useState(false);
  const [locationErrorKind, setLocationErrorKind] =
    useState<LocationErrorKind>("unknown");
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
    kind: LocationErrorKind,
    message: string,
  ) => {
    setLocationErrorKind(kind);
    setLocationError(message);
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
      aria-label={MOBILE_HERO_COPY.sectionLabel}
    > 
    {/* mobile-hero-print-image */}
      <MobileHeroImage
        src={displaySrc}
        alt={
          announcement
            ? `Recorrido Regional ${announcement.year}`
            : alt
        }
        onFallback={() => {
          if (displaySrc !== MOBILE_HERO_FALLBACK_SRC) {
            setDisplaySrc(MOBILE_HERO_FALLBACK_SRC);
          }
        }}
      />

      <MobileHeroTitleBand announcementYear={announcement?.year}>
        <div className="mt-5 mb-1 flex w-full flex-col items-start">
          <div className="relative w-fit">
            {announcement ? (
              <Link
                href={`/recorrido-mayo-${announcement.year}`}
                className="relative z-10 inline-flex w-fit items-center gap-2 rounded-[2px] border-2 border-brand-green px-5 py-2.5 text-left text-[16px] font-bold tracking-wide text-white transition-colors bg-brand-green hover:bg-brand-green-hover active:bg-brand-green-active"
              >
                QUIERO ASISTIR
                <ChevronRightSmall
                  className="h-[1em] w-[1em] shrink-0"
                  aria-hidden="true"
                />
              </Link>
            ) : (
              <MobileHeroGpsButton
                locationPhase={locationPhase}
                nearestChurchName={nearestChurchName}
                nearestChurchDistanceKm={nearestChurchDistanceKm}
                onClick={handleActivateGps}
              />
            )}
          </div>

          {!announcement && (
            <MobileHeroGpsError
              message={getLocationErrorMessage(locationErrorKind, locationError)}
              isVisible={locationErrorVisible}
            />
          )}
        </div>
      </MobileHeroTitleBand>
    </section>
  );
}
