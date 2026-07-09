"use client";

// Donde: header principal de las paginas publicas. 
// Viewports: desktop y mobile. 
// Funcion: concentra logo, navegacion, busqueda y menu.
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  DEFAULT_FACEBOOK_URL,
  DEFAULT_INSTAGRAM_URL,
} from "@/components/layout/nav-bar-items";
import { DesktopHeaderBrand } from "@/components/layout/app-header/header-logo";
import { DesktopNavigation } from "@/components/layout/app-header/navigation.desktop";
import { DesktopSearch } from "@/components/layout/app-header/search.desktop";
import { HeaderSocialLinks } from "@/components/layout/app-header/header-social-links.desktop";
import { MobileHeaderContent } from "@/components/layout/app-header/header-content.mobile";
import { DebugTimePicker } from "@/components/shared/debug-time-picker";

interface AppHeaderProps {
  instagramUrl?: string;
  facebookUrl?: string;
}

const recorridoBrandStyle = {
  "--brand": "var(--brand-green)",
  "--brand-hover": "var(--brand-green-hover)",
  "--brand-active": "var(--brand-green-active)",
  "--brand-soft": "var(--brand-green-soft)",
  "--brand-border": "var(--brand-green-border)",
  "--brand-text": "var(--brand-green-text)",
  "--color-brand": "var(--brand-green)",
  "--color-brand-hover": "var(--brand-green-hover)",
  "--color-brand-active": "var(--brand-green-active)",
  "--color-brand-soft": "var(--brand-green-soft)",
  "--color-brand-border": "var(--brand-green-border)",
  "--color-brand-text": "var(--brand-green-text)",
} as CSSProperties;

function getOffsetWithinTrack(element: HTMLElement, track: HTMLElement) {
  let offset = 0;
  let node: HTMLElement | null = element;

  while (node && node !== track) {
    offset += node.offsetLeft;
    node = node.offsetParent instanceof HTMLElement ? node.offsetParent : null;
  }

  return offset;
}

export function AppHeader({
  instagramUrl = DEFAULT_INSTAGRAM_URL,
  facebookUrl = DEFAULT_FACEBOOK_URL,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [activePath, setActivePath] = useState<string>("");
  const desktopTrackRef = useRef<HTMLDivElement | null>(null);
  const desktopHoveredItemRef = useRef<HTMLElement | null>(null);
  const [desktopHoverState, setDesktopHoverState] = useState({
    x: 0,
    width: 0,
    opacity: 0,
  });

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const query = formData.get("q")?.toString() || "";

    if (query.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const moveDesktopHighlight = (element: HTMLElement) => {
    const track = desktopTrackRef.current;
    if (!track) return;

    // La barra animada depende de medidas reales del DOM, por eso queda en el coordinador del header.
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
  }, []);

  useEffect(() => {
    setActivePath(pathname || window.location.pathname);
  }, [pathname]);

  const handleDesktopTrackMouseMove = (event: ReactMouseEvent<HTMLDivElement>) => {
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
  const isRecorridoRoute = pathname === "/recorrido-mayo-2026";

  return (
    <>
      {/* Wrapper fantasma: reserva 51px en móvil, en desktop se adapta automáticamente al contenido estático */}
      <div className="h-[51px] w-full md:h-auto">
        <header
          data-app-header
          className={`fixed top-0 left-0 z-[60] w-full border-y border-black/15 text-white h-[51px] md:static md:h-[50px] ${
            isRecorridoRoute ? "bg-brand-green" : "bg-brand"
          }`}
          style={isRecorridoRoute ? recorridoBrandStyle : undefined}
        >
          <div className="h-full max-w-[1150px] mx-auto relative z-[61]">
            <div
              ref={desktopTrackRef}
              className="desktop-header-track hidden md:flex cursor-default items-center h-full px-4 lg:px-4 gap-2"
              onMouseMove={handleDesktopTrackMouseMove}
              onMouseLeave={clearDesktopHighlight}
            >
              <div
                className="desktop-header-hover-indicator"
                style={desktopHighlightStyle}
                aria-hidden="true"
              />
              <DesktopHeaderBrand />
              <DesktopNavigation
                activePath={activePath}
                isMounted={isMounted}
                onItemHover={moveDesktopHighlight}
              />
              <DesktopSearch onSubmit={handleSearchSubmit} />
              <HeaderSocialLinks
                instagramUrl={instagramUrl}
                facebookUrl={facebookUrl}
                onItemHover={moveDesktopHighlight}
              />
            </div>

            <MobileHeaderContent instagramUrl={instagramUrl} facebookUrl={facebookUrl} />
          </div>
        </header>
      </div>

      {process.env.NODE_ENV === "development" && (
        <div className="fixed bottom-16 left-4 z-[70] hidden md:block">
          <DebugTimePicker />
        </div>
      )}
    </>
  );
}
