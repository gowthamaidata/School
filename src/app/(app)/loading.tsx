import { Skeleton } from '@/components/ui'

/**
 * Shown while a route segment's code is still being fetched. It mirrors the
 * common shape of the screens behind it — a heading, a summary row, a body
 * panel — so the layout does not jump when the real content lands.
 */
export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-9 w-72 max-w-full" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[124px]" />
        ))}
      </div>
      <Skeleton className="mt-4 h-[320px]" />
    </div>
  )
}
