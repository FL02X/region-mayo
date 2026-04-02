"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Menu, Home, Users, Music, Images, UserCircle, Instagram, Facebook } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface MobileMenuProps {
  instagramUrl?: string
  facebookUrl?: string
}

const menuItems = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/directorio", label: "Directorio", description: "Pastores", icon: Users },
  { href: "/coros", label: "Coros Locales", icon: Music },
  { href: "/album", label: "Album de Actividades", icon: Images },
  { href: "/directiva", label: "Directiva", icon: UserCircle },
]

export function MobileMenu({ 
  instagramUrl = "https://instagram.com/regionmayo",
  facebookUrl = "https://facebook.com/regionmayo"
}: MobileMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-9 w-9 rounded-full"
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[280px] max-w-[85vw] p-0 overflow-y-auto">
        <SheetHeader className="border-b px-4 py-3">
          <div className="flex items-center gap-3">
            <Image
              src="/images/region-mayo-logo.jpg"
              alt="Region Mayo Logo"
              width={36}
              height={36}
              className="rounded-full shrink-0"
            />
            <div className="min-w-0">
              <SheetTitle className="text-left font-sans text-base">Region Mayo</SheetTitle>
              <p className="text-xs text-muted-foreground">Tu Comunidad</p>
            </div>
          </div>
        </SheetHeader>

        <nav className="flex flex-col py-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted shrink-0">
                  <Icon className="h-4 w-4 text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground">{item.label}</p>
                  {item.description && (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Social Links Footer - Monochromatic icons for visual discipline */}
        <div className="mt-auto border-t bg-muted/30 px-4 py-3">
          <p className="text-xs text-muted-foreground mb-2">Siguenos</p>
          <div className="flex gap-2">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Siguenos en Instagram"
            >
              <Instagram className="h-4 w-4 text-foreground" />
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Siguenos en Facebook"
            >
              <Facebook className="h-4 w-4 text-foreground" />
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
