import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-card">
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-pill bg-lavender/35 text-forest"
          aria-hidden
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3.5-3.5" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="font-display text-xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-2">
          That link does not point anywhere in Palli. It may have been renamed, or the record it
          referred to has been removed.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center rounded-pill bg-forest px-5 text-sm font-semibold text-white shadow-card transition-all hover:bg-forest-2"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  )
}
