import { useEffect } from 'react'

let lockCount = 0
let savedScrollTop = 0
let lockMode: 'desktop' | 'mobile' | null = null

type BodyStyleSnapshot = {
  position: string
  top: string
  left: string
  right: string
  width: string
  overflow: string
  paddingRight: string
}

let previousBodyStyles: BodyStyleSnapshot | null = null
let previousHtmlOverflow = ''

function isMobileLockMode() {
  if (typeof window === 'undefined') return false
  const isNarrow = window.matchMedia('(max-width: 767px)').matches
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches
  return isNarrow || hasCoarsePointer
}

function snapshotStyles() {
  previousBodyStyles = {
    position: document.body.style.position,
    top: document.body.style.top,
    left: document.body.style.left,
    right: document.body.style.right,
    width: document.body.style.width,
    overflow: document.body.style.overflow,
    paddingRight: document.body.style.paddingRight,
  }
  previousHtmlOverflow = document.documentElement.style.overflow
}

function restoreStyles() {
  if (!previousBodyStyles) return
  document.body.style.position = previousBodyStyles.position
  document.body.style.top = previousBodyStyles.top
  document.body.style.left = previousBodyStyles.left
  document.body.style.right = previousBodyStyles.right
  document.body.style.width = previousBodyStyles.width
  document.body.style.overflow = previousBodyStyles.overflow
  document.body.style.paddingRight = previousBodyStyles.paddingRight
  document.documentElement.style.overflow = previousHtmlOverflow
  previousBodyStyles = null
  previousHtmlOverflow = ''
}

function applyLock() {
  if (lockCount === 0) {
    snapshotStyles()
    savedScrollTop = window.scrollY || document.documentElement.scrollTop || 0
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    if (isMobileLockMode()) {
      // Mobile: preserve iOS behavior by fixing body in place.
      lockMode = 'mobile'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${savedScrollTop}px`
      document.body.style.left = '0'
      document.body.style.right = '0'
      document.body.style.width = '100%'
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
    } else {
      // Desktop: prevent background scroll without moving page position.
      lockMode = 'desktop'
      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
      }
    }
  }
  lockCount += 1
}

function releaseLock() {
  if (lockCount <= 0) return
  lockCount -= 1
  if (lockCount === 0) {
    const shouldRestoreScroll = lockMode === 'mobile'
    restoreStyles()
    lockMode = null

    if (shouldRestoreScroll) {
      window.scrollTo(0, savedScrollTop || 0)
    }
  }
}

export default function useLockBodyScroll(active: boolean) {
  useEffect(() => {
    if (!active) return
    applyLock()
    return () => {
      releaseLock()
    }
  }, [active])
}

export { applyLock as lockBodyScroll, releaseLock as unlockBodyScroll }
