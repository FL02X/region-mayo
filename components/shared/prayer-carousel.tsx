"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronLeft, ChevronRight, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Prayer {
  _id: string
  text: string
  submittedAt: string
}

interface PrayerCarouselProps {
  prayers: Prayer[]
  isVertical?: boolean
}

/**
 * PRAYER CAROUSEL
 * Muestra una oración por slide.
 *
 * INTERACCIÓN:
 * - Auto-rotate cada 8 segundos
 * - Click en flechas para navegar
 * - Click en dot para saltar a posición
 */
export function PrayerCarousel({ prayers, isVertical = false }: PrayerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null)

  if (!prayers || prayers.length === 0) {
    return null
  }

  // Auto-rotate
  useEffect(() => {
    if (!isAutoRotating) return

    autoRotateRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % prayers.length)
    }, 8000)

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
      }
    }
  }, [isAutoRotating, prayers.length])

  const handlePrev = () => {
    setIsAutoRotating(false)
    setCurrentIndex((prev) => (prev - 1 + prayers.length) % prayers.length)
  }

  const handleNext = () => {
    setIsAutoRotating(false)
    setCurrentIndex((prev) => (prev + 1) % prayers.length)
  }

  const handleDotClick = (index: number) => {
    setIsAutoRotating(false)
    setCurrentIndex(index)
  }

  return (
    <div
      ref={containerRef}
      className="w-full space-y-4"
      onMouseEnter={() => setIsAutoRotating(false)}
      onMouseLeave={() => setIsAutoRotating(true)}
    >
      {/* Carousel Container */}
      <div className="relative overflow-hidden">
        <div className="flex">
          {prayers.map((prayer, idx) => {
            if (idx !== currentIndex) return null

            return (
              <div
                key={prayer._id}
                className="w-full min-w-full transition-all duration-300"
              >
                <div className="bg-white border border-green-200 rounded-lg p-4 h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Heart className="h-4 w-4 text-green-600" fill="currentColor" />
                    <span className="text-xs text-muted-foreground">Oración #{idx + 1}</span>
                  </div>

                  <p className="text-sm text-foreground leading-relaxed line-clamp-4">
                    "{prayer.text}"
                  </p>

                  <div className="mt-3 pt-3 border-t border-green-100 flex items-center justify-between">
                    <span className="text-xs text-green-600 font-medium">
                      Nos unimos en oración
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Navigation Arrows */}
        {prayers.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow hover:bg-green-50"
              aria-label="Oración anterior"
              title="Anterior"
            >
              <ChevronLeft className="h-4 w-4 text-green-600" />
            </button>

            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 bg-white rounded-full p-2 shadow-md hover:shadow-lg transition-shadow hover:bg-green-50"
              aria-label="Siguiente oración"
              title="Siguiente"
            >
              <ChevronRight className="h-4 w-4 text-green-600" />
            </button>
          </>
        )}
      </div>

      {/* Indicators (dots) */}
      {prayers.length > 1 && (
        <div className="flex justify-center gap-2">
          {prayers.map((_, idx) => (
            <button
              key={idx}
              onClick={() => handleDotClick(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex
                  ? "w-6 bg-green-600"
                  : "w-2 bg-green-200 hover:bg-green-300"
              }`}
              aria-label={`Ir a oración ${idx + 1}`}
            />
          ))}
        </div>
      )}

      {/* Info text */}
      <p className="text-center text-xs text-green-600 font-medium">
        {prayers.length} peticiones en oración
      </p>
    </div>
  )
}
