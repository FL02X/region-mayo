"use client";

// Donde: menu hamburguesa del header. 
// Viewports: mobile. 
// Funcion: muestra enlaces, ayuda, instalacion PWA y redes.
import { useEffect, useRef, useState, type MouseEvent } from "react";
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
import {
  DEFAULT_FACEBOOK_URL,
  DEFAULT_INSTAGRAM_URL,
  installMenuItem,
  mobileMainMenuItems,
  settingsMenuItem,
} from "@/components/layout/navigation-items";
import {
  addFlickFeedback,
  vibrateForMenuTap,
} from "@/components/layout/mobile-menu/menu-feedback";
import {
  CloseMenuIcon,
  HamburgerMenuIcon,
} from "@/components/layout/mobile-menu/menu-icons";
import {
  HelpMenuButton,
  IglesiasMenuSection,
  MainMenuLink,
  MobileMenuSocialFooter,
  PwaMenuLink,
} from "@/components/layout/mobile-menu/menu-sections";

interface MobileMenuProps {
  instagramUrl?: string;
  facebookUrl?: string;
}

const MENU_CLOSE_DELAY_MS = 120;
const HELP_CHATBOT_DELAY_MS = 160;
const TOUCH_FEEDBACK_MS = 220;

export function MobileMenu({
  instagramUrl = DEFAULT_INSTAGRAM_URL,
  facebookUrl = DEFAULT_FACEBOOK_URL,
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [touchFeedbackHref, setTouchFeedbackHref] = useState<string | null>(null);
  const touchFeedbackTimerRef = useRef<number | null>(null);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [activePath, setActivePath] = useState("");
  const [iglesiasOpen, setIglesiasOpen] = useState(false);
  const [helpTouchFeedback, setHelpTouchFeedback] = useState(false);
  const isMobile = useIsMobile();
  const { isInstalled } = useInstallPrompt();
  const openChatbotTimerRef = useRef<number | null>(null);

  const showSettings = isMounted && isMobile && isInstalled;
  const showInstall = isMounted && isMobile && !isInstalled;
  const pwaItem = showSettings ? settingsMenuItem : showInstall ? installMenuItem : null;

  useEffect(() => {
    setIsMounted(true);
    setActivePath(window.location.pathname);
    setIglesiasOpen(window.location.pathname === "/templos" || window.location.pathname === "/pastores");

    return () => {
      if (touchFeedbackTimerRef.current !== null) {
        window.clearTimeout(touchFeedbackTimerRef.current);
      }
      if (openChatbotTimerRef.current !== null) {
        window.clearTimeout(openChatbotTimerRef.current);
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
    }, TOUCH_FEEDBACK_MS);
  };

  const activateNavigationLink = (href: string, element: HTMLElement) => {
    triggerTouchFeedback(href);
    vibrateForMenuTap();
    addFlickFeedback(element);

    window.setTimeout(() => {
      setOpen(false);
    }, MENU_CLOSE_DELAY_MS);
  };

  const toggleIglesiasMenu = () => {
    triggerTouchFeedback("/iglesias");
    vibrateForMenuTap();
    setIglesiasOpen((value) => !value);
  };

  const openHelpChatbot = () => {
    triggerTouchFeedback("/ayuda");
    setHelpTouchFeedback(true);

    if (touchFeedbackTimerRef.current !== null) {
      window.clearTimeout(touchFeedbackTimerRef.current);
    }

    if (openChatbotTimerRef.current !== null) {
      window.clearTimeout(openChatbotTimerRef.current);
    }

    vibrateForMenuTap();
    setOpen(false);

    // El chatbot vive fuera del menu, por eso se abre con un evento global despues de cerrar el Sheet.
    openChatbotTimerRef.current = window.setTimeout(() => {
      window.dispatchEvent(new CustomEvent("open-chatbot"));
      setHelpTouchFeedback(false);
      openChatbotTimerRef.current = null;
    }, HELP_CHATBOT_DELAY_MS);
  };

  const handlePwaClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!pwaItem) return;

    const isInstallItem = pwaItem.label === installMenuItem.label;
    if (isInstallItem) {
      event.preventDefault();
    }

    triggerTouchFeedback(pwaItem.href);
    vibrateForMenuTap();

    window.setTimeout(() => {
      if (!isInstallItem) {
        setOpen(false);
      }
      if (isInstallItem) {
        setIsInstallModalOpen(true);
      }
    }, MENU_CLOSE_DELAY_MS);
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
            <HamburgerMenuIcon />
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
              onClick={() => {
                vibrateForMenuTap();
                setOpen(false);
              }}
              aria-label="Cerrar menú"
            >
              <CloseMenuIcon />
            </Button>
          </div>

          <nav className="flex-1 overflow-y-auto" aria-label="Menú principal">
            {mobileMainMenuItems.map((item) => (
              <div key={item.href}>
                <MainMenuLink
                  item={item}
                  activePath={activePath}
                  touchFeedbackHref={touchFeedbackHref}
                  onActivate={activateNavigationLink}
                  onTouchStart={triggerTouchFeedback}
                />

                {item.href === "/" && (
                  <IglesiasMenuSection
                    activePath={activePath}
                    iglesiasOpen={iglesiasOpen}
                    onToggle={toggleIglesiasMenu}
                    onActivate={activateNavigationLink}
                    onTouchStart={triggerTouchFeedback}
                  />
                )}
              </div>
            ))}

            <HelpMenuButton
              helpTouchFeedback={helpTouchFeedback}
              onOpenHelp={openHelpChatbot}
              onTouchStart={() => triggerTouchFeedback("/ayuda")}
            />

            {pwaItem && (
              <PwaMenuLink
                item={pwaItem}
                activePath={activePath}
                onActivate={handlePwaClick}
                onTouchStart={() => triggerTouchFeedback(pwaItem.href)}
              />
            )}
          </nav>

          <MobileMenuSocialFooter instagramUrl={instagramUrl} facebookUrl={facebookUrl} />
        </SheetContent>
      </Sheet>

      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />
    </>
  );
}
