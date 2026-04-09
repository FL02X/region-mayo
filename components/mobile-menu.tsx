"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Menu,
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
          className="h-9 w-9"
          aria-label="Abrir menú de navegación"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="right"
        className="w-[260px] max-w-[85vw] p-0 flex flex-col overflow-y-auto"
      >
        {/* Header */}
        <SheetHeader className="border-b border-border px-5 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <Image
              src="/images/region-mayo-logo.jpg"
              alt="Región Mayo"
              width={32}
              height={32}
              className="rounded-full shrink-0"
            />
            <div className="min-w-0">
              <SheetTitle className="text-left font-semibold text-sm leading-tight">
                Region Mayo
              </SheetTitle>
              <p className="text-xs text-muted-foreground font-normal leading-tight mt-0.5">
                Tu Comunidad
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Navigation */}
        <nav className="flex-1" aria-label="Menú principal">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-5 py-4 border-b border-border/60 transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon
                  className={cn("h-4 w-4 shrink-0", isActive ? "text-foreground" : "text-muted-foreground")}
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className={cn("text-sm leading-tight", isActive ? "font-bold text-foreground" : "font-medium text-foreground")}>
                    {item.label}
                  </p>
                  {item.description && (
                    <p className={cn("text-xs leading-tight mt-0.5", isActive ? "text-foreground/80 font-medium" : "text-muted-foreground")}>
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
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-3">
            Síguenos
          </p>
          <div className="flex flex-col gap-2">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Síguenos en Instagram"
            >
              <Instagram className="h-4 w-4 shrink-0" aria-hidden="true" />
              Instagram
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
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
