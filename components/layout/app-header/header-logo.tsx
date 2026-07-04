// Donde: marca del header en AppHeader. 
// Viewports: desktop y mobile. 
// Funcion: muestra logo y titulo visible del sitio.
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";

const headerTitleFont = Inter({
  subsets: ["latin"],
  weight: ["800"],
  display: "swap",
});

function HeaderTitle({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <span className={`${headerTitleFont.className} text-white text-[12px] tracking-wide`}>
        IGC
      </span>
      <span className="text-[#c9c9c9] text-[11px] opacity-90">Región Mayo</span>
    </div>
  );
}

export function DesktopHeaderBrand() {
  return (
    <div className="flex items-center gap-2.5 shrink-0 select-none">
      <Link href="/" className="shrink-0 select-none" aria-label="Inicio">
        <Image
          src="/images/logo_hero_2.png"
          alt="Región Mayo"
          data-offline-required="true"
          width={34}
          height={34}
          className="mb-1.5 rounded-full shrink-0 select-none brightness-[1.08] contrast-[1.18]]"
          draggable={false}
          loading="eager"
          priority
          unoptimized
        />
      </Link>
    </div>
  );
}

export function MobileHeaderBrand() {
  return (
    <div className="flex items-center justify-start h-full relative z-[62] shrink-0">
      <Link
        href="/"
        className="flex items-center justify-center h-10 w-10 shrink-0 select-none"
        aria-label="Inicio - Region Mayo"
        draggable={false}
      >
        <Image
          src="/images/logo_hero_2.png"
          alt="Región Mayo"
          data-offline-required="true"
          width={32}
          height={32}
          className="mb-0.5 shrink-0 select-none brightness-[1.08] contrast-[1.18]]"
          draggable={false}
          loading="eager"
          priority
          unoptimized
        />
      </Link>

      <HeaderTitle className="ml-2.5 flex flex-col justify-center leading-tight" />
    </div>
  );
}
