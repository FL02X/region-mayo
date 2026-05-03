"use client"

import { useState } from "react"
import Image from "next/image"
import { Images, Search } from "lucide-react"
import { ImageGalleryModal } from "@/components/image-gallery-modal"
import { sanityImageVariantUrl } from "@/lib/sanity/image"

interface TemploImageGalleryProps {
  images: string[]
  alt: string
}

/**
 * Galería de imágenes de templo para cards.
 * - Muestra la primera imagen
 * - Desktop: hover muestra lupa centrada
 * - Mobile: muestra lupa en esquina inferior derecha
 * - Click abre modal de galería completa
 */
export function TemploImageGallery({ images, alt }: TemploImageGalleryProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) {
    return null
  }

  return (
    <>
      {/* Image Container with Hover/Mobile Indicators */}
      <button
        onClick={() => {
          setCurrentIndex(0)
          setIsGalleryOpen(true)
        }}
        className="relative w-full h-full group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={`Abrir galería de imágenes del ${alt}`}
      >
        <Image
          src={sanityImageVariantUrl(images[0], {
            width: 1200,
            quality: 78,
            format: "webp",
            fit: "max",
          })}
          alt={alt}
          fill
          className="object-cover object-center"
          quality={78}
          sizes="(max-width: 768px) 100vw, 33vw"
        />

        {/* Desktop: centered magnifier on hover */}
        <div className="hidden md:flex pointer-events-none absolute inset-0 items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 rounded-full p-3">
            <Search className="h-6 w-6 text-white" aria-hidden="true" />
          </div>
        </div>

        {/* Mobile: icon bottom-right */}
        <div className="md:hidden pointer-events-none absolute bottom-2 right-2">
          <div className="bg-white/90 rounded-full p-2 shadow">
            <Search className="h-4 w-4 text-black" aria-hidden="true" />
          </div>
        </div>

        {/* Image count indicator (if multiple images) */}
        {images.length > 1 && (
          <div
            className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-white pointer-events-none"
            aria-label={`${images.length} imágenes`}
          >
            <Images className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-xs font-semibold leading-none">1/{images.length}</span>
            <span className="sr-only">posición 1 de {images.length}</span>
          </div>
        )}
      </button>

      {/* Gallery Modal */}
      {isGalleryOpen && (
        <ImageGalleryModal
          images={images}
          currentIndex={currentIndex}
          onClose={() => {
            setIsGalleryOpen(false)
            setCurrentIndex(0)
          }}
          onNavigate={setCurrentIndex}
          alt={alt}
        />
      )}
    </>
  )
}
