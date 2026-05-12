"use client"

import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { Images, X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import useLockBodyScroll from "@/hooks/use-lock-scroll"
import { sanityImageVariantUrl } from "@/lib/sanity/image"

interface ImageGalleryModalProps {
  images: string[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
  alt?: string
}

/**
 * Modal de galería de imágenes con:
 * - Navegación con flechas izquierda/derecha
 * - Preview de todas las imágenes abajo (adaptado según dispositivo)
 * - Click directo en preview salta a esa imagen
 * - Navegación por teclado (Arrows, Escape)
 */
export function ImageGalleryModal({
  images,
  currentIndex,
  onClose,
  onNavigate,
  alt = "Imagen",
}: ImageGalleryModalProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  useLockBodyScroll(true)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault()
        const newIndex = (currentIndex - 1 + images.length) % images.length
        onNavigate(newIndex)
      }
      if (e.key === "ArrowRight") {
        e.preventDefault()
        const newIndex = (currentIndex + 1) % images.length
        onNavigate(newIndex)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [currentIndex, images.length, onClose, onNavigate])

  const content = (
    <div
      className="fixed inset-0 z-[110] bg-black/95 flex flex-col"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Galería de imágenes"
    >
      {/* Header con contador */}
      <div className="shrink-0 flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 text-white border-b border-white/10">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white">
          <Images className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs sm:text-sm font-bold tracking-widest uppercase">
            {currentIndex + 1}/{images.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Cerrar galería"
          className="text-white hover:bg-white/10 rounded-none h-10 w-10 sm:h-12 sm:w-12 -mr-2 sm:-mr-3"
        >
          <X className="h-5 w-5 sm:h-6 sm:w-6" />
        </Button>
      </div>

      {/* Main Image */}
      <div
        ref={containerRef}
        className="flex items-center justify-center p-3 sm:p-4 relative overflow-y-auto"
        style={{ height: "calc(100vh - 220px)" }}
        onClick={onClose}
      >
        {/* Previous Button */}
        {images.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              const newIndex = (currentIndex - 1 + images.length) % images.length
              onNavigate(newIndex)
            }}
            aria-label="Imagen anterior"
            className="absolute left-2 sm:left-3 text-white hover:bg-white/10 rounded-none h-12 w-12 sm:h-16 sm:w-16 z-20"
          >
            <ChevronLeft className="h-6 w-6 sm:h-10 sm:w-10" />
          </Button>
        )}

        {/* Image */}
        <div
          className="relative flex w-full items-center justify-center"
          style={{ maxWidth: "min(920px, 82vw)", maxHeight: "calc(100vh - 320px)" }}
        >
          <img
            key={currentIndex}
            src={sanityImageVariantUrl(images[currentIndex], {
              quality: 100,
              format: "webp",
              fit: "max",
            })}
            alt={`${alt} ${currentIndex + 1}`}
            className="block w-auto h-auto object-contain"
            style={{
              maxWidth: "min(920px, 82vw)",
              maxHeight: "calc(100vh - 320px)",
            }}
            loading="eager"
            decoding="async"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Next Button */}
        {images.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              const newIndex = (currentIndex + 1) % images.length
              onNavigate(newIndex)
            }}
            aria-label="Siguiente imagen"
            className="absolute right-2 sm:right-3 text-white hover:bg-white/10 rounded-none h-12 w-12 sm:h-16 sm:w-16 z-20"
          >
            <ChevronRight className="h-6 w-6 sm:h-10 sm:w-10" />
          </Button>
        )}
      </div>

      {/* Thumbnail Preview Strip */}
      {images.length > 1 && (
        <div
          className="shrink-0 p-3 sm:p-4 bg-black/50 border-t border-white/10 overflow-x-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex gap-2 sm:gap-3 justify-center md:justify-center">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate(index)
                }}
                aria-label={`Ir a imagen ${index + 1}`}
                aria-current={index === currentIndex ? "true" : "false"}
                className={`relative shrink-0 rounded-none overflow-hidden transition-all duration-200 ${
                  index === currentIndex
                    ? "ring-2 sm:ring-3 ring-white opacity-100 h-14 w-14 sm:h-20 sm:w-20"
                    : "opacity-40 hover:opacity-70 h-12 w-12 sm:h-16 sm:w-16"
                }`}
              >
                <Image
                  src={sanityImageVariantUrl(image, {
                    width: 160,
                    quality: 58,
                    format: "webp",
                    fit: "crop",
                  })}
                  alt={`Miniatura ${index + 1}`}
                  fill
                  className="object-cover"
                  quality={58}
                  sizes="(max-width: 768px) 56px, 88px"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (typeof document === "undefined") return null
  return createPortal(content, document.body)
}
