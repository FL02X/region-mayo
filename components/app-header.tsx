"use client";

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
import { MobileMenu } from "@/components/mobile-menu";
import { DebugTimePicker } from "@/components/debug-time-picker";
import { Logo } from "@/components/logo";

interface AppHeaderProps {
  instagramUrl?: string;
  facebookUrl?: string;
}

const navItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/templos", label: "Templos", icon: Church },
  { href: "/directorio", label: "Directorio", icon: Users },
  { href: "/coros", label: "Coros", icon: Music },
  { href: "/album", label: "Álbum", icon: Images },
  { href: "/directiva", label: "Directiva", icon: UserCircle },
];

export function AppHeader({
  instagramUrl = "https://instagram.com/regionmayo",
  facebookUrl = "https://facebook.com/regionmayo",
}: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4 md:px-6 max-w-7xl mx-auto">
          {/* Logo — always visible, links to home */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0"
            aria-label="Inicio — Region Mayo"
          >
            <Image
              src="/images/region-mayo-logo.jpg"
              alt="Región Mayo"
              width={30}
              height={30}
              className="rounded-full shrink-0"
              loading="eager"
              priority
            />
            <Logo variant="small" />
          </Link>

          {/* Desktop navigation — hidden on mobile */}
          <nav
            className="hidden md:flex items-center flex-1 justify-center"
            aria-label="Navegación principal"
          >
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "text-foreground font-semibold border-b-2 border-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted font-medium"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Social links — desktop only */}
            <div className="hidden md:flex items-center gap-0.5">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Síguenos en Instagram"
              >
                <Instagram className="h-4 w-4" aria-hidden="true" />
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label="Síguenos en Facebook"
              >
                <Facebook className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>

            {/* Mobile only: hamburger */}
            <div className="md:hidden">
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
        <div className="fixed bottom-4 right-4 z-50 opacity-60 hover:opacity-100 transition-opacity">
          <DebugTimePicker />
        </div>
      )}
    </>
  );
}
