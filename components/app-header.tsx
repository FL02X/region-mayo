"use client"

import Image from "next/image"
import { Instagram, Facebook } from "lucide-react"
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
        {/* Logo and Title */}
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

        {/* Right Side: Debug + Social + Menu */}
        <div className="flex items-center gap-2">
          {/* Debug Time Picker */}
          <DebugTimePicker />

          {/* Social Media Buttons - Hidden on very small screens */}
          <div className="hidden sm:flex items-center gap-1">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
              aria-label="Síguenos en Instagram"
            >
              <Instagram className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted transition-colors"
              aria-label="Síguenos en Facebook"
            >
              <Facebook className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </a>
          </div>

          {/* Hamburger Menu */}
          <MobileMenu 
            instagramUrl={instagramUrl}
            facebookUrl={facebookUrl}
          />
        </div>
      </div>
    </header>
  )
}
