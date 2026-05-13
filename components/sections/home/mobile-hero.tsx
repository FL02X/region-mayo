"use client";

import { useEffect, useState } from "react";
import { Noto_Sans } from "next/font/google";

interface MobileHeroProps {
  src?: string;
  alt?: string;
}

const MOBILE_HERO_FALLBACK_SRC = "/images/event-conference.jpg";

const jwStyleFont = Noto_Sans({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

export function MobileHero({
  src = MOBILE_HERO_FALLBACK_SRC,
  alt = "Imagen principal móvil",
}: MobileHeroProps) {
  const safeInitialSrc = src?.trim() ? src : MOBILE_HERO_FALLBACK_SRC;
  const [displaySrc, setDisplaySrc] = useState(safeInitialSrc);

  useEffect(() => {
    setDisplaySrc(safeInitialSrc);
  }, [safeInitialSrc]);

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

      <div className={`${jwStyleFont.className} w-full bg-[#2f3136] text-white px-5 py-4`}>
        <p className="text-[12px] leading-tight uppercase tracking-[0.02em] text-white/95">
          Iglesia Gentil de Cristo
        </p>
        <p className="mt-1 text-[24px] leading-[1.05] font-semibold tracking-[0.01em] text-white">
          Calendario de la Region Mayo
        </p>
      </div>
    </section>
  );
}
