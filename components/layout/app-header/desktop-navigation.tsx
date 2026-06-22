// Donde: barra superior dentro de AppHeader. 
// Viewports: desktop/tablet md+. 
// Funcion: muestra enlaces principales editables.
import Link from "next/link";
import { cn } from "@/lib/utils";
import { desktopNavItems } from "@/components/layout/navigation-items";

interface DesktopNavigationProps {
  activePath: string;
  isMounted: boolean;
  onItemHover: (element: HTMLElement) => void;
}

export function DesktopNavigation({
  activePath,
  isMounted,
  onItemHover,
}: DesktopNavigationProps) {
  return (
    <nav
      className="flex cursor-default items-center h-full flex-1 min-w-0 max-[914px]:justify-between max-[914px]:px-2"
      aria-label="Navegación principal"
    >
      {desktopNavItems.map(({ href, label, icon: Icon }) => {
        const isInicio = href === "/";
        const isActive = isMounted && activePath === href && !isInicio;

        return (
          <Link
            key={href}
            href={href}
            onMouseEnter={(event) => onItemHover(event.currentTarget)}
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
            <span className="max-[914px]:sr-only min-[915px]:inline max-[914px]:hidden">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
