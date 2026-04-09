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
      <header className="fixed md:absolute top-0 left-0 right-0 z-[60] bg-[#292929] border-none text-white h-[54px] md:h-[48px]">
        <div className="flex items-center justify-between h-full px-4 md:px-0 lg:px-6 max-w-[1150px] mx-auto relative z-[61]">
          {/* Logo — always visible, links to home */}
          <Link
            href="/"
            className="flex items-center gap-2.5 shrink-0 relative z-[62] md:pl-4 lg:pl-0"
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
            {/* 1. Hide the text first when shrinking */}
            <div className="hidden lg:block">
              <Logo variant="small" className="text-white" />
            </div>
          </Link>

          {/* Desktop navigation — resort to hamburger only on small screens < 768px */}
          <nav
            className="hidden md:flex items-center flex-1 justify-center h-full relative z-[62]"
            aria-label="Navegación principal"
          >
            {navItems.map(({ href, label, icon: Icon }) => {
              const isInicio = href === "/";
              const isActive = pathname === href && !isInicio;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2 h-full px-2 lg:px-3 xl:px-4 text-[11px] transition-colors font-normal whitespace-nowrap tracking-wider",
                    isActive
                      ? "text-white bg-[#4a70a5]"
                      : "text-white hover:bg-[#4a70a5]/50"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon className="h-[15px] w-[15px] shrink-0" aria-hidden="true" strokeWidth={1.5} />
                  {label.toUpperCase()}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center shrink-0 h-full relative z-[62] md:pr-4 lg:pr-0">
            {/* Social links — desktop only (2. Remove social links when shrinking) */}
            <div className="hidden lg:flex items-center gap-1">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 text-white hover:bg-white/10 transition-colors"
                aria-label="Síguenos en Instagram"
              >
                <Instagram className="h-[15px] w-[15px]" aria-hidden="true" strokeWidth={1.5} />
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-10 w-10 text-white hover:bg-white/10 transition-colors"
                aria-label="Síguenos en Facebook"
              >
                <Facebook className="h-[15px] w-[15px]" aria-hidden="true" strokeWidth={1.5} />
              </a>
            </div>

            {/* Mobile/Tablet only: hamburger (3. Resort to hamburger on small screens) */}
            <div className="md:hidden flex items-center justify-center -mr-4 text-white relative z-[62] h-full">
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
