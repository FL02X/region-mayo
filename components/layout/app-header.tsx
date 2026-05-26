"use client";

import { useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Music,
  Images,
  UserCircle,
  Instagram,
  Facebook,
  Church,
  Search,
  MessageSquare,
} from "lucide-react";
import { MobileMenu } from "@/components/layout/side-menu.mobile";
import { DebugTimePicker } from "@/components/shared/debug-time-picker";

interface AppHeaderProps {
  instagramUrl?: string;
  facebookUrl?: string;
  behavior?: "fixed" | "sticky";
}

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/templos", label: "Templos", icon: Church },
  { href: "/pastores", label: "Pastores", icon: Users },
  { href: "/coros", label: "Coros", icon: Music },
  { href: "/album", label: "Álbum", icon: Images },
  { href: "/directiva", label: "Directiva", icon: UserCircle },
];

export function AppHeader({
  instagramUrl = "https://instagram.com/regionmayo",
  facebookUrl = "https://facebook.com/regionmayo",
  behavior = "fixed",
}: AppHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const desktopTrackRef = useRef<HTMLDivElement | null>(null);
  const desktopHoveredItemRef = useRef<HTMLElement | null>(null);
  const [desktopHoverState, setDesktopHoverState] = useState({
    x: 0,
    width: 0,
    opacity: 0,
  });

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("q")?.toString() || "";
    if (query.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const getOffsetWithinTrack = (element: HTMLElement, track: HTMLElement) => {
    let offset = 0;
    let node: HTMLElement | null = element;

    while (node && node !== track) {
      offset += node.offsetLeft;
      node = node.offsetParent instanceof HTMLElement ? node.offsetParent : null;
    }

    return offset;
  };

  const moveDesktopHighlight = (element: HTMLElement) => {
    const track = desktopTrackRef.current;
    if (!track) return;

    const horizontalInset = 1;
    const x = Math.max(0, getOffsetWithinTrack(element, track) + horizontalInset);
    const width = Math.max(0, element.offsetWidth - horizontalInset * 2);

    setDesktopHoverState({
      x,
      width,
      opacity: 1,
    });
  };

  const clearDesktopHighlight = () => {
    desktopHoveredItemRef.current = null;
    setDesktopHoverState((prev) => ({ ...prev, opacity: 0 }));
  };

  const handleDesktopTrackMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const track = desktopTrackRef.current;
    if (!track) return;

    const items = track.querySelectorAll<HTMLElement>(".desktop-header-item");
    let hoveredItem: HTMLElement | null = null;

    for (const item of items) {
      const rect = item.getBoundingClientRect();
      if (
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom
      ) {
        hoveredItem = item;
        break;
      }
    }

    if (!hoveredItem) return;
    if (desktopHoveredItemRef.current === hoveredItem) return;

    desktopHoveredItemRef.current = hoveredItem;
    moveDesktopHighlight(hoveredItem);
  };

  const desktopHighlightStyle = {
    "--header-highlight-x": `${desktopHoverState.x}px`,
    "--header-highlight-w": `${desktopHoverState.width}px`,
    "--header-highlight-opacity": `${desktopHoverState.opacity}`,
  } as CSSProperties;

  const headerPosition = behavior === "sticky" ? "sticky" : "fixed";
  const headerDesktopPosition = behavior === "sticky" ? "md:sticky" : "md:absolute";

  return (
    <>
      <header className={`${headerPosition} ${headerDesktopPosition} top-0 left-0 right-0 z-[60] bg-[#21252b] border-b border-white/10 text-white h-[51px] md:h-[45px] shadow-none`}>
        <div className="h-full max-w-[950px] mx-auto relative z-[61]">
          {/* Desktop layout: 1) logo 2) nav 3) search 4) socials */}
          <div
            ref={desktopTrackRef}
            className="desktop-header-track hidden md:flex items-center h-full px-4 lg:px-6 gap-2"
            onMouseMove={handleDesktopTrackMouseMove}
            onMouseLeave={clearDesktopHighlight}
          >
            <div
              className="desktop-header-hover-indicator"
              style={desktopHighlightStyle}
              aria-hidden="true"
            />
            <Link
              href="/"
              className="desktop-header-item flex items-center gap-2.5 shrink-0"
              aria-label="Inicio — Region Mayo"
              onMouseEnter={(event) => moveDesktopHighlight(event.currentTarget)}
            >
              <Image
                src="/images/region-mayo-logo.jpg"
                alt="Región Mayo"
                width={30}
                height={30}
                className="rounded-full shrink-0"
                loading="eager"
                priority
                unoptimized
              />
            </Link>

            <nav
              className="flex items-center h-full flex-1 min-w-0 max-[914px]:justify-between max-[914px]:px-2"
              aria-label="Navegación principal"
            >
              {navItems.map(({ href, label, icon: Icon }) => {
                const isInicio = href === "/";
                const isActive = pathname === href && !isInicio;
                return (
                  <Link
                    key={href}
                    href={href}
                    onMouseEnter={(event) => moveDesktopHighlight(event.currentTarget)}
                    className={cn(
                      "desktop-header-item flex items-center gap-1.5 h-full px-2.5 lg:px-3 max-[914px]:w-12 max-[914px]:justify-center max-[914px]:gap-0 max-[914px]:px-0 max-[914px]:text-[0px] min-[915px]:px-3 min-[915px]:gap-0 min-[915px]:justify-center min-[915px]:text-[11px] min-[1101px]:justify-start min-[1101px]:gap-1.5 text-[11px] transition-colors font-medium whitespace-nowrap tracking-[0.04em] uppercase border-b-2 border-transparent",
                      isActive
                        ? "text-white border-[#2f5e93] bg-[#2f5e93]"
                        : "text-white/90 hover:text-white hover:border-white/30"
                    )}
                    aria-label={label}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon
                      className="desktop-header-icon h-[15px] w-[15px] shrink-0 opacity-80 hidden max-[914px]:block min-[1101px]:block"
                      aria-hidden="true"
                      strokeWidth={1.75}
                    />
                    <span className="max-[914px]:sr-only min-[915px]:inline max-[914px]:hidden">{label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="w-[180px] shrink-0 h-full items-center flex">
              <form
                className="relative w-full h-[34px] max-[914px]:h-[40px] bg-[#f7f7f7] rounded-[2px] flex items-center overflow-hidden border border-[#9aa1ab] focus-within:border-[#6c8fbc] transition-colors"
                onSubmit={handleSearchSubmit}
              >
                <input
                  type="search"
                  name="q"
                  placeholder="Buscar"
                  className="flex-1 min-w-0 h-full bg-transparent border-none text-[13px] leading-none text-[#222] placeholder-[#6f7480] pl-3 pr-2 focus:outline-none focus:ring-0"
                  aria-label="Búsqueda"
                />
                <div className="h-[22px] w-px bg-[#b2b8c1] shrink-0" aria-hidden="true" />
                <button
                  type="submit"
                  className="desktop-search-button w-[40px] max-[914px]:w-[44px] h-full flex items-center justify-center bg-[#f4f4f4] hover:bg-[#ececec] transition-colors cursor-pointer"
                  aria-label="Ejecutar búsqueda"
                >
                  <Search className="desktop-search-icon h-[17px] w-[17px] text-[#4a4a4a]" strokeWidth={1.6} />
                </button>
              </form>
            </div>

            <div className="flex items-center gap-0.5 shrink-0 max-[914px]:gap-1.5">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="desktop-header-item flex items-center justify-center h-9 w-9 max-[914px]:h-11 max-[914px]:w-11 text-white/90 hover:text-white transition-colors"
                aria-label="Síguenos en Instagram"
                onMouseEnter={(event) => moveDesktopHighlight(event.currentTarget)}
              >
                <Instagram className="desktop-header-icon h-[18px] w-[18px]" aria-hidden="true" strokeWidth={1.75} />
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="desktop-header-item flex items-center justify-center h-9 w-9 max-[914px]:h-11 max-[914px]:w-11 text-white/90 hover:text-white transition-colors"
                aria-label="Síguenos en Facebook"
                onMouseEnter={(event) => moveDesktopHighlight(event.currentTarget)}
              >
                <Facebook className="desktop-header-icon h-[18px] w-[18px]" aria-hidden="true" strokeWidth={1.75} />
              </a>
            </div>
          </div>

          {/* Mobile layout: logo, spacer, search icon, hamburger */}
          <div className="md:hidden flex items-center h-full px-3 gap-2 relative z-[62]">
            {/* Logo */}
            <div className="flex items-center justify-start h-full relative z-[62] shrink-0">
              <Link
                href="/"
                className="flex items-center justify-center h-9 w-9 shrink-0"
                aria-label="Inicio — Region Mayo"
              >
                <Image
                  src="/images/region-mayo-logo.jpg"
                  alt="Región Mayo"
                  width={26}
                  height={26}
                  className="rounded-full shrink-0"
                  loading="eager"
                  priority
                  unoptimized
                />
              </Link>

              <div className="ml-2 flex flex-col justify-center leading-tight">
                <span className="text-[#c9c9c9] text-[12px] font-semibold">IGC</span>
                <span className="text-[#c9c9c9] text-[11px] opacity-90">Region Mayo</span>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Asistente link */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-chatbot'));
                }
              }}
              aria-label="Abrir Asistente"
              className="mr-2 mb-1 relative flex items-center justify-center h-9 w-9 shrink-0 text-white/90 hover:text-white transition-colors md:hidden"
            >
              <MessageSquare className="h-[22px] w-[22px]" strokeWidth={1.6} />
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-semibold text-white">?</span>
              </span>
            </button>

          {/* Search icon link */}
            <Link
              href="/buscar"
              className="mr-2 mb-1 flex items-center justify-center h-9 w-9 shrink-0 text-white/90 hover:text-white transition-colors"
              aria-label="Ir a búsqueda"
            >
              <Search className="h-[23px] w-[23px]" strokeWidth={1.75} />
            </Link>

            {/* Mobile/Tablet only: hamburger menu */}
            <div className="mb-1 md:hidden flex items-center justify-end text-white relative z-[62] h-full shrink-0">
              <MobileMenu
                instagramUrl={instagramUrl}
                facebookUrl={facebookUrl}
              />
            </div>
          </div>

          {/* OLD Mobile Search Bar - commented out for future use
          <div className="md:hidden grid grid-cols-[40px_minmax(0,1fr)_40px] items-center h-full px-3 gap-2 relative z-[62]">
            <div className="flex items-center justify-start h-full relative z-[62] shrink-0">
              <Link
                href="/"
                className="flex items-center justify-center h-9 w-9 shrink-0"
                aria-label="Inicio — Region Mayo"
              >
                <Image
                  src="/images/region-mayo-logo.jpg"
                  alt="Región Mayo"
                  width={26}
                  height={26}
                  className="rounded-full shrink-0"
                  loading="eager"
                  priority
                  unoptimized
                />
              </Link>
            </div>

            <div className="min-w-0 relative z-[62] flex justify-center items-center h-full">
              <form
                className="relative w-full min-w-0 h-[36px] bg-[#f7f7f7] rounded-[2px] flex items-center overflow-hidden border border-[#9aa1ab] focus-within:border-[#6c8fbc] transition-colors"
                onSubmit={handleSearchSubmit}
              >
                <input
                  type="search"
                  name="q"
                  placeholder="Buscar..."
                  className="flex-1 min-w-0 h-full bg-transparent border-none text-[13px] leading-none text-[#222] placeholder-[#6f7480] pl-3 pr-2 focus:outline-none focus:ring-0"
                  aria-label="Escribe tu búsqueda"
                />
                <div className="h-[22px] w-px bg-[#b2b8c1] shrink-0" aria-hidden="true"></div>
                <button
                  type="submit"
                  className="w-[40px] h-full flex items-center justify-center bg-[#f4f4f4] hover:bg-[#ececec] transition-colors cursor-pointer"
                  aria-label="Ejecutar búsqueda"
                >
                  <Search className="h-[17px] w-[17px] text-[#4a4a4a]" strokeWidth={1.6} />
                </button>
              </form>
            </div>

            <div className="md:hidden flex items-center justify-end text-white relative z-[62] h-full shrink-0">
              <MobileMenu
                instagramUrl={instagramUrl}
                facebookUrl={facebookUrl}
              />
            </div>
          </div>
          */}
        </div>
      </header>

      {/* DebugTimePicker — fixed bottom-right, dev use only, never occupies header space */}
      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-16 left-4 z-[70] opacity-60 hover:opacity-100 transition-opacity">
          <DebugTimePicker />
        </div>
      )}

    </>
  );
}
