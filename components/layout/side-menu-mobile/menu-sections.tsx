// Donde: panel lateral del menu movil. 
// Viewports: mobile. 
// Funcion: muestra filas, submenus, PWA, ayuda y redes.
import Link from "next/link";
import type { MouseEvent } from "react";
import {
  ChevronDown,
  ChevronUp,
  Facebook,
  Instagram,
  MessageSquare,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type LayoutNavigationGroup,
  type LayoutNavigationItem,
  type LayoutNavigationRouteItem,
} from "@/components/layout/nav-bar-items";

interface MainMenuLinkProps {
  item: LayoutNavigationItem;
  activePath: string;
  touchFeedbackKey: string | null;
  onActivate: (item: LayoutNavigationItem, element: HTMLElement) => void;
  onTouchStart: (key: string) => void;
}

export function MainMenuLink({
  item,
  activePath,
  touchFeedbackKey,
  onActivate,
  onTouchStart,
}: MainMenuLinkProps) {
  const Icon = item.icon;
  const isActive = activePath === item.href && item.href !== "/";
  const isTouchFeedback = touchFeedbackKey === item.id;
  const showLeftAccent = isActive || isTouchFeedback;
  const className = cn(
    "relative flex w-full items-center gap-3 px-5 py-4 border-b border-[#cfd4db] [border-bottom-style:dotted] text-left transition-colors duration-150",
    showLeftAccent && "before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-[5px] before:bg-brand",
    isActive
      ? "bg-gray-200"
      : isTouchFeedback
        ? "bg-brand-soft ring-1 ring-inset ring-brand/20"
        : "hover:bg-gray-100 active:bg-brand-soft"
  );
  const content = (
    <>
      <Icon
        className="h-5 w-5 shrink-0 text-[#8b929c]"
        aria-hidden="true"
        strokeWidth={1.5}
        absoluteStrokeWidth
      />
      <div className="min-w-0">
        <p className={cn("text-[16px] leading-tight uppercase text-brand", isActive ? "font-bold" : "font-normal")}>
          {item.label}
        </p>
        {item.description && (
          <p className={cn("text-[14px] leading-tight mt-0.5 uppercase text-brand/80", isActive ? "font-bold" : "font-normal")}>
            {item.description}
          </p>
        )}
      </div>
    </>
  );

  if (item.onSelect) {
    return (
      <button
        type="button"
        onClick={(event) => {
          onActivate(item, event.currentTarget);
          item.onSelect();
        }}
        onTouchStart={() => onTouchStart(item.id)}
        className={className}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={(event) => onActivate(item, event.currentTarget)}
      onTouchStart={() => onTouchStart(item.id)}
      className={className}
      aria-current={isActive ? "page" : undefined}
    >
      {content}
    </Link>
  );
}

interface MobileMenuGroupProps {
  group: LayoutNavigationGroup;
  activePath: string;
  open: boolean;
  touchFeedbackKey: string | null;
  onToggle: () => void;
  onActivate: (item: LayoutNavigationItem, element: HTMLElement) => void;
  onTouchStart: (key: string) => void;
}

export function MobileMenuGroup({
  group,
  activePath,
  open,
  touchFeedbackKey,
  onToggle,
  onActivate,
  onTouchStart,
}: MobileMenuGroupProps) {
  const GroupIcon = group.icon;
  const ToggleIcon = open ? ChevronUp : ChevronDown;
  const isActive = group.items.some(
    (item) => item.href === activePath,
  );
  const hasTouchFeedback = touchFeedbackKey === group.id;
  const showLeftAccent = isActive || hasTouchFeedback;
  const submenuId = `mobile-${group.id}-submenu`;

  return (
    <>
      <button
        type="button"
        onClick={onToggle}
        onTouchStart={() => onTouchStart(group.id)}
        className={cn(
          "relative flex w-full items-center gap-3 border-b border-[#cfd4db] px-5 py-4 pr-16 text-left [border-bottom-style:dotted] transition-colors duration-150",
          showLeftAccent && "before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-[5px] before:bg-brand",
          open || isActive
            ? "bg-[#eeeeea]"
            : hasTouchFeedback
              ? "bg-brand-soft ring-1 ring-inset ring-brand/20"
              : "hover:bg-gray-100 active:bg-brand-soft"
        )}
        aria-expanded={open}
        aria-controls={submenuId}
      >
        <GroupIcon className="h-5 w-5 shrink-0 text-[#8b929c]" aria-hidden="true" strokeWidth={1.5} absoluteStrokeWidth />
        <div className="min-w-0 flex-1">
          <p className={cn("text-[16px] leading-tight uppercase text-brand", isActive ? "font-bold" : "font-normal")}>
            {group.label}
          </p>
        </div>
        <span className="absolute right-5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center border border-[#d3d7dd] bg-[#f5f5f5] text-[#7d858f] shadow-[0_0_0_1px_rgba(63,109,181,0.08)]">
          <ToggleIcon className="h-5 w-5" aria-hidden="true" strokeWidth={1.5} absoluteStrokeWidth />
        </span>
      </button>

      <div
        id={submenuId}
        className={cn(
          "overflow-hidden bg-[#eeeeea] transition-[max-height,opacity] duration-200 ease-out",
          open ? "max-h-[480px] opacity-100" : "pointer-events-none max-h-0 opacity-0"
        )}
        aria-hidden={!open}
      >
        <div>
          {group.items.map((item) => {
            const ItemIcon = item.icon;
            const itemIsActive = activePath === item.href;
            const itemClassName = cn(
              "relative flex w-full items-center gap-3 border-b border-[#cfd4db] px-9 py-3.5 text-left [border-bottom-style:dotted] transition-colors duration-150",
              itemIsActive && "before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-[5px] before:bg-brand",
              itemIsActive ? "bg-[#d8d8d8]" : "hover:bg-gray-100 active:bg-brand-soft"
            );
            const content = (
              <>
                <ItemIcon className="h-5 w-5 shrink-0 text-[#8b929c]" aria-hidden="true" strokeWidth={1.5} absoluteStrokeWidth />
                <div className="min-w-0">
                  <p className={cn("text-[17px] leading-tight text-brand", itemIsActive ? "font-bold" : "font-normal")}>
                    {item.label}
                  </p>
                  {item.description && (
                    <p className="mt-1 text-[13px] font-normal leading-tight text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              </>
            );

            if (item.onSelect) {
              return (
                <button
                  key={item.id}
                  type="button"
                  tabIndex={open ? undefined : -1}
                  onClick={(event) => {
                    onActivate(item, event.currentTarget);
                    item.onSelect();
                  }}
                  onTouchStart={() => onTouchStart(item.id)}
                  className={itemClassName}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link
                key={item.id}
                href={item.href}
                tabIndex={open ? undefined : -1}
                onClick={(event) => onActivate(item, event.currentTarget)}
                onTouchStart={() => onTouchStart(item.id)}
                className={itemClassName}
                aria-current={itemIsActive ? "page" : undefined}
              >
                {content}
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
        helpTouchFeedback && "before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-[5px] before:bg-brand",
        helpTouchFeedback
          ? "bg-brand-soft ring-1 ring-inset ring-brand/20"
          : "hover:bg-gray-100 active:bg-brand-soft"
      )}
      aria-label="Abrir ayuda"
    >
      <MessageSquare className="h-5 w-5 shrink-0 text-[#8b929c]" aria-hidden="true" strokeWidth={1.5} absoluteStrokeWidth />
      <div className="min-w-0">
        <p className="text-[16px] leading-tight uppercase font-normal text-brand">
          Ayuda
        </p>
        <p className="mt-0.5 text-[14px] leading-tight uppercase font-normal text-brand/80">
          Asistente virtual
        </p>
      </div>
    </button>
  );
}

interface PwaMenuLinkProps {
  item: LayoutNavigationRouteItem;
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
        isActive ? "bg-gray-200" : "hover:bg-gray-100 active:bg-brand-soft",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <PwaIcon className={cn("h-5 w-5 shrink-0", "text-[#8b929c]")} aria-hidden="true" strokeWidth={1.5} absoluteStrokeWidth />
      <div className="min-w-0">
        <p
          className={cn(
            "text-[16px] leading-tight uppercase",
            "text-brand",
            isActive ? "font-bold" : "font-normal",
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
          className="flex items-center gap-2.5 text-[16px] font-normal text-brand hover:text-brand-hover transition-colors"
          aria-label="Síguenos en Instagram"
        >
          <Instagram className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={1.5} absoluteStrokeWidth />
          Instagram
        </a>
        <a
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 text-[16px] font-normal text-brand hover:text-brand-hover transition-colors"
          aria-label="Síguenos en Facebook"
        >
          <Facebook className="h-4 w-4 shrink-0" aria-hidden="true" strokeWidth={1.5} absoluteStrokeWidth />
          Facebook
        </a>
      </div>
    </div>
  );
}
