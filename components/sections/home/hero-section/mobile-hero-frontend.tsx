// Donde: hero mobile de home. Viewports: mobile. Funcion: piezas visuales para imagen, banda de titulo, GPS y estilos del boton.
import type { ReactNode } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import {
  HERO_WATERMARK_LAYER_HEIGHT,
  HERO_WATERMARK_LEFT,
  HERO_WATERMARK_OPACITY,
  HERO_WATERMARK_TOP,
  MOBILE_HERO_COPY,
  MOBILE_HERO_IMAGE_OFFSET_X,
  MOBILE_HERO_IMAGE_OFFSET_Y,
  MOBILE_HERO_IMAGE_ZOOM,
} from "@/components/sections/home/hero-section/mobile-hero-config";

export function MobileHeroImage({
  src,
  alt,
  onFallback,
}: {
  src: string;
  alt: string;
  onFallback: () => void;
}) {
  return (
    <div className="relative w-full aspect-[1.35] bg-black overflow-hidden flex items-center justify-center">
      <img
        src={src}
        alt={alt}
        data-offline-required="true"
        className="h-full w-full object-cover object-center"
        style={{
          transform: `translate(${MOBILE_HERO_IMAGE_OFFSET_X}, ${MOBILE_HERO_IMAGE_OFFSET_Y}) scale(${MOBILE_HERO_IMAGE_ZOOM})`,
        }}
        loading="eager"
        decoding="async"
        fetchPriority="high"
        onError={onFallback}
      />
    </div>
  );
}

export function MobileHeroTitleBand({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div
      data-mobile-hero-title-band
      className="paper-cut-y relative z-10 -mt-[10px] w-full bg-[#21252b] border-[#000000] px-5 pb-6 pt-5 font-sans text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-10px_18px_rgba(20,35,50,0.10)]"
    >
      {/* <MobileHeroWatermark /> */}
      <div className="relative z-10 flex items-center">
        <div className="ml-1 min-w-0">
          <p
            className="text-[13px] mt-1 leading-tight uppercase tracking-[0.02em] text-white/95"
            style={{ fontFamily: '"Neue Montreal", Arial, sans-serif' }}
          >
            {MOBILE_HERO_COPY.eyebrow}
          </p>
          <p
            className="mt-2.5 mb-1.5 text-[34px] pr-[-5px] font-bold text-4xl leading-[1.125] tracking-tight text-white"
            style={{ fontFamily: '"Canela", Georgia, serif' }}
          >
            {MOBILE_HERO_COPY.titlePrefix}{" "}
            <span className="block font-normal">{MOBILE_HERO_COPY.titleRegion}</span>
          </p>
          <p className="max-w-[30ch] text-[13px] leading-snug text-white/70 mt-2">
            {MOBILE_HERO_COPY.description}
          </p>
        </div>
      </div>
      {children}
      <MobileHeroGpsStyles />
    </div>
  );
}

export function MobileHeroGpsButton({
  locationPhase,
  nearestChurchName,
  nearestChurchDistanceKm,
  onClick,
}: {
  locationPhase: "idle" | "loading" | "success" | "error";
  nearestChurchName: string;
  nearestChurchDistanceKm: number | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={locationPhase === "loading"}
      data-loading={locationPhase === "loading"}
      className={`gps-gps-button relative z-10 inline-flex w-fit items-center gap-2 rounded-[2px] border-2 px-5 py-3.5 text-left text-[16px] font-bold text-ink-white transition-all duration-300 ease-in-out ${
        locationPhase === "success"
          ? "btn-sucess border-[#4E7A68] text-ink shadow-none"
          : locationPhase === "loading"
            ? "border-transparent bg-brand-active text-ink shadow-none"
            : "bg-brand hover:bg-brand-hover active:bg-brand-active"
      }`}
      style={{ fontFamily: '"Switzer", Arial, sans-serif' }}
      aria-label={
        locationPhase === "success"
          ? `Ir a ${nearestChurchName}`
          : MOBILE_HERO_COPY.gpsButtonAria
      }
    >
      <span className="relative flex min-w-0 items-center gap-2 ">
        <MapPin
          className="h-5 w-5 shrink-0 text-white transition-colors duration-300"
          aria-hidden="true"
          strokeWidth={2}
        />
        {locationPhase === "success" ? (
          <span className="flex min-w-0 flex-col items-start gap-1 transition-all duration-300 ease-in-out">
            <span className="text-[13px] mb-1 font-normal leading-none tracking-wide text-white/70">
              {MOBILE_HERO_COPY.nearestChurchLabel}
            </span>
            <span className="min-w-0 text-[16px] font-bold leading-normal tracking-normal">
              {nearestChurchName} · {nearestChurchDistanceKm ?? 0} km
            </span>
          </span>
        ) : (
          <span className="min-w-0 transition-all duration-300 ease-in-out">
            {locationPhase === "loading"
              ? MOBILE_HERO_COPY.gpsLoadingLabel
              : MOBILE_HERO_COPY.gpsIdleLabel}
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
  );
}

export function MobileHeroGpsError({
  message,
  isVisible,
}: {
  message: string;
  isVisible: boolean;
}) {
  if (!message) return null;

  return (
    <div
      className={`overflow-hidden transition-all duration-300 ease-out ${
        isVisible
          ? "mt-4 mr-0-5 max-h-20 translate-y-0 opacity-100"
          : "mt-0 max-h-0 -translate-y-2 opacity-0"
      }`}
    >
      <p className="max-w-[90%] pl-1 text-[13px] leading-tight text-red-200/90">
        {message}
      </p>
    </div>
  );
}

function MobileHeroWatermark() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 overflow-visible"
      style={{ height: HERO_WATERMARK_LAYER_HEIGHT }}
    >
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
  );
}

function MobileHeroGpsStyles() {
  return (
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
        padding: 6px;
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
  );
}
