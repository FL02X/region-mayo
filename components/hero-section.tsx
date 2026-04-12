"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Playfair_Display } from "next/font/google";
import { Calendar, ExternalLink, MapPin, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegistrationModal } from "@/components/registration-modal";
import { useTime } from "@/lib/time-context";
import { calculateCountdown } from "@/lib/countdown-utils";
import type { Event, HeroImage, RegionPresident } from "@/lib/types";

const heroTitleFont = Playfair_Display({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
  preload: false,
});

interface HeroSectionProps {
  heroImages?: HeroImage[];
  nextEvent?: Event | null;
  regionPresident: RegionPresident | null;
}

function CompactCountdownCell({ value, label }: { value: number; label: string }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value === displayValue) return;

    setIsAnimating(true);
    const swapTimer = window.setTimeout(() => setDisplayValue(value), 120);
    const endTimer = window.setTimeout(() => setIsAnimating(false), 280);

    return () => {
      window.clearTimeout(swapTimer);
      window.clearTimeout(endTimer);
    };
  }, [value, displayValue]);

  return (
    <div className="py-2.5 text-center">
      <div
        className={`text-[24px] font-bold text-[#1f2833] tabular-nums leading-none transition-transform duration-200 ${
          isAnimating ? "-translate-y-[1px] scale-[0.97]" : "translate-y-0 scale-100"
        }`}
      >
        {String(displayValue).padStart(2, "0")}
      </div>
      <p className="text-[9px] text-[#5b6876] uppercase tracking-[0.14em] mt-1 font-semibold">{label}</p>
    </div>
  );
}

export function HeroSection({ heroImages, nextEvent, regionPresident }: HeroSectionProps) {
  const SLIDE_INTERVAL_MS = 5000;
  const SLIDE_DURATION_MS = 650;
  const [isDesktop, setIsDesktop] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [incomingIndex, setIncomingIndex] = useState<number | null>(null);
  const [isSliding, setIsSliding] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const { currentTime } = useTime();

  const countdownData = useMemo(() => {
    if (!nextEvent) return null;
    return calculateCountdown(nextEvent, currentTime);
  }, [nextEvent, currentTime]);

  const slides = useMemo(() => {
    const cmsSlides = (heroImages ?? [])
      .map((img) => ({
        url: img?.url,
        alt: img?.alt || "Imagen del hero",
      }))
      .filter((img): img is { url: string; alt: string } => Boolean(img.url));

    if (cmsSlides.length > 0) {
      return cmsSlides;
    }

    return [{ url: "/images/event-conference.jpg", alt: "Evento Región Mayo" }];
  }, [heroImages]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const query = window.matchMedia("(min-width: 768px)");
    setIsDesktop(query.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setIsDesktop(event.matches);
    };

    query.addEventListener("change", handleChange);
    return () => {
      query.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop || slides.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setIncomingIndex((prevIncoming) => {
        if (prevIncoming !== null) return prevIncoming;

        const next = (currentIndex + 1) % slides.length;
        setIsSliding(false);
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setIsSliding(true));
        });
        return next;
      });
    }, SLIDE_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [currentIndex, isDesktop, slides.length]);

  useEffect(() => {
    if (incomingIndex === null || !isSliding) return;

    const timeoutId = window.setTimeout(() => {
      setCurrentIndex(incomingIndex);
      setIncomingIndex(null);
      setIsSliding(false);
    }, SLIDE_DURATION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [incomingIndex, isSliding]);

  if (!isDesktop) {
    return null;
  }

  const scrollToContent = () => {
    const header = document.querySelector("header");
    const headerOffset = header instanceof HTMLElement ? header.offsetHeight : 0;

    const countdownSection = document.querySelector("[data-countdown-section]");
    const isCountdownVisible =
      countdownSection instanceof HTMLElement &&
      countdownSection.offsetParent !== null;

    if (isCountdownVisible) {
      const offsetPosition =
        countdownSection.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      return;
    }
    const calendarSection = document.getElementById("calendario");
    if (calendarSection) {
      const offsetPosition =
        calendarSection.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  const formatDate = (date: Date) => {
    const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} · ${date.getFullYear()}`;
  };

  const timeUnits = countdownData
    ? [
        { value: countdownData.daysRemaining, label: "Días" },
        { value: countdownData.hoursRemaining, label: "Hrs" },
        { value: countdownData.minutesRemaining, label: "Min" },
        { value: countdownData.secondsRemaining, label: "Seg" },
      ]
    : [];

  return (
    <div className="w-full relative bg-[#f1f1f1]">
      <div className="max-w-[950px] mx-auto bg-[var(--surface-pane)] md:border-x border-[#dce2e9] dark:border-[#27272a] shadow-[0_0_10px_rgba(0,0,0,0.045)] dark:shadow-none">
        <section
          className="relative overflow-hidden h-[min(60vh,480px)] md:h-[420px] min-h-[280px]"
          aria-label="Bienvenida a Región Mayo"
        >
          <div className="absolute inset-0">
            <Image
              key={`hero-current-${currentIndex}`}
              src={slides[currentIndex].url}
              alt={slides[currentIndex].alt}
              fill
              sizes="(min-width: 768px) 100vw"
              className={`object-cover pointer-events-none select-none transition-transform duration-[650ms] ease-out ${
                incomingIndex !== null && isSliding ? "-translate-x-[8%]" : "translate-x-0"
              }`}
              priority
              loading="eager"
              fetchPriority="high"
              quality={75}
              draggable={false}
            />
          </div>

          {incomingIndex !== null && (
            <div
              className={`absolute inset-0 transition-transform duration-[650ms] ease-out ${
                isSliding ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <Image
                key={`hero-incoming-${incomingIndex}`}
                src={slides[incomingIndex].url}
                alt={slides[incomingIndex].alt}
                fill
                sizes="(min-width: 768px) 100vw"
                className="object-cover pointer-events-none select-none"
                loading="eager"
                fetchPriority="high"
                quality={75}
                draggable={false}
              />
            </div>
          )}

          <div
            className="absolute inset-0 bg-gray-900/60 pointer-events-none"
            aria-hidden="true"
          />

          <div className="relative z-10 h-full flex items-center px-5 md:px-6 pt-[52px] md:pt-[46px] pb-5">
            <div className="w-full grid md:grid-cols-[minmax(290px,390px)_1fr] gap-4 md:gap-5 items-center">
              <div className="hidden md:block">
                {nextEvent && (
                  <article className="bg-white/93 backdrop-blur-[1px] shadow-[0_8px_20px_rgba(0,0,0,0.2)] p-4 rounded-[2px]">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#2f5e93] mb-2">
                      Próximo Evento
                    </p>
                    <h3 className="text-[34px] font-bold text-[#1f2833] leading-[1.04] mb-2.5 line-clamp-2">
                      {nextEvent.title}
                    </h3>
                    <div className="space-y-1.5 text-[13px] text-[#425060] mb-3.5">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>{formatDate(nextEvent.date)} · {nextEvent.time}</span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        {nextEvent.googleMapsUrl ? (
                          <button
                            onClick={() => window.open(nextEvent.googleMapsUrl!, "_blank")}
                            className="inline-flex items-center gap-1 min-w-0 text-left text-[#2f5e93] hover:text-[#264d79] transition-colors"
                            aria-label="Abrir ubicación del próximo evento en Google Maps"
                          >
                            <span className="truncate">{nextEvent.address || nextEvent.location}</span>
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          </button>
                        ) : (
                          <span className="truncate">{nextEvent.address || nextEvent.location}</span>
                        )}
                      </div>
                    </div>

                    {countdownData && !countdownData.isPostEvent && (
                      <div className="grid grid-cols-4 border border-[#d5dbe3] divide-x divide-[#d5dbe3] bg-white/95 mb-3">
                        {timeUnits.map((unit) => (
                          <CompactCountdownCell
                            key={unit.label}
                            value={unit.value}
                            label={unit.label}
                          />
                        ))}
                      </div>
                    )}

                    {nextEvent.registrationEnabled !== false && (
                      <Button
                        onClick={() => setIsRegisterModalOpen(true)}
                        className="w-full h-10 text-[13px] font-extrabold tracking-[0.04em] bg-[#2f5e93] hover:bg-[#284e79] text-white rounded-[2px]"
                      >
                        REGISTRARSE
                      </Button>
                    )}
                  </article>
                )}
              </div>

              <div className="w-full max-w-[360px] text-center md:text-left md:justify-self-end flex flex-col justify-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/85 mb-2 opacity-75">
                  Sitio Oficial 2026
                </p>
                <h1 className={`${heroTitleFont.className} text-[2.05rem] sm:text-[2.45rem] font-semibold text-white mb-5 leading-[1.04] tracking-[0.01em] [text-shadow:0_3px_16px_rgba(0,0,0,0.45)]`}>
                  <span className="block">Calendario</span>
                  <span className="block">Región Mayo</span>
                </h1>
                <button
                  onClick={scrollToContent}
                  className="w-full group flex items-center justify-start gap-2 text-[15px] font-semibold text-white/90 hover:text-white transition-colors py-3 opacity-75"
                  aria-label="Explorar calendario y desplazarse hacia abajo"
                >
                  Explorar Calendario 2026
                  <ChevronDown className="h-5 w-5 text-white/70 group-hover:text-white group-hover:translate-y-1 transition-all" aria-hidden="true" />
                </button>

                {slides.length > 1 && (
                  <div className="mt-5 flex items-center justify-center md:justify-start gap-2 opacity-75" aria-label="Indicador de carrusel">
                    {slides.map((_, index) => {
                      const isActive = index === (incomingIndex ?? currentIndex);
                      return (
                        <span
                          key={`hero-dot-${index}`}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            isActive ? "w-5 bg-white" : "w-1.5 bg-white/55"
                          }`}
                          aria-hidden="true"
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dark overlay for text on right side */}
          <div
            className="absolute top-0 right-0 bottom-0 w-[70%] bg-gradient-to-l from-black/60 via-black/30 to-transparent pointer-events-none"
            aria-hidden="true"
          />

          {nextEvent && (
            <RegistrationModal
              event={nextEvent}
              isOpen={isRegisterModalOpen}
              onClose={() => setIsRegisterModalOpen(false)}
              regionPresident={regionPresident}
            />
          )}
        </section>
      </div>
    </div>
  );
}
