"use client"

import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from "react"
import { createPortal } from "react-dom"
import Image from "next/image"
import { Images, Wifi, X, ChevronLeft, ChevronRight, Download } from "lucide-react"
import useEmblaCarousel from "embla-carousel-react"
import { Button } from "@/components/ui/button"
import { useConnectivity } from "@/hooks/use-connectivity"
import { useInstallPrompt } from "@/hooks/use-install-prompt"
import useLockBodyScroll from "@/hooks/use-lock-scroll"
import { sanityImageVariantUrl } from "@/lib/sanity/image"

export type GalleryModalItem =
  | {
      type: "image"
      url: string
      alt?: string
    }
  | {
      type: "video"
      url: string
      posterUrl?: string
      title: string
      alt?: string
      mimeType?: string
    }

interface ImageGalleryModalProps {
  images?: string[]
  items?: GalleryModalItem[]
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
  alt?: string
}

const IMAGE_ZOOM_SCALE = 2
const IMAGE_ZOOM_MAX_SCALE = 4
const IMAGE_ZOOM_OVERSCROLL = 56

const isMobileGalleryViewport = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 639px)").matches

type ZoomState = {
  index: number
  scale: number
  offsetX: number
  offsetY: number
}

type ImagePanState = {
  index: number
  startX: number
  startY: number
  offsetX: number
  offsetY: number
  didMove: boolean
}

type ImagePointerPosition = {
  x: number
  y: number
}

type ImagePinchState = {
  index: number
  startDistance: number
  startScale: number
  startOffsetX: number
  startOffsetY: number
  startCenterX: number
  startCenterY: number
  imageCenterX: number
  imageCenterY: number
}

/**
 * Galeria completa en navegador; aviso ligero dentro de la app instalada.
 */
export function ImageGalleryModal({
  images,
  items,
  currentIndex,
  onClose,
  onNavigate,
  alt = "Imagen",
}: ImageGalleryModalProps) {
  const { isStandalone } = useInstallPrompt()
  const { isOnline } = useConnectivity()
  const shouldShowOfflineNotice = isStandalone && !isOnline
  const galleryItems =
    items ??
    (images ?? []).map((image) => ({
      type: "image" as const,
      url: image,
      alt,
    }))
  const currentItem = galleryItems[currentIndex]
  const isCurrentVideo = currentItem?.type === "video"
  const galleryRootRef = useRef<HTMLDivElement>(null)
  const thumbnailsRef = useRef<HTMLDivElement>(null)
  const mobileHistoryPushedRef = useRef(false)
  const isClosingFromHistoryRef = useRef(false)
  const onCloseRef = useRef(onClose)
  const modalScrollYRef = useRef(
    typeof window !== "undefined" ? window.scrollY || document.documentElement.scrollTop || 0 : 0,
  )
  const previousScrollRestorationRef = useRef<History["scrollRestoration"] | null>(null)
  const initialMobileIndexRef = useRef(currentIndex)
  const instantMobileNavigationIndexRef = useRef<number | null>(null)
  const lastImageTapRef = useRef({ index: -1, time: 0 })
  const imageTapStartRef = useRef({ x: 0, y: 0 })
  const imagePanRef = useRef<ImagePanState | null>(null)
  const imagePointersRef = useRef(new Map<number, ImagePointerPosition>())
  const imagePinchRef = useRef<ImagePinchState | null>(null)
  const zoomedImageIndexRef = useRef<number | null>(null)
  const [mobileDisplayIndex, setMobileDisplayIndex] = useState(currentIndex)
  const [zoomState, setZoomState] = useState<ZoomState | null>(null)
  const [isZoomPanning, setIsZoomPanning] = useState(false)
  const mobileEmblaOptions = useMemo(
    () => ({
      align: "center" as const,
      containScroll: "trimSnaps" as const,
      dragThreshold: 18,
      duration: 72,
      loop: false,
      slidesToScroll: 1,
      skipSnaps: false,
      startIndex: initialMobileIndexRef.current,
      watchDrag: () => zoomedImageIndexRef.current === null,
    }),
    [],
  )
  const [mobileEmblaRef, mobileEmblaApi] = useEmblaCarousel(mobileEmblaOptions)
  const zoomedImageIndex = zoomState?.index ?? null
  const displayItem = galleryItems[mobileDisplayIndex] ?? currentItem
  const isDisplayVideo = displayItem?.type === "video"
  const currentImageUrl = !isDisplayVideo && displayItem
    ? sanityImageVariantUrl(displayItem.url, {
        quality: 92,
        format: "jpg",
        fit: "max",
      })
    : ""
  useLockBodyScroll(true)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  const restoreModalScrollPosition = useCallback(() => {
    if (typeof window === "undefined") return

    const scrollY = modalScrollYRef.current
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollY)
      window.setTimeout(() => window.scrollTo(0, scrollY), 0)
    })
  }, [])

  const resetImageZoom = useCallback(() => {
    setZoomState(null)
    setIsZoomPanning(false)
    imagePanRef.current = null
    imagePointersRef.current.clear()
    imagePinchRef.current = null
  }, [])

  useEffect(() => {
    zoomedImageIndexRef.current = zoomedImageIndex
  }, [zoomedImageIndex])

  useEffect(() => {
    const videos = Array.from(galleryRootRef.current?.querySelectorAll("video") ?? [])

    videos.forEach((video) => {
      const isActiveVideo =
        video.dataset.galleryIndex === String(currentIndex) && video.offsetParent !== null

      if (isActiveVideo) return

      video.pause()
    })

    const shouldKeepZoom = zoomedImageIndexRef.current === currentIndex

    setMobileDisplayIndex(currentIndex)
    setZoomState((currentZoom) => (currentZoom?.index === currentIndex ? currentZoom : null))

    if (!shouldKeepZoom) {
      setIsZoomPanning(false)
      imagePointersRef.current.clear()
      imagePinchRef.current = null
    }
  }, [currentIndex])

  useEffect(() => {
    const thumbnail = thumbnailsRef.current?.querySelector<HTMLButtonElement>(
      `[data-thumbnail-index="${mobileDisplayIndex}"]`,
    )

    thumbnail?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    })
  }, [mobileDisplayIndex])

  const handleClose = useCallback(() => {
    onCloseRef.current()
    restoreModalScrollPosition()

    if (
      typeof window !== "undefined" &&
      mobileHistoryPushedRef.current &&
      !isClosingFromHistoryRef.current
    ) {
      window.history.replaceState({ imageGalleryModalClosed: true }, "", window.location.href)
    }
  }, [restoreModalScrollPosition])

  const getBaseImageSize = (image: HTMLImageElement) => {
    const rect = image.getBoundingClientRect()
    const scale = zoomState?.scale ?? IMAGE_ZOOM_SCALE

    return {
      width: rect.width / scale,
      height: rect.height / scale,
    }
  }

  const clampZoomOffset = (value: number, size: number, scale: number, overscroll = 0) => {
    const limit = (size * (scale - 1)) / 2

    return Math.max(-limit - overscroll, Math.min(limit + overscroll, value))
  }

  const rubberBandZoomOffset = (value: number, size: number, scale: number) => {
    const limit = (size * (scale - 1)) / 2
    const distance = Math.abs(value)

    if (distance <= limit) return value

    const overscroll = distance - limit
    const resistedOverscroll =
      IMAGE_ZOOM_OVERSCROLL * (1 - 1 / (overscroll / IMAGE_ZOOM_OVERSCROLL + 1))

    return Math.sign(value) * (limit + resistedOverscroll)
  }

  const getPointerDistance = (first: ImagePointerPosition, second: ImagePointerPosition) =>
    Math.hypot(first.x - second.x, first.y - second.y)

  const getPointerCenter = (first: ImagePointerPosition, second: ImagePointerPosition) => ({
    x: (first.x + second.x) / 2,
    y: (first.y + second.y) / 2,
  })

  const beginImagePinch = (image: HTMLImageElement, index: number) => {
    const pointers = Array.from(imagePointersRef.current.values())
    if (pointers.length < 2) return

    const [first, second] = pointers
    const center = getPointerCenter(first, second)
    const rect = image.getBoundingClientRect()

    imagePinchRef.current = {
      index,
      startDistance: getPointerDistance(first, second),
      startScale: zoomState?.scale ?? IMAGE_ZOOM_SCALE,
      startOffsetX: zoomState?.offsetX ?? 0,
      startOffsetY: zoomState?.offsetY ?? 0,
      startCenterX: center.x,
      startCenterY: center.y,
      imageCenterX: rect.left + rect.width / 2,
      imageCenterY: rect.top + rect.height / 2,
    }
  }

  const settleZoomInsideBounds = (image: HTMLImageElement, index: number) => {
    const currentZoom = zoomedImageIndex === index ? zoomState : null
    if (!currentZoom) return

    const baseSize = getBaseImageSize(image)

    setZoomState({
      ...currentZoom,
      offsetX: clampZoomOffset(currentZoom.offsetX, baseSize.width, currentZoom.scale),
      offsetY: clampZoomOffset(currentZoom.offsetY, baseSize.height, currentZoom.scale),
    })
  }

  const zoomImageAtPoint = (image: HTMLImageElement, index: number, clientX: number, clientY: number) => {
    if (galleryItems[index]?.type !== "image") return

    const rect = image.getBoundingClientRect()
    const baseSize =
      zoomedImageIndex === index ? getBaseImageSize(image) : { width: rect.width, height: rect.height }
    const tapOffsetX = clientX - rect.left - rect.width / 2
    const tapOffsetY = clientY - rect.top - rect.height / 2

    setZoomState({
      index,
      scale: IMAGE_ZOOM_SCALE,
      offsetX: clampZoomOffset(-tapOffsetX * (IMAGE_ZOOM_SCALE - 1), baseSize.width, IMAGE_ZOOM_SCALE),
      offsetY: clampZoomOffset(-tapOffsetY * (IMAGE_ZOOM_SCALE - 1), baseSize.height, IMAGE_ZOOM_SCALE),
    })
  }

  const toggleImageZoom = (image: HTMLImageElement, index: number, clientX: number, clientY: number) => {
    if (zoomedImageIndex === index) {
      resetImageZoom()
      return
    }

    zoomImageAtPoint(image, index, clientX, clientY)
  }

  const handleImagePointerDown = (
    e: PointerEvent<HTMLElement>,
    image: HTMLImageElement | null,
    index: number,
  ) => {
    imageTapStartRef.current = { x: e.clientX, y: e.clientY }

    if (zoomedImageIndex !== index || e.pointerType !== "touch") return

    if (!image) return
    if (!imagePanRef.current && !imagePinchRef.current && imagePointersRef.current.size > 0) {
      imagePointersRef.current.clear()
    }
    e.stopPropagation()
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    imagePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    setIsZoomPanning(true)

    if (imagePointersRef.current.size >= 2) {
      imagePanRef.current = null
      beginImagePinch(image, index)
      return
    }

    imagePanRef.current = {
      index,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: zoomState?.offsetX ?? 0,
      offsetY: zoomState?.offsetY ?? 0,
      didMove: false,
    }
  }

  const handleImagePointerMove = (
    e: PointerEvent<HTMLElement>,
    image: HTMLImageElement | null,
    index: number,
  ) => {
    const panState = imagePanRef.current

    if (zoomedImageIndex !== index) return

    if (!image) return
    e.stopPropagation()
    e.preventDefault()
    imagePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    const pinchState = imagePinchRef.current
    if (pinchState?.index === index && imagePointersRef.current.size >= 2) {
      const pointers = Array.from(imagePointersRef.current.values())
      const [first, second] = pointers
      const center = getPointerCenter(first, second)
      const baseSize = getBaseImageSize(image)
      const nextScale = Math.max(
        IMAGE_ZOOM_SCALE,
        Math.min(
          IMAGE_ZOOM_MAX_SCALE,
          pinchState.startScale *
            (getPointerDistance(first, second) / Math.max(1, pinchState.startDistance)),
        ),
      )
      const scaleRatio = nextScale / pinchState.startScale
      const nextOffsetX =
        pinchState.startOffsetX +
        (center.x - pinchState.startCenterX) +
        (pinchState.startCenterX - pinchState.imageCenterX) * (1 - scaleRatio)
      const nextOffsetY =
        pinchState.startOffsetY +
        (center.y - pinchState.startCenterY) +
        (pinchState.startCenterY - pinchState.imageCenterY) * (1 - scaleRatio)

      setZoomState({
        index,
        scale: nextScale,
        offsetX: rubberBandZoomOffset(nextOffsetX, baseSize.width, nextScale),
        offsetY: rubberBandZoomOffset(nextOffsetY, baseSize.height, nextScale),
      })
      return
    }

    if (!panState || panState.index !== index) return

    const deltaX = e.clientX - panState.startX
    const deltaY = e.clientY - panState.startY
    const baseSize = getBaseImageSize(image)

    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
      panState.didMove = true
    }

    setZoomState({
      index,
      scale: zoomState?.scale ?? IMAGE_ZOOM_SCALE,
      offsetX: rubberBandZoomOffset(
        panState.offsetX + deltaX,
        baseSize.width,
        zoomState?.scale ?? IMAGE_ZOOM_SCALE,
      ),
      offsetY: rubberBandZoomOffset(
        panState.offsetY + deltaY,
        baseSize.height,
        zoomState?.scale ?? IMAGE_ZOOM_SCALE,
      ),
    })
  }

  const handleImagePointerUp = (
    e: PointerEvent<HTMLElement>,
    image: HTMLImageElement | null,
    index: number,
  ) => {
    const panState = imagePanRef.current

    if (panState?.index === index) {
      imagePanRef.current = null
      imagePointersRef.current.delete(e.pointerId)
      e.stopPropagation()
      e.preventDefault()

      if (image) {
        settleZoomInsideBounds(image, index)
      }

      if (imagePointersRef.current.size === 0) setIsZoomPanning(false)
      if (panState.didMove) return
    }

    const pinchState = imagePinchRef.current
    if (pinchState?.index === index) {
      imagePointersRef.current.delete(e.pointerId)
      e.stopPropagation()
      e.preventDefault()

      if (image) settleZoomInsideBounds(image, index)

      if (imagePointersRef.current.size >= 2) {
        if (image) beginImagePinch(image, index)
      } else {
        imagePointersRef.current.clear()
        imagePanRef.current = null
        imagePinchRef.current = null
        setIsZoomPanning(false)
      }
      return
    }

    if (!image) return
    if (e.pointerType !== "touch") return

    const deltaX = Math.abs(e.clientX - imageTapStartRef.current.x)
    const deltaY = Math.abs(e.clientY - imageTapStartRef.current.y)
    if (deltaX > 12 || deltaY > 12) return

    const now = Date.now()
    const isDoubleTap =
      lastImageTapRef.current.index === index && now - lastImageTapRef.current.time < 300

    if (isDoubleTap) {
      toggleImageZoom(image, index, e.clientX, e.clientY)
      lastImageTapRef.current = { index: -1, time: 0 }
      return
    }

    lastImageTapRef.current = { index, time: now }
  }

  useEffect(() => {
    if (!mobileEmblaApi) return
    if (typeof window === "undefined") return

    const mobileMediaQuery = window.matchMedia("(max-width: 639px)")

    const handleSelect = () => {
      if (!mobileMediaQuery.matches) return

      setMobileDisplayIndex(mobileEmblaApi.selectedScrollSnap())
    }

    const handleSettle = () => {
      if (!mobileMediaQuery.matches) return

      const selectedIndex = mobileEmblaApi.selectedScrollSnap()

      if (selectedIndex !== currentIndex) {
        onNavigate(selectedIndex)
      }
    }

    const handleViewportChange = () => {
      if (mobileMediaQuery.matches) {
        handleSelect()
      } else {
        setMobileDisplayIndex(currentIndex)
      }
    }

    mobileEmblaApi.on("select", handleSelect)
    mobileEmblaApi.on("settle", handleSettle)
    handleViewportChange()
    mobileMediaQuery.addEventListener("change", handleViewportChange)

    return () => {
      mobileEmblaApi.off("select", handleSelect)
      mobileEmblaApi.off("settle", handleSettle)
      mobileMediaQuery.removeEventListener("change", handleViewportChange)
    }
  }, [currentIndex, mobileEmblaApi, onNavigate])

  useEffect(() => {
    if (!mobileEmblaApi) return
    if (!isMobileGalleryViewport()) return
    if (mobileEmblaApi.selectedScrollSnap() === currentIndex) return

    const shouldJump = instantMobileNavigationIndexRef.current === currentIndex

    mobileEmblaApi.scrollTo(currentIndex, shouldJump)
    instantMobileNavigationIndexRef.current = null
  }, [currentIndex, mobileEmblaApi])

  useEffect(() => {
    if (typeof window === "undefined") return

    const isMobile = window.matchMedia("(max-width: 639px)").matches
    if (!isMobile) return

    previousScrollRestorationRef.current = window.history.scrollRestoration
    window.history.scrollRestoration = "manual"
    window.history.pushState({ imageGalleryModal: true }, "", window.location.href)
    mobileHistoryPushedRef.current = true

    const handlePopState = () => {
      isClosingFromHistoryRef.current = true
      onCloseRef.current()
      restoreModalScrollPosition()
    }

    window.addEventListener("popstate", handlePopState)

    return () => {
      window.removeEventListener("popstate", handlePopState)
      if (previousScrollRestorationRef.current) {
        window.history.scrollRestoration = previousScrollRestorationRef.current
      }
      mobileHistoryPushedRef.current = false
      isClosingFromHistoryRef.current = false
    }
  }, [restoreModalScrollPosition])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        handleClose()
      }
      if (!shouldShowOfflineNotice && e.key === "ArrowLeft") {
        e.preventDefault()
        if (zoomedImageIndex !== null) return
        const newIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length
        onNavigate(newIndex)
      }
      if (!shouldShowOfflineNotice && e.key === "ArrowRight") {
        e.preventDefault()
        if (zoomedImageIndex !== null) return
        const newIndex = (currentIndex + 1) % galleryItems.length
        onNavigate(newIndex)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [currentIndex, galleryItems.length, handleClose, onNavigate, shouldShowOfflineNotice, zoomedImageIndex])

  if (!currentItem) return null

  const renderGalleryMedia = (item: GalleryModalItem, index: number) => {
    const isVideo = item.type === "video"

    return isVideo ? (
      <div className="relative h-full w-screen sm:flex sm:w-full sm:items-center sm:justify-center" onClick={(e) => e.stopPropagation()}>
        <video
          key={index}
          data-gallery-index={index}
          poster={
            item.posterUrl
              ? sanityImageVariantUrl(item.posterUrl, {
                  width: 1280,
                  quality: 76,
                  format: "webp",
                  fit: "max",
                })
              : undefined
          }
          controls
          playsInline
          preload="metadata"
          className="block h-full max-h-full w-full bg-black object-contain sm:max-h-full sm:max-w-full"
        >
          <source src={item.url} type={item.mimeType || undefined} />
        </video>
      </div>
    ) : (
      <div
        className={`relative flex h-full w-screen items-center justify-center overflow-hidden sm:w-full ${
          zoomedImageIndex === index ? "touch-none" : ""
        }`}
        onClick={(e) => e.stopPropagation()}
        onPointerDownCapture={(e) => {
          if (zoomedImageIndex !== index) return
          e.stopPropagation()
          handleImagePointerDown(e, e.currentTarget.querySelector("img"), index)
        }}
        onPointerMoveCapture={(e) => {
          if (zoomedImageIndex !== index) return
          e.stopPropagation()
          handleImagePointerMove(e, e.currentTarget.querySelector("img"), index)
        }}
        onPointerUpCapture={(e) => {
          if (zoomedImageIndex !== index) return
          e.stopPropagation()
          handleImagePointerUp(e, e.currentTarget.querySelector("img"), index)
        }}
        onPointerCancelCapture={(e) => {
          if (zoomedImageIndex !== index) return
          e.stopPropagation()
          resetImageZoom()
        }}
      >
        <img
          key={index}
          src={sanityImageVariantUrl(item.url, {
            quality: 88,
            format: "webp",
            fit: "max",
          })}
          alt={item.alt || `${alt} ${index + 1}`}
          className={`block h-auto w-full max-w-none object-contain sm:h-full sm:max-h-full sm:max-w-full ${
            zoomedImageIndex === index
              ? `cursor-grab touch-none ${isZoomPanning ? "" : "transition-transform duration-200 ease-out"}`
              : "scale-100 touch-manipulation transition-transform duration-200"
          }`}
          style={{
            transform:
              zoomedImageIndex === index
                ? `translate3d(${zoomState?.offsetX ?? 0}px, ${zoomState?.offsetY ?? 0}px, 0) scale(${zoomState?.scale ?? IMAGE_ZOOM_SCALE})`
                : undefined,
          }}
          loading={index === currentIndex ? "eager" : "lazy"}
          decoding="async"
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => {
            if (zoomedImageIndex === index) return
            handleImagePointerDown(e, e.currentTarget, index)
          }}
          onPointerMove={(e) => {
            if (zoomedImageIndex === index) return
            handleImagePointerMove(e, e.currentTarget, index)
          }}
          onPointerUp={(e) => {
            if (zoomedImageIndex === index) return
            handleImagePointerUp(e, e.currentTarget, index)
          }}
        />
      </div>
    )
  }

  const offlineNotice = (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Imagenes disponibles con conexion"
    >
      <div
        className="relative w-full max-w-[360px] border border-border bg-background p-5 text-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          aria-label="Cerrar aviso"
          className="absolute right-2 top-2 h-9 w-9 rounded-none"
        >
          <X className="h-4 w-4" />
        </Button>
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center bg-primary/10">
          <Wifi className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <p className="text-sm font-bold uppercase tracking-wide text-foreground">
          Requiere conexion a internet
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          Para ahorrar datos y almacenamiento, las imagenes ampliadas no se descargan para uso sin conexion.
        </p>
      </div>
    </div>
  )

  const gallery = (
    <div
      ref={galleryRootRef}
      className="fixed inset-0 z-[110] bg-black/95 flex flex-col"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Galeria de imagenes"
    >
      <div className="shrink-0 flex items-center justify-between px-3 py-3 sm:px-4 sm:py-4 text-white border-b border-white/10">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-white">
          <Images className="h-4 w-4" aria-hidden="true" />
          <span className="text-xs sm:text-sm font-bold tracking-widest uppercase">
            {mobileDisplayIndex + 1}/{galleryItems.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {!isDisplayVideo ? (
            <Button
              asChild
              variant="ghost"
              size="icon"
              aria-label="Descargar imagen"
              className="text-white hover:bg-white/10 rounded-none h-10 w-10 sm:h-12 sm:w-12"
            >
              <a
                href={currentImageUrl}
                download
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="h-5 w-5 sm:h-6 sm:w-6" />
              </a>
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            aria-label="Cerrar galeria"
            className="text-white hover:bg-white/10 rounded-none h-10 w-10 sm:h-12 sm:w-12 -mr-2 sm:-mr-3"
          >
            <X className="h-5 w-5 sm:h-6 sm:w-6" />
          </Button>
        </div>
      </div>

      <div className="relative flex h-[calc(100vh-220px)] items-center justify-center overflow-hidden p-0 sm:min-h-0 sm:flex-1 sm:p-4" onClick={handleClose}>
        <div
          ref={mobileEmblaRef}
          className="h-full w-screen overflow-hidden sm:hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex h-full gap-2">
            {galleryItems.map((item, index) => (
              <div
                key={index}
                className="flex h-full min-w-0 flex-[0_0_100%] items-center justify-center"
              >
                {renderGalleryMedia(item, index)}
              </div>
            ))}
          </div>
        </div>

        {galleryItems.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              if (zoomedImageIndex !== null) return
              const newIndex = (currentIndex - 1 + galleryItems.length) % galleryItems.length
              onNavigate(newIndex)
            }}
            aria-label="Imagen anterior"
            className="absolute left-2 z-20 hidden h-12 w-12 rounded-none text-white hover:bg-white/10 sm:left-3 sm:flex sm:h-16 sm:w-16"
          >
            <ChevronLeft className="h-6 w-6 sm:h-10 sm:w-10" />
          </Button>
        )}

        <div
          className="relative hidden h-full w-full items-center justify-center sm:flex sm:max-w-[calc(100vw-160px)]"
        >
          {renderGalleryMedia(currentItem, currentIndex)}
        </div>

        {galleryItems.length > 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation()
              if (zoomedImageIndex !== null) return
              const newIndex = (currentIndex + 1) % galleryItems.length
              onNavigate(newIndex)
            }}
            aria-label="Siguiente imagen"
            className="absolute right-2 z-20 hidden h-12 w-12 rounded-none text-white hover:bg-white/10 sm:right-3 sm:flex sm:h-16 sm:w-16"
          >
            <ChevronRight className="h-6 w-6 sm:h-10 sm:w-10" />
          </Button>
        )}
      </div>

      {galleryItems.length > 1 && (
        <div
          className="shrink-0 overflow-x-auto border-t border-white/10 bg-black/50 px-3 py-3 sm:p-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            ref={thumbnailsRef}
            className="flex justify-start gap-2 px-1 sm:justify-center sm:gap-3 sm:px-0"
          >
            {galleryItems.map((item, index) => (
              <button
                key={index}
                data-thumbnail-index={index}
                onClick={(e) => {
                  e.stopPropagation()
                  resetImageZoom()
                  instantMobileNavigationIndexRef.current = index
                  setMobileDisplayIndex(index)
                  onNavigate(index)
                }}
                aria-label={`Ir a imagen ${index + 1}`}
                aria-current={index === mobileDisplayIndex ? "true" : "false"}
                className={`relative shrink-0 rounded-none overflow-hidden transition-all duration-200 ${
                  index === mobileDisplayIndex
                    ? "ring-2 sm:ring-3 ring-white opacity-100 h-14 w-14 sm:h-20 sm:w-20"
                    : "opacity-40 hover:opacity-70 h-12 w-12 sm:h-16 sm:w-16"
                }`}
              >
                {item.type === "image" || item.posterUrl ? (
                  <Image
                    src={sanityImageVariantUrl(item.type === "video" ? item.posterUrl! : item.url, {
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
                ) : (
                  <span className="absolute inset-0 bg-black" aria-hidden="true" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (typeof document === "undefined") return null
  return createPortal(shouldShowOfflineNotice ? offlineNotice : gallery, document.body)
}
