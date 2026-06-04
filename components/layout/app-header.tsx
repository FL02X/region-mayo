"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Inter } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
} from "lucide-react";
import { MobileMenu } from "@/components/layout/side-menu.mobile";
import { DebugTimePicker } from "@/components/shared/debug-time-picker";

interface AppHeaderProps {
  instagramUrl?: string;
  facebookUrl?: string;
  behavior?: "fixed" | "sticky";
}

const inter = Inter({
  subsets: ["latin"],
  weight: ["800"],
  display: "swap",
});

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/templos", label: "Templos", icon: Church },
  { href: "/pastores", label: "Pastores", icon: Users },
  { href: "/coros", label: "Coros", icon: Music },
  { href: "/album", label: "Álbum", icon: Images },
  { href: "/directiva", label: "Directiva", icon: UserCircle },
];

/*
 * Desktop currently shows Templos and Pastores as first-level nav items.
 * The previous desktop "Iglesias" dropdown is preserved below as commented
 * code so it can be restored later without rebuilding the design.
 *
 * To restore:
 * 1. Add ChevronDown and X back to the lucide-react imports.
 * 2. Remove /templos and /pastores from navItems.
 * 3. Uncomment iglesiasDesktopItems.
 * 4. Uncomment the desktopIglesiasOpen/Rendered state and desktopIglesiasRef.
 * 5. Uncomment the two effects inside AppHeader after the mount effect.
 * 6. Render the JSX block after the Inicio link inside navItems.map.
 */

// const iglesiasDesktopItems = [
//   {
//     href: "/templos",
//     label: "Templos",
//     description: "Ubica tu congregacion",
//     icon: Church,
//   },
//   {
//     href: "/pastores",
//     label: "Pastores",
//     description: "Directorio regional",
//     icon: Users,
//   },
// ];

/*
 * Previous desktop dropdown state:
 *
 * const [desktopIglesiasOpen, setDesktopIglesiasOpen] = useState(false);
 * const [desktopIglesiasRendered, setDesktopIglesiasRendered] = useState(false);
 * const desktopIglesiasRef = useRef<HTMLDivElement | null>(null);
 */

/*
 * Previous desktop dropdown effects:
 *
 * useEffect(() => {
 *   if (desktopIglesiasOpen) {
 *     setDesktopIglesiasRendered(true);
 *     return;
 *   }
 *
 *   const timeout = window.setTimeout(() => {
 *     setDesktopIglesiasRendered(false);
 *   }, 160);
 *
 *   return () => window.clearTimeout(timeout);
 * }, [desktopIglesiasOpen]);
 *
 * useEffect(() => {
 *   if (!desktopIglesiasOpen) return;
 *
 *   const handlePointerDown = (event: PointerEvent) => {
 *     if (
 *       desktopIglesiasRef.current &&
 *       !desktopIglesiasRef.current.contains(event.target as Node)
 *     ) {
 *       setDesktopIglesiasOpen(false);
 *     }
 *   };
 *
 *   const handleKeyDown = (event: KeyboardEvent) => {
 *     if (event.key === "Escape") {
 *       setDesktopIglesiasOpen(false);
 *     }
 *   };
 *
 *   document.addEventListener("pointerdown", handlePointerDown);
 *   document.addEventListener("keydown", handleKeyDown);
 *
 *   return () => {
 *     document.removeEventListener("pointerdown", handlePointerDown);
 *     document.removeEventListener("keydown", handleKeyDown);
 *   };
 * }, [desktopIglesiasOpen]);
 */

/*
 * Previous desktop dropdown JSX:
 *
 * {href === "/" && (
 *   <div
 *     ref={desktopIglesiasRef}
 *     className="relative h-full"
 *     onMouseEnter={() => setDesktopIglesiasOpen(true)}
 *     onMouseLeave={() => setDesktopIglesiasOpen(false)}
 *     onFocus={() => setDesktopIglesiasOpen(true)}
 *     onBlur={(event) => {
 *       if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
 *         setDesktopIglesiasOpen(false);
 *       }
 *     }}
 *   >
 *     <button
 *       type="button"
 *       onClick={() => setDesktopIglesiasOpen((value) => !value)}
 *       onMouseEnter={(event) => moveDesktopHighlight(event.currentTarget)}
 *       className={cn(
 *         "desktop-header-item flex h-full cursor-pointer items-center gap-1.5 border-b-2 border-transparent px-2.5 text-[11px] font-medium uppercase tracking-[0.04em] text-white transition-colors lg:px-3 max-[914px]:w-12 max-[914px]:justify-center max-[914px]:gap-0 max-[914px]:px-0 max-[914px]:text-[0px] min-[915px]:justify-center min-[915px]:gap-0 min-[915px]:px-3 min-[915px]:text-[11px] min-[1101px]:justify-start min-[1101px]:gap-1.5",
 *         isMounted && (activePath === "/templos" || activePath === "/pastores")
 *           ? "border-[#2f5e93] bg-[#2f5e93]"
 *           : "hover:border-white/30"
 *       )}
 *       aria-label="Iglesias"
 *       aria-expanded={desktopIglesiasOpen}
 *       aria-current={
 *         isMounted && (activePath === "/templos" || activePath === "/pastores")
 *           ? "page"
 *           : undefined
 *       }
 *     >
 *       <Church
 *         className="desktop-header-icon hidden h-[15px] w-[15px] shrink-0 opacity-80 max-[914px]:block min-[1101px]:block"
 *         aria-hidden="true"
 *         strokeWidth={1.75}
 *       />
 *       <span className="max-[914px]:hidden max-[914px]:sr-only min-[915px]:inline">Iglesias</span>
 *       <ChevronDown
 *         className={cn(
 *           "desktop-header-icon hidden h-[12px] w-[12px] shrink-0 opacity-80 transition-transform min-[1101px]:block",
 *           desktopIglesiasOpen && "rotate-180"
 *         )}
 *         aria-hidden="true"
 *         strokeWidth={1.8}
 *       />
 *     </button>
 *
 *     {desktopIglesiasRendered && (
 *       <div
 *         className={cn(
 *           "absolute left-0 top-full z-[80] w-max max-w-[min(320px,calc(100vw-3rem))] rounded-none border border-[#cbd1d8] bg-[#f5f5f5] p-1.5 text-[#3869b1] shadow-[0_24px_56px_-18px_rgba(15,23,42,0.42),0_12px_28px_-14px_rgba(15,23,42,0.32),0_2px_8px_rgba(15,23,42,0.12)]",
 *           desktopIglesiasOpen
 *             ? "animate-in fade-in-0 slide-in-from-top-2 duration-150"
 *             : "pointer-events-none animate-out fade-out-0 slide-out-to-top-1 duration-150"
 *         )}
 *       >
 *         <span
 *           className="absolute -top-[8px] left-[34px] h-0 w-0 border-x-[10px] border-b-[9px] border-x-transparent border-b-[#f5f5f5]"
 *           aria-hidden="true"
 *         />
 *         <div className="grid max-h-[min(62vh,460px)] gap-0.5 overflow-y-auto">
 *           {iglesiasDesktopItems.map(({ href: iglesiaHref, label: iglesiaLabel, description, icon: IglesiaIcon }) => (
 *             <Link
 *               key={iglesiaHref}
 *               href={iglesiaHref}
 *               onClick={() => setDesktopIglesiasOpen(false)}
 *               className="group flex w-full cursor-pointer items-start gap-2.5 px-3 py-2.5 text-primary outline-none transition-colors hover:bg-[#e9edf2] hover:text-primary/80 focus-visible:bg-[#e9edf2]"
 *             >
 *               <IglesiaIcon className="mt-0.5 h-[18px] w-[18px] shrink-0 text-[#7f8791]" aria-hidden="true" strokeWidth={1.5} />
 *               <span className="grid gap-0.5 whitespace-nowrap">
 *                 <span className="text-[14px] font-medium leading-tight underline-offset-2 group-hover:underline">
 *                   {iglesiaLabel}
 *                 </span>
 *                 <span className="text-[11px] font-normal leading-tight text-[#6f7883]">
 *                   {description}
 *                 </span>
 *               </span>
 *             </Link>
 *           ))}
 *         </div>
 *       </div>
 *     )}
 *   </div>
 * )}
 */

export function AppHeader({
  instagramUrl = "https://instagram.com/regionmayo",
  facebookUrl = "https://facebook.com/regionmayo",
  behavior = "fixed",
}: AppHeaderProps) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [activePath, setActivePath] = useState<string>("");
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

  useEffect(() => {
    setIsMounted(true);
    setActivePath(window.location.pathname);
  }, []);

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
            className="desktop-header-track hidden md:flex cursor-default items-center h-full px-4 lg:px-6 gap-2"
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
              className="desktop-header-item flex items-center gap-2.5 shrink-0 select-none"
              aria-label="Inicio — Region Mayo"
              onMouseEnter={(event) => moveDesktopHighlight(event.currentTarget)}
              draggable={false}
            >
              <Image
                src="/images/region-mayo-logo.jpg"
                alt="Región Mayo"
                width={30}
                height={30}
                className="rounded-full shrink-0 select-none"
                draggable={false}
                loading="eager"
                priority
                unoptimized
              />
            </Link>

            <nav
              className="flex cursor-default items-center h-full flex-1 min-w-0 max-[914px]:justify-between max-[914px]:px-2"
              aria-label="Navegación principal"
            >
              {navItems.map(({ href, label, icon: Icon }) => {
                const isInicio = href === "/";
                const isActive = isMounted && activePath === href && !isInicio;
                return (
                  <Link
                    key={href}
                    href={href}
                    onMouseEnter={(event) => moveDesktopHighlight(event.currentTarget)}
                    className={cn(
                      "desktop-header-item flex cursor-pointer items-center gap-1.5 h-full px-2.5 lg:px-3 max-[914px]:w-12 max-[914px]:justify-center max-[914px]:gap-0 max-[914px]:px-0 max-[914px]:text-[0px] min-[915px]:px-3 min-[915px]:gap-0 min-[915px]:justify-center min-[915px]:text-[11px] min-[1101px]:justify-start min-[1101px]:gap-1.5 text-[11px] transition-colors font-medium whitespace-nowrap tracking-[0.04em] uppercase border-b-2 border-transparent",
                      isActive
                        ? "text-white border-[#2f5e93] bg-[#2f5e93]"
                        : "text-white hover:text-white hover:border-white/30"
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
                  className="desktop-header-item flex items-center justify-center h-9 w-9 max-[914px]:h-11 max-[914px]:w-11 text-white hover:text-white transition-colors"
                  aria-label="Síguenos en Instagram"
                  onMouseEnter={(event) => moveDesktopHighlight(event.currentTarget)}
                >
                <Instagram className="desktop-header-icon h-[18px] w-[18px]" aria-hidden="true" strokeWidth={1.75} />
              </a>
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="desktop-header-item flex items-center justify-center h-9 w-9 max-[914px]:h-11 max-[914px]:w-11 text-white hover:text-white transition-colors"
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
                className="flex items-center justify-center h-9 w-9 shrink-0 select-none"
                aria-label="Inicio — Region Mayo"
                draggable={false}
              >
                <Image
                  src="/images/region-mayo-logo.jpg"
                  alt="Región Mayo"
                  width={26}
                  height={26}
                  className="rounded-full shrink-0 select-none"
                  draggable={false}
                  loading="eager"
                  priority
                  unoptimized
                />
              </Link>

              <div className="ml-2 flex flex-col justify-center leading-tight">
                <span className={`${inter.className} text-white text-[12px] tracking-wide`}>
                  IGC
                </span>
                <span className="text-[#c9c9c9] text-[11px] opacity-90">Region Mayo</span>
              </div>
            </div>

            {/* Spacer */}
            <div className="flex-1" />

          {/* Search icon link */}
            <Link
              href="/buscar"
              className="mr-2 mb-1 flex items-center justify-center h-9 w-9 shrink-0 text-white hover:text-white transition-colors"
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
