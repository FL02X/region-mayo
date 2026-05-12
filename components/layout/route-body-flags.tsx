'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function RouteBodyFlags() {
  const pathname = usePathname()

  useEffect(() => {
    const isStudioRoute = pathname?.startsWith('/studio') ?? false

    document.documentElement.dataset.studioRoute = isStudioRoute ? 'true' : 'false'
    document.body.dataset.studioRoute = isStudioRoute ? 'true' : 'false'

    return () => {
      delete document.documentElement.dataset.studioRoute
      delete document.body.dataset.studioRoute
    }
  }, [pathname])

  return null
}