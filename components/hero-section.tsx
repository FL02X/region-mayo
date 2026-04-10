"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { HeroImage } from "@/lib/types";

interface HeroSectionProps {
  heroImages?: HeroImage[];
  heroTitle?: string;
  heroSubtitle?: string;
}

export function HeroSection({
  heroImages,
  heroTitle,
  heroSubtitle,
}: HeroSectionProps) {

  const scrollToContent = () => {
    const countdownSection = document.querySelector("[data-countdown-section]");
    if (countdownSection) {
      const offsetPosition =
        countdownSection.getBoundingClientRect().top + window.scrollY - 54;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
      return;
    }
    const calendarSection = document.getElementById("calendario");
    if (calendarSection) {
      const offsetPosition =
        calendarSection.getBoundingClientRect().top + window.scrollY - 54;
      window.scrollTo({ top: offsetPosition, behavior: "smooth" });
    }
  };

  return (
    <div className="w-full relative bg-[#f1f1f1]">
      <div className="max-w-[950px] md:max-w-none mx-auto bg-background md:border-x-0 border-[#e5e7eb] dark:border-[#27272a] shadow-[0_0_15px_1px_rgba(0,0,0,0.07)] md:shadow-none dark:shadow-none">
        <section
          className="relative overflow-hidden h-[min(60vh,480px)] md:h-[420px] min-h-[280px]"
          aria-label="Bienvenida a Región Mayo"
        >
          <Image
            src="/images/event-conference.jpg"
            alt=""
            fill
            className="object-cover pointer-events-none select-none"
            priority
            loading="eager"
            fetchPriority="high"
            quality={75}
            draggable={false}
          />

          <div
            className="absolute inset-0 bg-gray-900/60 pointer-events-none"
            aria-hidden="true"
          />

          {/* Content — centred vertically so nothing overlaps */}
          <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 pt-[54px] md:pt-[48px] pb-6">
            <div className="w-full max-w-sm text-center">
              <h1 className="font-sans text-3xl sm:text-4xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
                <span className="block">Calendario</span>
                <span className="block">Region Mayo</span>
              </h1>
              <Button
                onClick={scrollToContent}
                size="lg"
                className="w-full text-sm font-semibold bg-primary hover:bg-primary/90 text-white shadow-none"
              >
                Explorar Calendario 2026
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
