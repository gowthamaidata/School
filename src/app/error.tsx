'use client'

import { useEffect } from 'react'

/**
 * Route-level error boundary. Anything that throws while rendering a screen
 * lands here instead of showing a blank page, and the user gets a way back
 * rather than a dead end.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[app] unhandled render error', error)
  }, [error])

  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-pill bg-blush/40 text-danger"
          aria-hidden
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7.5v5.5M12 16.5v.01" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-semibold text-ink">Something went wrong</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          This screen could not be displayed. Nothing you entered has been sent anywhere — try
          again, and if it keeps happening, reload the app.
        </p>
        {error.digest && (
          <p className="mt-3 font-mono text-2xs text-ink-3">Reference: {error.digest}</p>
        )}
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={reset}
            className="inline-flex h-10 items-center rounded-pill bg-forest px-5 text-sm font-semibold text-white shadow-card ring-focus transition-all hover:bg-forest-2"
          >
            Try again
          </button>
          {/* A plain anchor on purpose: this boundary catches a crashed
              render, and a full document load is the reliable way out of a
              broken client tree — a client-side <Link> navigation would
              re-enter the same broken state. */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            className="inline-flex h-10 items-center rounded-pill border border-line bg-surface px-5 text-sm font-semibold text-ink ring-focus transition-colors hover:bg-surface-2"
          >
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  )
}
