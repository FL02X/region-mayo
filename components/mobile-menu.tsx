"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface MobileMenuProps {
  instagramUrl?: string;
  facebookUrl?: string;
}

const menuItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/templos", label: "Templos", icon: Church },
  {
    href: "/directorio",
    label: "Directorio",
    description: "Pastores",
    icon: Users,
  },
  { href: "/coros", label: "Coros Locales", icon: Music },
  { href: "/album", label: "Álbum de Actividades", icon: Images },
  { href: "/directiva", label: "Directiva", icon: UserCircle },
];

export function MobileMenu({
  instagramUrl = "https://instagram.com/regionmayo",
  facebookUrl = "https://facebook.com/regionmayo",
}: MobileMenuProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-[54px] w-[54px] rounded-none text-[#d1d5db] hover:bg-white/10"
          aria-label={open ? "Cerrar menú de navegación" : "Abrir menú de navegación"}
        >
          {open ? (
            <svg
              viewBox="0 0 20 20"
              className="h-[40px] w-[40px]"
              aria-hidden="true"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M3 3L17 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M17 3L3 17" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 20 20"
              className="h-[40px] w-[40px]"
              aria-hidden="true"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M1.25 4.5H18.75" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M1.25 10H18.75" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
              <path d="M1.25 15.5H18.75" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
            </svg>
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
            onClick={() => setOpen(false)}
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
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "relative flex items-center gap-3 px-5 py-4 border-b border-[#cfd4db] [border-bottom-style:dotted] transition-colors",
                  isActive
                    ? "bg-gray-200 before:content-[''] before:absolute before:left-0 before:top-0 before:h-full before:w-[5px] before:bg-[#3f6db5]"
                    : "hover:bg-gray-100"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn("h-5 w-5 shrink-0", "text-[#8b929c]")}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className={cn("text-sm leading-tight uppercase", isActive ? "font-bold text-[#00508F]" : "font-normal text-[#00508F]")}>
                    {item.label}
                  </p>
                  {item.description && (
                    <p className={cn("text-xs leading-tight mt-0.5 uppercase", isActive ? "text-[#00508F]/80 font-bold" : "text-[#00508F]/80 font-normal")}>
                      {item.description}
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Social links footer */}
        <div className="border-t border-border px-5 py-4 shrink-0">
          <p className="text-[12px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
            Síguenos
          </p>
          <div className="flex flex-col gap-2">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm font-normal text-[#00508F] hover:text-[#003B6D] transition-colors"
              aria-label="Síguenos en Instagram"
            >
              <Instagram className="h-4 w-4 shrink-0" aria-hidden="true" />
              Instagram
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm font-normal text-[#00508F] hover:text-[#003B6D] transition-colors"
              aria-label="Síguenos en Facebook"
            >
              <Facebook className="h-4 w-4 shrink-0" aria-hidden="true" />
              Facebook
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
