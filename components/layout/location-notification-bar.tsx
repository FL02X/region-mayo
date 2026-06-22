"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, ExternalLink } from "lucide-react";
import { useGeolocationState } from "@/hooks/use-geolocation-state";
import { findNearestChurch } from "@/lib/location-service";
import { formatDistanceAndTime } from "@/lib/geo-utils";
import type { Templo } from "@/lib/types";

const DISTANCE_ORDER_ENABLED_KEY = "region-mayo-templos-distance-order-enabled";
const SHOW_DISTANCE_BADGES_KEY = "region-mayo-templos-show-distance-badges";
const GPS_HIGHLIGHT_KEY = "region-mayo-templos-gps-highlight";
const GPS_HIGHLIGHT_USED_KEY = "region-mayo-templos-gps-highlight-consumed";
const SKIP_ONLINE_TOAST_KEY = "rm-skip-online-toast";
const MOBILE_HEADER_OFFSET = 51;
const FALLBACK_BAR_HEIGHT = 56;
const VISIBLE_BUFFER_PX = 6;

function isPwaStandalone() {
  if (typeof window === "undefined") return false;

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

type BarState =
  | "initial" 
  | "loading" 
  | "success" 
  | "error";

interface LocationNotificationBarProps {
  templos: Templo[];
}

export function LocationNotificationBar({
  templos,
}: LocationNotificationBarProps) {
  // La feature queda apagada desde aqui para conservar la integracion sin mostrar la barra al usuario.
  const shouldRenderLocationBar = false;
  const geolocation = useGeolocationState();
  const [barState, setBarState] = useState<BarState>("initial");
  const [nearestChurch, setNearestChurch] = useState<Templo | null>(null);
  const [nearestDistance, setNearestDistance] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isVisible, setIsVisible] = useState(false);
  const [contentHeight, setContentHeight] = useState(FALLBACK_BAR_HEIGHT);
  const [isStandalone, setIsStandalone] = useState<boolean | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");
    const syncStandaloneMode = () => {
      setIsStandalone(isPwaStandalone());
    };

    syncStandaloneMode();
    standaloneQuery.addEventListener("change", syncStandaloneMode);

    return () => {
      standaloneQuery.removeEventListener("change", syncStandaloneMode);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, 500);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const element = contentRef.current;
    if (!element) return;

    const measure = () => {
      setContentHeight(Math.max(element.scrollHeight, FALLBACK_BAR_HEIGHT));
    };

    measure();

    if (typeof ResizeObserver === "undefined") {
      const raf = window.requestAnimationFrame(measure);
      return () => window.cancelAnimationFrame(raf);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);

    return () => observer.disconnect();
  }, [barState, errorMessage]);

  const handleRequestPermission = async () => {
    setBarState("loading");

    try {
      const location = await (geolocation as any).requestGeolocation();

      try {
        sessionStorage.setItem(SKIP_ONLINE_TOAST_KEY, "true");
      } catch {
        // Si storage falla en modo privado, la busqueda GPS igual puede continuar.
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const nearest = await findNearestChurch(
        location.lat,
        location.lng,
        templos
      );

      if (nearest) {
        setNearestChurch(nearest.church);
        setNearestDistance(formatDistanceAndTime(nearest.distance));
        setBarState("success");
      } else {
        setErrorMessage("No encontramos iglesias con coordenadas configuradas cerca de ti.");
        setBarState("error");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : "Ha ocurrido un error inesperado al buscar la ubicación.";
      setErrorMessage(errorMsg);
      setBarState("error");
    }
  };

  const handleSuccessClick = () => {
    if (nearestChurch) {
      try {
        localStorage.setItem(DISTANCE_ORDER_ENABLED_KEY, "true");
        sessionStorage.setItem(SHOW_DISTANCE_BADGES_KEY, "true");
        sessionStorage.setItem(GPS_HIGHLIGHT_KEY, nearestChurch.id);
        sessionStorage.removeItem(GPS_HIGHLIGHT_USED_KEY);
      } catch {
        // Si storage falla, solo se pierde el orden visual por distancia.
      }
      setTimeout(() => {
        window.location.href = `/templos#${nearestChurch.id}`;
      }, 500);
    }
  };

  const containerHeight = isVisible
    ? contentHeight + MOBILE_HEADER_OFFSET + VISIBLE_BUFFER_PX
    : 0;
  const containerMarginBottom = isVisible ? -MOBILE_HEADER_OFFSET : 0;

  if (isStandalone !== false) {
    return null;
  }

  if (!shouldRenderLocationBar) {
    return null;
  }

  return (
    <div
      className="w-full md:max-w-[950px] md:mx-auto relative z-[55] overflow-hidden transition-[height,margin-bottom] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[height,margin-bottom] md:[--location-header-offset:45px] [--location-header-offset:51px]"
      style={{
        height: `${containerHeight}px`,
        marginBottom: `${containerMarginBottom}px`,
      }}
    >
      <div
        ref={contentRef}
        className="w-full absolute top-[var(--location-header-offset)] left-0 transition-[opacity,transform] duration-300 pointer-events-auto"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(-10px)",
        }}
      >
        <div className={`w-full shadow-md ${barState === 'success' ? 'bg-green-600 border border-white/0' : 'bg-[#2f5e93] border-b border-[#2f5e93]/30'}`}>
          <div className="w-full text-white flex items-center justify-between min-h-[56px] px-4 md:px-6 py-2.5 gap-3 md:gap-4">
            
            <style>{`
              @keyframes pulse-breathing {
                0%, 100% { opacity: 0.6; }
                50% { opacity: 1; }
              }
              .pulse-text { animation: pulse-breathing 1.5s ease-in-out infinite; }
            `}</style>

            {/* Icon section */}
            <div className="shrink-0 flex items-center justify-center">
              <MapPin className="h-[22px] mb-1 w-[22px] md:h-6 md:w-6 text-white" aria-hidden="true" strokeWidth={1.5} />
            </div>

            {/* Content section */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              {barState === "initial" && (
                <>
                  <p className="text-[14px] md:text-[14.5px] leading-tight font-medium text-white mb-[3px]">
                    Busca nuestra iglesia más cercana a ti.
                  </p>
                  <button
                    onClick={handleRequestPermission}
                    className="inline-flex items-center justify-start gap-1.5 w-fit text-[12px] md:text-[13px] font-semibold text-blue-200 hover:text-white transition-colors underline underline-offset-[3px] decoration-blue-200/50 hover:decoration-white touch-manipulation py-1"
                    aria-label="Dar permiso de usar mi ubicación GPS"
                  >
                    <span className="truncate">Dar permiso de usar mi ubicacion GPS</span>
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                  </button>
                </>
              )}

              {barState === "loading" && (
                <div className="flex items-center min-h-[44px]">
                  <p className="text-[13px] md:text-[14px] font-medium pulse-text">Buscando...</p>
                </div>
              )}

              {barState === "success" && (
                <button
                  onClick={handleSuccessClick}
                  className="w-full text-left bg-transparent hover:bg-green-500/10 transition-colors px-3 py-2 rounded-[3px] touch-manipulation flex flex-col items-start justify-center gap-0.5 border border-white/500"
                  aria-label={`Ir a ${nearestChurch?.temploName} - ${nearestDistance}`}
                >
                  <div className="w-full">
                    <p className="text-[13px] md:text-[14px] font-medium text-white leading-tight whitespace-nowrap">
                      <span className="opacity-90">{nearestDistance}</span>
                    </p>
                  </div>
                  <div className="w-full flex items-center gap-1 min-w-0">
                    <span className="text-[13px] md:text-[14px] font-semibold text-white leading-tight truncate min-w-0">
                      {nearestChurch?.temploName}
                    </span>
                    <ExternalLink className="h-4 w-4 text-white/90 shrink-0" aria-hidden="true" />
                  </div>
                </button>
              )}

              {barState === "error" && (
                <div className="flex flex-col justify-center min-h-[44px]">
                  <p className="text-[12px] md:text-[13px] font-medium text-orange-100 leading-tight">
                    {errorMessage}
                  </p>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
