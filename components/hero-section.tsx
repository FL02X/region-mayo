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

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/70 via-primary/50 to-background" />

      {/* Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6">
        <div className="w-full max-w-xs mx-auto text-center">
          {/* Stylized Logo */}
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2 text-balance leading-snug italic tracking-wide">
            <span className="block text-lg sm:text-xl font-light not-italic tracking-normal mb-1 opacity-90">
              {heroTitle.split(" ").slice(0, 2).join(" ")}
            </span>
            <span className="relative">
              Región Mayo
              <span className="block text-base sm:text-lg font-light mt-1 not-italic tracking-wide">
                Calendario
              </span>
            </span>
          </h1>
          <p className="text-sm sm:text-base text-white/90 mb-8">
            {heroSubtitle}
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

      {/* Image Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10 flex gap-2">
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
