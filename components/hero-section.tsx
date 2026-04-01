"use client"

import { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { HeroImage } from "@/lib/types"

interface HeroSectionProps {
  heroImages?: HeroImage[]
  heroTitle?: string
  heroSubtitle?: string
}

export function HeroSection({ 
  heroImages = [{ url: "/images/hero-choir.jpg", alt: "Coro Región Mayo" }],
  heroTitle = "Bienvenido a Región Mayo",
  heroSubtitle = "Vive la Comunidad"
}: HeroSectionProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const images = heroImages.length > 0 ? heroImages : [{ url: "/images/hero-choir.jpg", alt: "Coro Región Mayo" }]

  const nextImage = useCallback(() => {
    if (images.length <= 1) return
    
    setIsTransitioning(true)
    setTimeout(() => {
      setCurrentImageIndex((prev) => (prev + 1) % images.length)
      setIsTransitioning(false)
    }, 500)
  }, [images.length])

  useEffect(() => {
    if (images.length <= 1) return

    const interval = setInterval(nextImage, 6000)
    return () => clearInterval(interval)
  }, [images.length, nextImage])

  const scrollToCalendar = () => {
    const calendarSection = document.getElementById("calendario")
    if (calendarSection) {
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
      {/* Background Images with Crossfade */}
      {images.map((image, index) => (
        <div
          key={image.url}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentImageIndex ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={image.url}
            alt={image.alt}
            fill
            className="object-cover"
            priority={index === 0}
            loading={index === 0 ? "eager" : "lazy"}
          />
        </div>
      ))}

      {/* Gradient Overlay - Dark at bottom for guaranteed text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Content - Positioned at bottom for optimal contrast */}
      <div className="relative z-10 h-full flex flex-col items-center justify-end pb-24 px-6">
        <div className="w-full max-w-xs mx-auto text-center">
          {/* Stylized Logo */}
          <p className="text-sm font-medium uppercase tracking-widest text-white/80 mb-2">
            {heroSubtitle}
          </p>
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-1 italic tracking-wide drop-shadow-lg">
            Región Mayo
          </h1>
          <p className="text-lg text-white/90 font-light mb-8">
            Calendario
          </p>

          {/* CTA Button - Coral/Orange for visibility */}
          <Button
            onClick={scrollToCalendar}
            size="lg"
            className="w-full rounded-xl py-6 text-base font-semibold bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white shadow-lg"
          >
            Explorar Calendario 2026
          </Button>
        </div>
      </div>

      {/* Image Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 flex gap-2">
          {images.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsTransitioning(true)
                setTimeout(() => {
                  setCurrentImageIndex(index)
                  setIsTransitioning(false)
                }, 300)
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentImageIndex 
                  ? "bg-white w-6" 
                  : "bg-white/50 hover:bg-white/70"
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Scroll Indicator */}
      <button
        onClick={scrollToCalendar}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 animate-bounce"
        aria-label="Desplázate hacia abajo"
      >
        <ChevronDown className="h-6 w-6 text-white/70" />
      </button>
    </section>
  )
}
