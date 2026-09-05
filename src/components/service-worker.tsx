'use client'

import { useEffect } from 'react'

/**
 * Registers the service worker that makes the app installable and lets
 * attendance keep working when a classroom has no signal.
 * Only registers in production — a cached SW during `next dev` is a nuisance.
 */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') return
    if (!('serviceWorker' in navigator)) return

    const onLoad = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        /* SW is an enhancement — the app works fine without it */
      })
    }

    window.addEventListener('load', onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  return null
}
