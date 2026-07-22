"use client"

// Donde: cards de templos. Viewports: desktop y mobile. Funcion: muestra portada del templo y abre galeria.
import { useState } from "react"
import Image from "next/image"
import { Images } from "lucide-react"
import { ImageGalleryModal } from "@/components/shared/image-album-modal"
import { sanityImageVariantUrl } from "@/sanity/lib/image"

interface TemploImageGalleryProps {
  images: string[]
  alt: string
  hideCountBadge?: boolean
}

export function TemploImageGallery({ images, alt, hideCountBadge = false }: TemploImageGalleryProps) {
  const [isGalleryOpen, setIsGalleryOpen] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)

  if (!images || images.length === 0) {
    return null
  }

  return (
    <>
      <button
        onClick={() => {
          setCurrentIndex(0)
          setIsGalleryOpen(true)
        }}
        className="offline-image-online relative w-full h-full group focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={`Ver aviso de imagenes del ${alt}`}
      >
        <Image
          src={sanityImageVariantUrl(images[0], {
            width: 960,
            quality: 72,
            format: "webp",
            fit: "max",
          })}
          alt={alt}
          fill
          unoptimized
          className="object-cover object-center"
          quality={72}
          sizes="(max-width: 768px) 100vw, 33vw"
        />

        {/* En desktop el overlay comunica que la foto abre la galeria sin agregar otro texto. */}
        <div className="hidden md:block pointer-events-none absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors duration-200" />

        {images.length > 1 && !hideCountBadge && (
          <div
            className="pointer-events-none absolute bottom-2 right-2 inline-flex items-center gap-2.5 rounded-[6px] border border-white/10 bg-black/45 px-3 py-2 text-white shadow-[0_1px_2px_rgba(0,0,0,0.18)] backdrop-blur-[8px] md:bottom-auto md:top-2 md:right-2"
            aria-label={`${images.length} imágenes`}
          >
            <Images className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="text-[0.9rem] font-semibold leading-none">1/{images.length}</span>
            <span className="sr-only">posición 1 de {images.length}</span>
          </div>
        )}
      </button>

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
