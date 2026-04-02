"use client"

import Image from "next/image"
import { MobileMenu } from "@/components/mobile-menu"
import { DebugTimePicker } from "@/components/debug-time-picker"
import { Logo } from "@/components/logo"

interface AppHeaderProps {
  instagramUrl?: string
  facebookUrl?: string
}

export function AppHeader({ 
  instagramUrl = "https://instagram.com/regionmayo",
  facebookUrl = "https://facebook.com/regionmayo"
}: AppHeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
      <div className="flex items-center justify-between h-14 px-4 max-w-7xl mx-auto">
        {/* Logo and Title - Clean left side */}
        <div className="flex items-center gap-3">
          <Image
            src="/images/region-mayo-logo.jpg"
            alt="Región Mayo Logo"
            width={36}
            height={36}
            className="rounded-full"
            loading="eager"
            priority
          />
          <Logo variant="small" />
        </div>

        {/* Right Side: Clean - Only Menu (social icons moved to menu) */}
        <div className="flex items-center gap-2">
          {/* Debug Time Picker - Only in development */}
          <DebugTimePicker />

          {/* Hamburger Menu - Clean, prominent */}
          <MobileMenu 
            instagramUrl={instagramUrl}
            facebookUrl={facebookUrl}
          />
        </div>
      </div>
    </header>
  )
}
