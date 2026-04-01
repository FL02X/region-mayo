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
      <SheetContent side="right" className="w-80 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-3">
            <Image
              src="/images/region-mayo-logo.jpg"
              alt="Región Mayo Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div>
              <SheetTitle className="text-left font-serif italic">Región Mayo</SheetTitle>
              <p className="text-sm text-muted-foreground">Tu Comunidad</p>
            </div>
          </div>
        </SheetHeader>

        <nav className="flex flex-col py-4">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center gap-4 px-6 py-3.5 hover:bg-muted transition-colors"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{item.label}</p>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Social Links Footer - Monochromatic icons for visual discipline */}
        <div className="absolute bottom-0 left-0 right-0 border-t bg-muted/30 px-6 py-4">
          <p className="text-sm text-muted-foreground mb-3">Síguenos</p>
          <div className="flex gap-3">
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Síguenos en Instagram"
            >
              <Instagram className="h-5 w-5 text-foreground" />
            </a>
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
              aria-label="Síguenos en Facebook"
            >
              <Facebook className="h-5 w-5 text-foreground" />
            </a>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
