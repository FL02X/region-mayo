"use client";

import { useEffect, useState, useRef } from "react";
import { MapPin, ExternalLink, X } from "lucide-react";
import { useGeolocationState } from "@/hooks/use-geolocation-state";
import { findNearestChurch } from "@/lib/location-service";
import { formatDistanceAndTime } from "@/lib/geo-utils";
import type { Templo } from "@/lib/types";

type BarState =
  | "initial" 
  | "loading" 
  | "success" 
  | "error" 
  | "dismissed";

interface LocationNotificationBarProps {
  templos: Templo[];
}

export function LocationNotificationBar({
  templos,
}: LocationNotificationBarProps) {
  const geolocation = useGeolocationState();
  const [barState, setBarState] = useState<BarState>("initial");
  const [isVisible, setIsVisible] = useState(false);
  const [nearestChurch, setNearestChurch] = useState<Templo | null>(null);
  const [nearestDistance, setNearestDistance] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number>(0);

  // Resize observer to get accurate height for smooth transition
  useEffect(() => {
    if (!contentRef.current) return;
    const observer = new ResizeObserver((entries) => {
      setContentHeight(entries[0].target.scrollHeight);
    });
    observer.observe(contentRef.current);
    return () => observer.disconnect();
  }, [barState, errorMessage]);

  useEffect(() => {
    // DEBUG: Comentadas todas las verificaciones para que la barra siempre aparezca durante las demostraciones a clientes
    /*
    const dismissedThisSession = sessionStorage.getItem("region-mayo-location-bar-dismissed");
    
    if (geolocation.permissionDenied || geolocation.permissionGranted || dismissedThisSession === "true") {
      setBarState("dismissed");
      setIsVisible(false);
      return;
    }
    */

    // Resetear el estado en caso de que cambien los props y queremos que reaparezca (modo debug)
    // Solo ejecutamos esto al cargar el componente (montaje inicial) para evitar que
    // se formatee el estado de error cuando hook cambia sus valores de permiso.
    const timer = setTimeout(() => {
      setBarState(prev => prev === "initial" ? "initial" : prev);
      setIsVisible(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []); // <-- Removidas dependencias problemáticas que reseteaban el error

  const handleRequestPermission = async () => {
    setBarState("loading");

    try {
      const location = await (geolocation as any).requestGeolocation();

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

  const handleDismiss = () => {
    setIsVisible(false);
    // DEBUG: Comentado el guardado en sessionStorage para seguir probando la barra
    // sessionStorage.setItem("region-mayo-location-bar-dismissed", "true");
    setTimeout(() => {
      setBarState("dismissed");
    }, 500); // Wait for transition
  };

  const handleSuccessClick = () => {
    if (nearestChurch) {
      setIsVisible(false); // Hide bar after click on success
      setTimeout(() => {
        window.location.href = `/templos#${nearestChurch.id}`;
      }, 500);
    }
  };

  if (barState === "dismissed") {
    return null;
  }

  // Determine actual height for smooth transition. 
  // Add margin values (51px on mobile, 45px on desktop) to the total height when visible.
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
  const marginTop = isDesktop ? 45 : 51;
  const containerHeight = isVisible ? (contentHeight + marginTop) : 0;
  const containerMarginBottom = isVisible ? -marginTop : 0;

  return (
    <div
      className="w-full md:max-w-[950px] md:mx-auto relative z-[55] overflow-hidden transition-[height,margin-bottom] duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-[height,margin-bottom]"
      style={{ height: `${containerHeight}px`, marginBottom: `${containerMarginBottom}px` }}
    >
      <div 
        ref={contentRef}
        className="w-full absolute top-[51px] md:top-[45px] left-0 transition-[opacity,transform] duration-300 pointer-events-auto"
        style={{ 
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? 'translateY(0)' : 'translateY(-10px)'
        }}
      >
        <div className="w-full bg-[#2f5e93] shadow-md border-b border-[#2f5e93]/30">
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
              <MapPin className="h-[22px] w-[22px] md:h-6 md:w-6 text-white" aria-hidden="true" strokeWidth={1.5} />
            </div>

            {/* Content section */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              {barState === "initial" && (
                <>
                  <p className="text-[13.5px] md:text-[14.5px] leading-tight font-medium text-white mb-[3px]">
                    Busca la iglesia mas cercana a ti
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
                  className="w-full text-left bg-green-600 hover:bg-green-500 transition-colors px-3 py-2 -ml-2 rounded-[3px] touch-manipulation flex items-center"
                  aria-label={`Ir a ${nearestChurch?.temploName} - ${nearestDistance}`}
                >
                  <p className="text-[13px] md:text-[14px] font-medium text-white leading-tight">
                    <span className="opacity-90">{nearestDistance}</span><br className="md:hidden" />
                    <span className="hidden md:inline"> - </span>
                    <span className="font-semibold">{nearestChurch?.temploName}</span>
                  </p>
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

            {/* Close button */}
            {barState !== "success" && (
              <div className="shrink-0 flex items-center justify-center border-l border-white/20 pl-3 md:pl-4">
                <button
                  onClick={handleDismiss}
                  className="flex items-center justify-center h-9 w-9 text-white/80 hover:text-white hover:bg-black/10 transition-colors touch-manipulation rounded-full active:scale-95"
                  aria-label="Cerrar notificación"
                >
                   <X className="h-[20px] w-[20px] md:h-5 md:w-5" aria-hidden="true" strokeWidth={2} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
