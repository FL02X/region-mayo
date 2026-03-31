"use client"

import Image from "next/image"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  const scrollToCalendar = () => {
    const calendarSection = document.getElementById("calendario")
    if (calendarSection) {
      // Account for fixed header (h-14 = 56px) - position content right below header
      const headerHeight = 56
      const elementPosition = calendarSection.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.scrollY - headerHeight

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      })
    }
  }

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/* Background Image */}
      <Image
        src="/images/hero-choir.jpg"
        alt="Coro Región Mayo"
        fill
        className="object-cover"
        priority
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-background" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-xs mx-auto text-center">
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 text-balance leading-snug">
            Bienvenido a Región Mayo
          </h1>
          <p className="text-sm sm:text-base text-white/90 mb-8">
            Vive la Comunidad
          </p>

          <Button
            onClick={scrollToCalendar}
            size="lg"
            className="w-full rounded-full py-5 text-sm font-semibold bg-white text-primary hover:bg-white/90 shadow-lg"
          >
            Explorar Calendario 2026
          </Button>
        </div>
      </div>

      {/* Scroll Indicator */}
      <button
        onClick={scrollToCalendar}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 animate-bounce"
        aria-label="Desplázate hacia abajo"
      >
        <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm">
          <ChevronDown className="h-5 w-5 text-white" />
        </div>
      </button>
    </section>
  )
}
