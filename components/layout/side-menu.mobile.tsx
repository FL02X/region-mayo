"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  Settings,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInstallPrompt } from "@/hooks/use-install-prompt";
import { InstallModal } from "@/components/pwa/install-modal";

interface MobileMenuProps {
  instagramUrl?: string;
  facebookUrl?: string;
}

interface MobileMenuItem {
  href: string;
  label: string;
  icon: typeof Home;
  description?: string;
}

const menuItems: MobileMenuItem[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/coros", label: "Coros Locales", icon: Music },
  { href: "/album", label: "Álbum de Actividades", icon: Images },
  { href: "/directiva", label: "Directiva", icon: UserCircle },
];

const iglesiasItems: MobileMenuItem[] = [
  { href: "/templos", label: "Templos", icon: Church },
  { href: "/pastores", label: "Pastores", icon: Users },
];

export function MobileMenu({
  instagramUrl = "https://instagram.com/regionmayo",
  facebookUrl = "https://facebook.com/regionmayo",
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [touchFeedbackHref, setTouchFeedbackHref] = useState<string | null>(null);
  const touchFeedbackTimerRef = useRef<number | null>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [activePath, setActivePath] = useState("");
  const [iglesiasOpen, setIglesiasOpen] = useState(false);
  const isMobile = useIsMobile();
  const { isInstalled } = useInstallPrompt();

  const showSettings = isMounted && isMobile && isInstalled;
  const showInstall = isMounted && isMobile && !isInstalled;
  const pwaItem = showSettings
    ? { href: "/configuracion", label: "Configuracion", icon: Settings }
    : showInstall
      ? { href: "/instalar", label: "Instalar app", icon: Smartphone }
      : null;

  useEffect(() => {
    setIsMounted(true);
    setActivePath(window.location.pathname);
    setIglesiasOpen(window.location.pathname === "/templos" || window.location.pathname === "/pastores");
    return () => {
      if (touchFeedbackTimerRef.current !== null) {
        window.clearTimeout(touchFeedbackTimerRef.current);
      }
    };
  }, []);

  const triggerTouchFeedback = (href: string) => {
    setTouchFeedbackHref(href);

    if (touchFeedbackTimerRef.current !== null) {
      window.clearTimeout(touchFeedbackTimerRef.current);
    }

    touchFeedbackTimerRef.current = window.setTimeout(() => {
      setTouchFeedbackHref(null);
      touchFeedbackTimerRef.current = null;
    }, 220);
  };

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={(value) => {
          if (isInstallModalOpen) {
            setOpen(true);
            return;
          }
          setOpen(value);
        }}
      >
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-[2px] text-[#d1d5db] hover:bg-white/10"
          aria-label={open ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
        >
          <svg
            viewBox="0 0 20 20"
            className="size-[20px]"
            aria-hidden="true"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M1.25 4.5H18.75" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M1.25 10H18.75" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            <path d="M1.25 15.5H18.75" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
          {open && (
            <span
              className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2 border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent border-b-white"
              aria-hidden="true"
            />
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[85vw] sm:w-[350px] p-0 flex flex-col pt-[54px] bg-background border-l-0"
        style={{
          height: "100dvh",
          boxShadow: "-10px 0 20px -10px rgba(0,0,0,0.2)"
        }}
        hideCloseButton
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Menú de Navegación</SheetTitle>
        </SheetHeader>

        <div className="flex h-12 items-center justify-end px-4 border-b border-border/60 shrink-0 bg-[#292929] absolute top-0 right-0 left-0">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-white hover:bg-white/10 ml-auto"
            onClick={(e) => {
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate(60);
              }
              setOpen(false);
            }}
            aria-label="Cerrar menú"
          >
            <svg
              viewBox="0 0 20 20"
              className="h-7 w-7"
              aria-hidden="true"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M3 3L17 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M17 3L3 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto" aria-label="Menú principal">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.href && item.href !== "/";
            const isTouchFeedback = touchFeedbackHref === item.href;
            const showLeftAccent = isActive || isTouchFeedback;
            
            const handleMenuClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
              triggerTouchFeedback(item.href);

              // Haptic feedback
              if (typeof navigator !== "undefined" && navigator.vibrate) {
                navigator.vibrate(60);
              }
              
              // Add flick animation
              const target = e.currentTarget;
              target.classList.add("flick-feedback");
              
              // Remove animation class after it completes
              const handleAnimationEnd = () => {
                target.classList.remove("flick-feedback");
                target.removeEventListener("animationend", handleAnimationEnd);
              };
              target.addEventListener("animationend", handleAnimationEnd);
            };
            
            return (
              <div key={item.href}>
                <Link
                  href={item.href}
                  onClick={(e) => {
                    handleMenuClick(e);
                    window.setTimeout(() => {
                      setOpen(false);
                    }, 120);
                  }}
                  onTouchStart={() => {
                    triggerTouchFeedback(item.href);
                  }}
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

                {item.href === "/" && (() => {
                  const iglesiasActive = activePath === "/templos" || activePath === "/pastores";
                  const showIglesiasLeftAccent = touchFeedbackHref === "/iglesias" && !iglesiasActive;
                  const ToggleIcon = iglesiasOpen ? ChevronUp : ChevronDown;

                  return (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          triggerTouchFeedback("/iglesias");
                          if (typeof navigator !== "undefined" && navigator.vibrate) {
                            navigator.vibrate(60);
                          }
                          setIglesiasOpen((value) => !value);
                        }}
                        onTouchStart={() => {
                          triggerTouchFeedback("/iglesias");
                        }}
                        className={cn(
                          "relative flex w-full items-center gap-3 border-b border-[#cfd4db] px-5 py-4 pr-16 text-left [border-bottom-style:dotted] transition-colors duration-150",
                          showIglesiasLeftAccent && "before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-[5px] before:bg-[#3f6db5]",
                          iglesiasOpen ? "bg-[#eeeeea]" : "hover:bg-gray-100 active:bg-[#e8f1ff]"
                        )}
                        aria-expanded={iglesiasOpen}
                        aria-controls="mobile-iglesias-submenu"
                      >
                        <Church className="h-5 w-5 shrink-0 text-[#8b929c]" aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[16px] font-normal leading-tight uppercase text-[#00508F]">
                            Iglesias
                          </p>
                        </div>
                        <span className="absolute right-5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center border border-[#d3d7dd] bg-[#f5f5f5] text-[#7d858f] shadow-[0_0_0_1px_rgba(63,109,181,0.08)]">
                          <ToggleIcon className="h-5 w-5" aria-hidden="true" strokeWidth={1.5} />
                        </span>
                      </button>

                      <div
                        id="mobile-iglesias-submenu"
                        className={cn(
                          "overflow-hidden bg-[#eeeeea] transition-[max-height,opacity] duration-200 ease-out",
                          iglesiasOpen ? "max-h-40 opacity-100" : "pointer-events-none max-h-0 opacity-0"
                        )}
                        aria-hidden={!iglesiasOpen}
                      >
                        <div>
                          {iglesiasItems.map((iglesiaItem) => {
                              const IglesiaIcon = iglesiaItem.icon;
                              const iglesiaItemActive = activePath === iglesiaItem.href;

                              return (
                                <Link
                                  key={iglesiaItem.href}
                                  href={iglesiaItem.href}
                                  tabIndex={iglesiasOpen ? undefined : -1}
                                  onClick={(e) => {
                                    triggerTouchFeedback(iglesiaItem.href);
                                    if (typeof navigator !== "undefined" && navigator.vibrate) {
                                      navigator.vibrate(60);
                                    }

                                    const target = e.currentTarget;
                                    target.classList.add("flick-feedback");
                                    const handleAnimationEnd = () => {
                                      target.classList.remove("flick-feedback");
                                      target.removeEventListener("animationend", handleAnimationEnd);
                                    };
                                    target.addEventListener("animationend", handleAnimationEnd);

                                    window.setTimeout(() => {
                                      setOpen(false);
                                    }, 120);
                                  }}
                                  onTouchStart={() => {
                                    triggerTouchFeedback(iglesiaItem.href);
                                  }}
                                  className={cn(
                                    "relative flex items-center gap-3 border-b border-[#cfd4db] px-9 py-3.5 [border-bottom-style:dotted] transition-colors duration-150",
                                    iglesiaItemActive && "before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-[5px] before:bg-[#3f6db5]",
                                    iglesiaItemActive ? "bg-[#d8d8d8]" : "hover:bg-gray-100 active:bg-[#e8f1ff]"
                                  )}
                                  aria-current={iglesiaItemActive ? "page" : undefined}
                                >
                                  <IglesiaIcon className="h-5 w-5 shrink-0 text-[#8b929c]" aria-hidden="true" />
                                  <p className={cn("text-[17px] leading-tight", iglesiaItemActive ? "font-bold text-[#00508F]" : "font-normal text-[#00508F]")}>
                                    {iglesiaItem.label}
                                  </p>
                                </Link>
                              );
                            })}
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            );
          })}

          {pwaItem && (() => {
            const PwaIcon = pwaItem.icon;
            const isActive = activePath === pwaItem.href;
            const isInstallItem = pwaItem.label === "Instalar app";

            return (
              <Link
                href={pwaItem.href}
                onClick={(event) => {
                  if (isInstallItem) {
                    event.preventDefault();
                  }

                  triggerTouchFeedback(pwaItem.href);
                  if (typeof navigator !== "undefined" && navigator.vibrate) {
                    navigator.vibrate(60);
                  }
                  window.setTimeout(() => {
                    if (!isInstallItem) {
                      setOpen(false);
                    }
                    if (isInstallItem) {
                      setIsInstallModalOpen(true);
                    }
                  }, 120);
                }}
                onTouchStart={() => {
                  triggerTouchFeedback(pwaItem.href);
                }}
                className={cn(
                  "relative flex items-center gap-3 px-5 py-4 border-b border-[#cfd4db] [border-bottom-style:dotted] transition-colors duration-150",
                  isActive ? "bg-gray-200" : "hover:bg-gray-100 active:bg-[#e8f1ff]",
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <PwaIcon className={cn("h-5 w-5 shrink-0", "text-[#8b929c]")} aria-hidden="true" />
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-[16px] leading-tight uppercase",
                      isActive ? "font-bold text-[#00508F]" : "font-normal text-[#00508F]",
                    )}
                  >
                    {pwaItem.label}
                  </p>
                </div>
              </Link>
            );
          })()}
        </nav>

        {/* Social links footer */}
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
              <Instagram className="h-4 w-4 shrink-0" aria-hidden="true" />
              Instagram
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-[16px] font-normal text-[#00508F] hover:text-[#003B6D] transition-colors"
              aria-label="Síguenos en Facebook"
            >
              <Facebook className="h-4 w-4 shrink-0" aria-hidden="true" />
              Facebook
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>

      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </>
  );
}
