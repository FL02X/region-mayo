'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

export function RouteBodyFlags() {
  const pathname = usePathname()

  useEffect(() => {
    const isStudioRoute = pathname?.startsWith('/studio') ?? false

    // CSS global necesita saber si estamos dentro de Studio para aislar sus reglas de layout.
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
      // El estado online/offline se expone en html/body para que banners y estilos globales reaccionen sin prop drilling.
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
