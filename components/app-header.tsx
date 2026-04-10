"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Search,
} from "lucide-react";
import { MobileMenu } from "@/components/mobile-menu";
import { DebugTimePicker } from "@/components/debug-time-picker";

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
  const router = useRouter();

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const query = formData.get("q")?.toString() || "";
    if (query.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <>
      <header className="fixed md:absolute top-0 left-0 right-0 z-[60] bg-[#292929] border-none text-white h-[54px] md:h-[48px]">
        <div className="flex items-center justify-between h-full px-4 md:px-0 lg:px-6 max-w-[1150px] mx-auto relative z-[61]">
          {/* Left side container (flex-1 ensures desktop nav stays perfectly centered) */}
          <div className="flex items-center h-full relative z-[62] shrink-0 md:pl-4 lg:pl-0 md:flex-1 md:justify-start">
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
            </Link>

            {/* Desktop Static Search Bar */}
            <div className="hidden lg:flex lg:w-[160px] pl-3 shrink-0 h-full items-center">
              <form 
                className="relative w-full h-[32px] bg-white rounded-[2px] flex items-center overflow-hidden border border-[#bcc3cc] focus-within:ring-1 focus-within:ring-[#4a70a5] transition-shadow"
                onSubmit={handleSearchSubmit}
              >
                <input
                  type="search"
                  name="q"
                  placeholder="Buscar"
                  className="flex-1 min-w-0 h-full bg-transparent border-none text-[14px] text-black placeholder-[#6b7280] pl-3 pr-2 focus:outline-none focus:ring-0"
                  aria-label="Búsqueda"
                />
                <div className="h-[18px] w-[1px] bg-[#c9ced6] shrink-0" aria-hidden="true" />
                <button
                  type="submit"
                  className="flex items-center justify-center px-3 h-full bg-[#f8fafc] hover:bg-[#eef2f7] transition-colors cursor-pointer"
                  aria-label="Ejecutar búsqueda"
                >
                  <Search className="h-[15px] w-[15px] text-[#4b5563]" strokeWidth={2} />
                </button>
              </form>
            </div>
          </div>

          {/* Mobile Search Bar - between logo and hamburger */}
          <div className="md:hidden flex-1 min-w-0 mx-2 sm:mx-3 relative z-[62] flex justify-center items-center h-full">
            <form 
              className="relative w-full min-w-0 h-[36px] bg-white rounded-[2px] flex items-center overflow-hidden border border-[#bcc3cc] focus-within:ring-1 focus-within:ring-[#4a70a5] transition-shadow"
              onSubmit={handleSearchSubmit}
            >
               <input
                 type="search"
                 name="q"
                 placeholder="Buscar..."
                 className="flex-1 min-w-0 h-full bg-transparent border-none text-[14px] text-black placeholder-[#6b7280] pl-3 pr-2 focus:outline-none focus:ring-0"
                 aria-label="Escribe tu búsqueda"
               />
               <div className="h-[22px] w-[1px] bg-[#c9ced6] shrink-0" aria-hidden="true"></div>
               <button
                 type="submit"
                 className="flex items-center justify-center px-3 h-full bg-[#f8fafc] hover:bg-[#eef2f7] transition-colors cursor-pointer"
                 aria-label="Ejecutar búsqueda"
               >
                 <Search className="h-[16px] w-[16px] text-[#4b5563]" strokeWidth={2} />
               </button>
            </form>
          </div>

          {/* Desktop navigation — perfectly centered on desktop via flex context */}
          <nav
            className="hidden md:flex items-center shrink-0 justify-center h-full relative z-[62]"
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

          {/* Right side container */}
          <div className="flex items-center justify-end shrink-0 h-full relative z-[62] md:pr-4 lg:pr-0 md:flex-1">
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
            <div className="md:hidden flex items-center justify-center -mr-2 sm:-mr-4 text-white relative z-[62] h-full shrink-0">
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
