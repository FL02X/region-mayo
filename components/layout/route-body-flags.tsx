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

  useEffect(() => {
    const syncConnectionState = () => {
      const isOnline = navigator.onLine
      document.documentElement.dataset.connection = isOnline ? 'online' : 'offline'
      document.body.dataset.connection = isOnline ? 'online' : 'offline'
    }

    syncConnectionState()
    window.addEventListener('online', syncConnectionState)
    window.addEventListener('offline', syncConnectionState)

    return () => {
      window.removeEventListener('online', syncConnectionState)
      window.removeEventListener('offline', syncConnectionState)
      delete document.documentElement.dataset.connection
      delete document.body.dataset.connection
    }
  }, [])

  return null
}
