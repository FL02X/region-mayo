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
  { href: "/directorio", label: "Pastores", icon: Users },
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
      <header className="fixed md:absolute top-0 left-0 right-0 z-[60] bg-[#21252b] border-b border-white/10 text-white h-[49px] md:h-[45px] md:shadow-none shadow-[0_2px_8px_rgba(0,0,0,0.12)]">
        <div className="h-full max-w-[950px] mx-auto relative z-[61]">
          {/* Desktop layout: 1) logo 2) nav 3) search 4) socials */}
          <div className="hidden md:flex items-center h-full px-4 lg:px-6 gap-2">
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

            <nav
              className="flex items-center h-full flex-1 min-w-0"
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
                      "flex items-center gap-1.5 h-full px-2.5 lg:px-3 text-[11px] transition-colors font-medium whitespace-nowrap tracking-[0.04em] uppercase border-b-2 border-transparent",
                      isActive
                        ? "text-white border-[#2f5e93] bg-[#2f5e93]"
                        : "text-white/90 hover:text-white hover:border-white/30 hover:bg-white/5"
                    )}
                    aria-current={isActive ? "page" : undefined}
                  >
                    <Icon
                      className="hidden xl:block h-[15px] w-[15px] shrink-0 opacity-80"
                      aria-hidden="true"
                      strokeWidth={1.75}
                    />
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="w-[180px] shrink-0 h-full items-center flex">
              <form
                className="relative w-full h-[34px] bg-[#f7f7f7] rounded-[2px] flex items-center overflow-hidden border border-[#9aa1ab] focus-within:border-[#6c8fbc] transition-colors"
                onSubmit={handleSearchSubmit}
              >
                <input
                  type="search"
                  name="q"
                  placeholder="Buscar"
                  className="flex-1 min-w-0 h-full bg-transparent border-none text-[13px] leading-none text-[#222] placeholder-[#6f7480] pl-3 pr-2 focus:outline-none focus:ring-0"
                  aria-label="Búsqueda"
                />
                <div className="h-[22px] w-px bg-[#b2b8c1] shrink-0" aria-hidden="true" />
                <button
                  type="submit"
                  className="w-[40px] h-full flex items-center justify-center bg-[#f4f4f4] hover:bg-[#ececec] transition-colors cursor-pointer"
                  aria-label="Ejecutar búsqueda"
                >
                  <Search className="h-[17px] w-[17px] text-[#4a4a4a]" strokeWidth={1.6} />
                </button>
              </form>
            </div>

            <div className="flex items-center gap-0.5 shrink-0">
              <a
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-9 w-9 text-white/90 hover:text-white transition-colors"
                aria-label="Síguenos en Instagram"
              >
                <Instagram className="h-[18px] w-[18px]" aria-hidden="true" strokeWidth={1.75} />
              </a>
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center h-9 w-9 text-white/90 hover:text-white transition-colors"
                aria-label="Síguenos en Facebook"
              >
                <Facebook className="h-[18px] w-[18px]" aria-hidden="true" strokeWidth={1.75} />
              </a>
            </div>
          </div>

          {/* Mobile Search Bar - between logo and hamburger */}
          <div className="md:hidden grid grid-cols-[40px_minmax(0,1fr)_40px] items-center h-full px-3 gap-2 relative z-[62]">
            <div className="flex items-center justify-start h-full relative z-[62] shrink-0">
              <Link
                href="/"
                className="flex items-center justify-center h-9 w-9 shrink-0"
                aria-label="Inicio — Region Mayo"
              >
                <Image
                  src="/images/region-mayo-logo.jpg"
                  alt="Región Mayo"
                  width={26}
                  height={26}
                  className="rounded-full shrink-0"
                  loading="eager"
                  priority
                />
              </Link>
            </div>

            <div className="min-w-0 relative z-[62] flex justify-center items-center h-full">
              <form
                className="relative w-full min-w-0 h-[36px] bg-[#f7f7f7] rounded-[2px] flex items-center overflow-hidden border border-[#9aa1ab] focus-within:border-[#6c8fbc] transition-colors"
                onSubmit={handleSearchSubmit}
              >
                <input
                  type="search"
                  name="q"
                  placeholder="Buscar..."
                  className="flex-1 min-w-0 h-full bg-transparent border-none text-[13px] leading-none text-[#222] placeholder-[#6f7480] pl-3 pr-2 focus:outline-none focus:ring-0"
                  aria-label="Escribe tu búsqueda"
                />
                <div className="h-[22px] w-px bg-[#b2b8c1] shrink-0" aria-hidden="true"></div>
                <button
                  type="submit"
                  className="w-[40px] h-full flex items-center justify-center bg-[#f4f4f4] hover:bg-[#ececec] transition-colors cursor-pointer"
                  aria-label="Ejecutar búsqueda"
                >
                  <Search className="h-[17px] w-[17px] text-[#4a4a4a]" strokeWidth={1.6} />
                </button>
              </form>
            </div>

            {/* Mobile/Tablet only: hamburger (3. Resort to hamburger on small screens) */}
            <div className="md:hidden flex items-center justify-end text-white relative z-[62] h-full shrink-0">
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
