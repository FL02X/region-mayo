"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import type { HeroImage } from "@/lib/types";

interface HeroSectionProps {
  heroImages?: HeroImage[];
  heroTitle?: string;
  heroSubtitle?: string;
}

export function HeroSection({
  heroImages = [{ url: "/images/hero-choir.jpg", alt: "Coro Región Mayo" }],
  heroTitle = "Bienvenido a Región Mayo",
  heroSubtitle = "Vive la Comunidad",
}: HeroSectionProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images =
    heroImages.length > 0
      ? heroImages
      : [{ url: "/images/hero-choir.jpg", alt: "Coro Región Mayo" }];

  const nextImage = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(nextImage, 7000);
    return () => clearInterval(interval);
  }, [images.length, nextImage]);

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
    <section
      className="relative w-full overflow-hidden"
      style={{ height: "min(60vh, 480px)", minHeight: "280px" }}
      aria-label="Bienvenida a Región Mayo"
    >
      {/* Background images — auto-rotate silently, no user interaction */}
      {images.map((image, index) => (
        <div
          key={image.url}
          className={`absolute inset-0 transition-opacity duration-700 pointer-events-none select-none ${
            index === currentImageIndex ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden="true"
        >
          <Image
            src={image.url}
            alt=""
            fill
            className="object-cover pointer-events-none select-none"
            priority={index === 0}
            loading={index === 0 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            quality={75}
            draggable={false}
          />
        </div>
      ))}

      {/* Uniform overlay — dark gray transparent across the full image */}
      <div
        className="absolute inset-0 bg-gray-900/45 pointer-events-none"
        aria-hidden="true"
      />

      {/* Content — centred vertically so nothing overlaps */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6 pt-[54px] pb-6">
        <div className="w-full max-w-sm text-center">
          {false && heroSubtitle && (
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65 mb-2">
              {heroSubtitle}
            </p>
          )}
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
  );
}
