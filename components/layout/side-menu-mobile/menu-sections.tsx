// Donde: panel lateral del menu movil. 
// Viewports: mobile. 
// Funcion: muestra filas, submenus, PWA, ayuda y redes.
import Link from "next/link";
import type { MouseEvent } from "react";
import {
  ChevronDown,
  ChevronUp,
  Church,
  Facebook,
  Instagram,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  iglesiasMenuItems,
  type LayoutNavigationItem,
} from "@/components/layout/nav-bar-items";

interface MainMenuLinkProps {
  item: LayoutNavigationItem;
  activePath: string;
  touchFeedbackHref: string | null;
  onActivate: (href: string, element: HTMLElement) => void;
  onTouchStart: (href: string) => void;
}

export function MainMenuLink({
  item,
  activePath,
  touchFeedbackHref,
  onActivate,
  onTouchStart,
}: MainMenuLinkProps) {
  const Icon = item.icon;
  const isActive = activePath === item.href && item.href !== "/";
  const isTouchFeedback = touchFeedbackHref === item.href;
  const showLeftAccent = isActive || isTouchFeedback;

  return (
    <Link
      href={item.href}
      onClick={(event) => onActivate(item.href, event.currentTarget)}
      onTouchStart={() => onTouchStart(item.href)}
      className={cn(
        "relative flex items-center gap-3 px-5 py-4 border-b border-[#cfd4db] [border-bottom-style:dotted] transition-colors duration-150",
        showLeftAccent && "before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-[5px] before:bg-[#3f6db5]",
        isActive
          ? "bg-gray-200"
          : isTouchFeedback
            ? "bg-[#e8f1ff] shadow-[inset_0_0_0_1px_rgba(63,109,181,0.2)]"
            : "hover:bg-gray-100 active:bg-[#e8f1ff]"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon
        className={cn("h-5 w-5 shrink-0", "text-[#8b929c]")}
        aria-hidden="true"
        strokeWidth={1.5}
        absoluteStrokeWidth
      />
      <div className="min-w-0">
        <p className={cn("text-[16px] leading-tight uppercase", isActive ? "font-bold text-[#00508F]" : "font-normal text-[#00508F]")}>
          {item.label}
        </p>
        {item.description && (
          <p className={cn("text-[14px] leading-tight mt-0.5 uppercase", isActive ? "text-[#00508F]/80 font-bold" : "text-[#00508F]/80 font-normal")}>
            {item.description}
          </p>
        )}
      </div>
    </Link>
  );
}

interface IglesiasMenuSectionProps {
  activePath: string;
  iglesiasOpen: boolean;
  onToggle: () => void;
  onActivate: (href: string, element: HTMLElement) => void;
  onTouchStart: (href: string) => void;
}

export function IglesiasMenuSection({
  activePath,
  iglesiasOpen,
  onToggle,
  onActivate,
  onTouchStart,
}: IglesiasMenuSectionProps) {
  const ToggleIcon = iglesiasOpen ? ChevronUp : ChevronDown;

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        onTouchStart={() => onTouchStart("/iglesias")}
        className={cn(
          "relative flex w-full items-center gap-3 border-b border-[#cfd4db] px-5 py-4 pr-16 text-left [border-bottom-style:dotted] transition-colors duration-150",
          iglesiasOpen ? "bg-[#eeeeea]" : "hover:bg-gray-100 active:bg-[#e8f1ff]"
        )}
        aria-expanded={iglesiasOpen}
        aria-controls="mobile-iglesias-submenu"
      >
        <Church className="h-5 w-5 shrink-0 text-[#8b929c]" aria-hidden="true" strokeWidth={1.5} absoluteStrokeWidth />
        <div className="min-w-0 flex-1">
          <p className="text-[16px] font-normal leading-tight uppercase text-[#00508F]">
            Iglesias
          </p>
        </div>
        <span className="absolute right-5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center border border-[#d3d7dd] bg-[#f5f5f5] text-[#7d858f] shadow-[0_0_0_1px_rgba(63,109,181,0.08)]">
          <ToggleIcon className="h-5 w-5" aria-hidden="true" strokeWidth={1.5} absoluteStrokeWidth />
        </span>
      </button>

      <div
        id="mobile-iglesias-submenu"
        className={cn(
          "overflow-hidden bg-[#eeeeea] transition-[max-height,opacity] duration-200 ease-out",
          iglesiasOpen ? "max-h-56 opacity-100" : "pointer-events-none max-h-0 opacity-0"
        )}
        aria-hidden={!iglesiasOpen}
      >
        <div>
          {iglesiasMenuItems.map((iglesiaItem) => {
            const IglesiaIcon = iglesiaItem.icon;
            const iglesiaItemActive = activePath === iglesiaItem.href;

            return (
              <Link
                key={iglesiaItem.href}
                href={iglesiaItem.href}
                tabIndex={iglesiasOpen ? undefined : -1}
                onClick={(event) => onActivate(iglesiaItem.href, event.currentTarget)}
                onTouchStart={() => onTouchStart(iglesiaItem.href)}
                className={cn(
                  "relative flex items-center gap-3 border-b border-[#cfd4db] px-9 py-3.5 [border-bottom-style:dotted] transition-colors duration-150",
                  iglesiaItemActive && "before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-[5px] before:bg-[#3f6db5]",
                  iglesiaItemActive ? "bg-[#d8d8d8]" : "hover:bg-gray-100 active:bg-[#e8f1ff]"
                )}
                aria-current={iglesiaItemActive ? "page" : undefined}
              >
                <IglesiaIcon className="h-5 w-5 shrink-0 text-[#8b929c]" aria-hidden="true" strokeWidth={1.5} absoluteStrokeWidth />
                <div className="min-w-0">
                  <p className={cn("text-[17px] leading-tight", iglesiaItemActive ? "font-bold text-[#00508F]" : "font-normal text-[#00508F]")}>
                    {iglesiaItem.label}
                  </p>
                  {iglesiaItem.description && (
                    <p className="mt-1 text-[13px] font-normal leading-tight text-muted-foreground">
                      {iglesiaItem.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

interface HelpMenuButtonProps {
  helpTouchFeedback: boolean;
  onOpenHelp: () => void;
  onTouchStart: () => void;
}

export function HelpMenuButton({
  helpTouchFeedback,
  onOpenHelp,
  onTouchStart,
}: HelpMenuButtonProps) {
  return (
    <button
      type="button"
      onClick={onOpenHelp}
      onTouchStart={onTouchStart}
      className={cn(
        "relative flex w-full items-center gap-3 px-5 py-4 border-b border-[#cfd4db] [border-bottom-style:dotted] text-left transition-colors duration-150",
        helpTouchFeedback && "before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-[5px] before:bg-[#3f6db5]",
        helpTouchFeedback
          ? "bg-[#e8f1ff] shadow-[inset_0_0_0_1px_rgba(63,109,181,0.2)]"
          : "hover:bg-gray-100 active:bg-[#e8f1ff]"
      )}
      aria-label="Abrir ayuda"
    >
      <MessageSquare className="h-5 w-5 shrink-0 text-[#8b929c]" aria-hidden="true" strokeWidth={1.5} absoluteStrokeWidth />
      <div className="min-w-0">
        <p className="text-[16px] leading-tight uppercase font-normal text-[#00508F]">
          Ayuda
        </p>
        <p className="mt-0.5 text-[14px] leading-tight uppercase font-normal text-[#00508F]/80">
          Asistente virtual
        </p>
      </div>
    </button>
  );
}

interface PwaMenuLinkProps {
  item: LayoutNavigationItem;
  activePath: string;
  onActivate: (event: MouseEvent<HTMLAnchorElement>) => void;
  onTouchStart: () => void;
}

export function PwaMenuLink({
  item,
  activePath,
  onActivate,
  onTouchStart,
}: PwaMenuLinkProps) {
  const PwaIcon = item.icon;
  const isActive = activePath === item.href;

  return (
    <Link
      href={item.href}
      onClick={onActivate}
      onTouchStart={onTouchStart}
      className={cn(
        "relative flex items-center gap-3 px-5 py-4 border-b border-[#cfd4db] [border-bottom-style:dotted] transition-colors duration-150",
        isActive ? "bg-gray-200" : "hover:bg-gray-100 active:bg-[#e8f1ff]",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <PwaIcon className={cn("h-5 w-5 shrink-0", "text-[#8b929c]")} aria-hidden="true" strokeWidth={1.5} absoluteStrokeWidth />
      <div className="min-w-0">
        <p
          className={cn(
            "text-[16px] leading-tight uppercase",
            isActive ? "font-bold text-[#00508F]" : "font-normal text-[#00508F]",
          )}
        >
          {item.label}
        </p>
      </div>
    </Link>
  );
}

interface MobileMenuSocialFooterProps {
  instagramUrl: string;
  facebookUrl: string;
}

export function MobileMenuSocialFooter({
  instagramUrl,
  facebookUrl,
}: MobileMenuSocialFooterProps) {
  return (
    <div className="border-t border-border px-5 py-4 shrink-0">
      <p className="text-[14px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
        Síguenos
      </p>
      <div className="flex flex-col gap-2">
        <a
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 text-[16px] font-normal text-[#00508F] hover:text-[#003B6D] transition-colors"
          aria-label="Síguenos en Instagram"
        >
          <Instagram className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={1.5} absoluteStrokeWidth />
          Instagram
        </a>
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 text-[16px] font-normal text-[#00508F] hover:text-[#003B6D] transition-colors"
          aria-label="Síguenos en Facebook"
        >
          <Facebook className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={1.5} absoluteStrokeWidth />
          Facebook
        </a>
      </div>
    </div>
  );
}
