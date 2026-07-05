"use client";

import Image from "next/image";
import { Newsreader } from "next/font/google";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const brandFont = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
  preload: false,
});

export function DesktopBrandNavBar() {
  const pathname = usePathname();
  const isStudioRoute = pathname?.startsWith("/studio") ?? false;
  const isAlbumPage = pathname === "/album";

  if (isStudioRoute) {
    return null;
  }

  return (
    <div
      className={cn("hidden md:block", isAlbumPage && "bg-[#000000]")}
      style={isAlbumPage ? { backgroundColor: "#000000" } : undefined}
    >
      <div
        className={cn(
          "desktop-content-pane mx-auto max-w-[1150px] bg-white md:border-x border-border",
          isAlbumPage && "border-brand bg-[#111111]",
        )}
        style={
          isAlbumPage
            ? { backgroundColor: "#111111", borderColor: "var(--brand)" }
            : undefined
        }
      >
        <div className="flex h-[55px] flex-row items-center gap-3 px-2.5">
          <div className="relative h-[48px] w-[48px] shrink-0">
            <Image
              src="/images/logo_igc.png"
              alt="Logo Iglesia Gentil de Cristo"
              fill
              sizes="48px"
              className="object-contain"
            />
          </div>
          <p
            className={cn(
              brandFont.className,
              "text-[18px] font-normal leading-none text-ink-soft",
              isAlbumPage && "text-ink-white",
            )}
          >
            Iglesia Gentil de Cristo A.R.  |  Región Mayo
          </p>
        </div>
      </div>
    </div>
  );
}
