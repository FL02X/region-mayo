// Donde: son los cuadros individuales de la barra superior dentro de AppHeader.
// Viewports: desktop/tablet md+.
// Funcion: renderiza enlaces y grupos configurables de navegacion.

import type { CSSProperties } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  desktopNavItems,
  type LayoutNavigationGroup,
  type LayoutNavigationItem,
} from "@/components/layout/nav-bar-items";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DesktopNavigationProps {
  activePath: string;
  isMounted: boolean;
  onItemHover: (element: HTMLElement) => void;
  onItemLock: () => void;
  dropdownStyle?: CSSProperties;
}

const desktopItemClassName =
  "desktop-header-item flex cursor-pointer items-center gap-1.5 h-full px-2.5 lg:px-3.5 max-[914px]:w-25 max-[914px]:justify-center max-[914px]:gap-0 max-[914px]:px-0 max-[914px]:text-[0px] min-[915px]:px-3 min-[915px]:gap-0 min-[915px]:justify-center min-[916px]:text-[16px] min-[1101px]:justify-start min-[916px]:gap-2 min-[1101px]:text-[14px] text-[14px] transition-colors whitespace-nowrap tracking-[0.04em] uppercase border-b-2 border-transparent";

function itemIsActive(
  item: LayoutNavigationItem,
  activePath: string,
  isMounted: boolean,
) {
  return (
    isMounted &&
    "href" in item &&
    item.href === activePath &&
    item.href !== "/"
  );
}

function DesktopItemContent({ item }: { item: LayoutNavigationItem }) {
  const Icon = item.icon;

  return (
    <>
      <Icon
        className="desktop-header-icon h-[15px] w-[15px] max-[914px]:h-[23px] max-[914px]:w-[23px] shrink-0 opacity-80 hidden max-[914px]:block min-[1101px]:block"
        aria-hidden="true"
        strokeWidth={1.75}
      />
      <span className="max-[914px]:sr-only min-[915px]:inline max-[914px]:hidden">
        {item.label}
      </span>
    </>
  );
}

function DesktopNavigationItem({
  item,
  activePath,
  isMounted,
  onItemHover,
}: {
  item: LayoutNavigationItem;
  activePath: string;
  isMounted: boolean;
  onItemHover: (element: HTMLElement) => void;
}) {
  const isActive = itemIsActive(item, activePath, isMounted);
  const className = cn(
    desktopItemClassName,
    isActive
      ? "-my-px h-[calc(100%+2px)] text-white bg-brand-active hover:bg-ink"
      : "text-white hover:text-white hover:border-white/30",
  );

  if (item.onSelect) {
    return (
      <button
        type="button"
        onClick={item.onSelect}
        onMouseEnter={(event) => onItemHover(event.currentTarget)}
        className={className}
        aria-label={item.label}
      >
        <DesktopItemContent item={item} />
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      onMouseEnter={(event) => onItemHover(event.currentTarget)}
      data-active={isActive ? "true" : undefined}
      className={className}
      aria-label={item.label}
      aria-current={isActive ? "page" : undefined}
    >
      <DesktopItemContent item={item} />
    </Link>
  );
}

function DesktopNavigationGroup({
  group,
  activePath,
  isMounted,
  onItemHover,
  onItemLock,
  dropdownStyle,
}: {
  group: LayoutNavigationGroup;
  activePath: string;
  isMounted: boolean;
  onItemHover: (element: HTMLElement) => void;
  onItemLock: () => void;
  dropdownStyle?: CSSProperties;
}) {
  const Icon = group.icon;
  const isActive = group.items.some((item) =>
    itemIsActive(item, activePath, isMounted),
  );

  return (
    <DropdownMenu
      modal={false}
      onOpenChange={(open) => {
        if (open) onItemLock();
      }}
    >
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          onMouseEnter={(event) => {
            if (event.currentTarget.dataset.state !== "open") {
              onItemHover(event.currentTarget);
            }
          }}
          data-active={isActive ? "true" : undefined}
          className={cn(
            desktopItemClassName,
            "group data-[state=open]:!border-white/30",
            isActive
              ? "-my-px h-[calc(100%+2px)] bg-brand-active text-white hover:bg-ink data-[state=open]:!bg-ink"
              : "text-white hover:border-white/30 hover:text-white data-[state=open]:!bg-brand-active",
          )}
          aria-label={`Abrir ${group.label}`}
        >
          <Icon
            className="desktop-header-icon h-[15px] w-[15px] max-[914px]:h-[23px] max-[914px]:w-[23px] shrink-0 opacity-80 hidden max-[914px]:block min-[1101px]:block"
            aria-hidden="true"
            strokeWidth={1.75}
          />
          <span className="max-[914px]:sr-only min-[915px]:inline max-[914px]:hidden">
            {group.label}
          </span>
          <ChevronDown
            className="desktop-header-icon hidden h-[12px] w-[12px] shrink-0 opacity-80 min-[1101px]:block group-data-[state=open]:rotate-180"
            aria-hidden="true"
            strokeWidth={1.8}
          />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        sideOffset={0}
        style={dropdownStyle}
        className="z-[80] w-max min-w-[220px] max-w-[min(320px,calc(100vw-3rem))] !overflow-visible rounded-none border border-brand-border bg-paper-highlight p-1.5 text-brand shadow-[0_24px_56px_-18px_rgba(15,23,42,0.42),0_12px_28px_-14px_rgba(15,23,42,0.32),0_2px_8px_rgba(15,23,42,0.12)] data-[state=open]:!animate-none data-[state=closed]:!animate-none"
      >
        <span
          className="absolute -top-[8px] left-[34px] h-0 w-0 border-x-[10px] border-b-[9px] border-x-transparent"
          style={{ borderBottomColor: "var(--bg-paper-highlight)" }}
          aria-hidden="true"
        />
        <DropdownMenuGroup className="grid max-h-[min(62vh,460px)] gap-0.5 overflow-y-auto">
          {group.items.map((item) => {
            const ChildIcon = item.icon;
            const childIsActive = itemIsActive(item, activePath, isMounted);
            const childClassName = cn(
              "group flex w-full cursor-pointer items-start gap-2.5 rounded-none px-3 py-2.5 text-left text-brand outline-none hover:bg-paper-dark hover:text-brand-hover focus:bg-paper-dark focus:text-brand-hover data-[highlighted]:bg-paper-dark data-[highlighted]:text-brand-hover",
              childIsActive && "bg-brand-soft text-brand-active",
            );
            const content = (
              <>
                <ChildIcon
                  className="mt-0.5 h-[18px] w-[18px] shrink-0 text-ink-muted-light"
                  aria-hidden="true"
                  strokeWidth={1.5}
                />
                <span className="grid gap-0.5 whitespace-nowrap">
                  <span className="text-[14px] font-medium leading-tight underline-offset-2 group-hover:underline">
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="text-[11px] font-normal leading-tight text-ink-muted">
                      {item.description}
                    </span>
                  )}
                </span>
              </>
            );
            const child =
              item.onSelect ? (
                <button type="button" onClick={item.onSelect}>
                  {content}
                </button>
              ) : (
                <Link
                  href={item.href}
                  aria-current={childIsActive ? "page" : undefined}
                >
                  {content}
                </Link>
              );

            return (
              <DropdownMenuItem key={item.id} asChild className={childClassName}>
                {child}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function DesktopNavigation({
  activePath,
  isMounted,
  onItemHover,
  onItemLock,
  dropdownStyle,
}: DesktopNavigationProps) {
  return (
    <nav
      className="flex cursor-default items-center h-full flex-1 min-w-0 max-[914px]:justify-between max-[914px]:px-2"
      aria-label="Navegación principal"
    >
      {desktopNavItems.map((entry) =>
        entry.kind === "group" ? (
          <DesktopNavigationGroup
            key={entry.id}
            group={entry}
            activePath={activePath}
            isMounted={isMounted}
            onItemHover={onItemHover}
            onItemLock={onItemLock}
            dropdownStyle={dropdownStyle}
          />
        ) : (
          <DesktopNavigationItem
            key={entry.id}
            item={entry}
            activePath={activePath}
            isMounted={isMounted}
            onItemHover={onItemHover}
          />
        ),
      )}
    </nav>
  );
}
