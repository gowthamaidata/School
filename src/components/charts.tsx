'use client'

import React, { useId, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

/* ══════════════════════════════════════════════════════════
   CHARTS

   Hand-drawn SVG rather than a charting dependency: these are
   three small, fixed shapes, and a library would cost more
   kilobytes than the whole feature.

   House rules (kept identical across every chart in the app):
   · one series per chart, no dual axes
   · 2px lines, 10% area wash, hairline solid gridlines
   · label the endpoint and the extreme, never every point
   · text never wears the series colour
   · the numbers are always reachable without the picture —
     ChartFrame renders a screen-reader table beside it
   ══════════════════════════════════════════════════════════ */

export interface TrendPoint {
  label: string
  value: number
  /** Pre-formatted display value (₹1.2 L) — charts never format currency. */
  display: string
}

/**
 * Area + line trend with a rounded y-scale, a hover crosshair and an optional
 * reference line (e.g. the monthly target). Sized by its container; the
 * viewBox does the scaling so it stays crisp at any width.
 */
export function TrendChart({
  points,
  height = 190,
  reference,
  referenceLabel,
  className,
}: {
  points: TrendPoint[]
  height?: number
  reference?: number
  referenceLabel?: string
  className?: string
}) {
  const gradientId = useId()
  const [hover, setHover] = useState<number | null>(null)

  const W = 640
  const H = height
  const padL = 46
  const padR = 14
  const padT = 14
  /* Month labels are HTML below the plot, so the plot only needs enough
     bottom padding to keep the zero gridline off the container edge. */
  const padB = 10

  const { max, ticks } = useMemo(() => {
    const raw = Math.max(1, ...points.map((p) => p.value), reference ?? 0)
    // Round the ceiling up to a clean number so the axis reads in whole units.
    const magnitude = Math.pow(10, Math.floor(Math.log10(raw)))
    const ceil = Math.ceil(raw / (magnitude / 2)) * (magnitude / 2)
    return { max: ceil, ticks: [0, ceil / 2, ceil] }
  }, [points, reference])

  if (points.length === 0) return null

  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const x = (i: number) =>
    padL + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW)
  const y = (v: number) => padT + innerH - (v / max) * innerH

  const line = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.value)}`).join(' ')
  const area = `${line} L ${x(points.length - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`

  const peakIndex = points.reduce((best, p, i) => (p.value > points[best].value ? i : best), 0)
  const lastIndex = points.length - 1
  const activeIndex = hover ?? lastIndex

  function compact(n: number) {
    if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)}Cr`
    if (n >= 100_000) return `${(n / 100_000).toFixed(1)}L`
    if (n >= 1_000) return `${Math.round(n / 1_000)}K`
    return String(Math.round(n))
  }

  return (
    <div className={cn('w-full', className)}>
      <div className="relative w-full" style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height }}
        preserveAspectRatio="none"
        role="presentation"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(var(--forest))" stopOpacity="0.18" />
            <stop offset="100%" stopColor="rgb(var(--forest))" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Gridlines — hairline, solid, one step off the surface. */}
        {ticks.map((tv) => (
          <line
            key={tv}
            x1={padL}
            x2={W - padR}
            y1={y(tv)}
            y2={y(tv)}
            stroke="rgb(var(--line))"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        ))}

        {typeof reference === 'number' && reference > 0 && (
          <line
            x1={padL}
            x2={W - padR}
            y1={y(reference)}
            y2={y(reference)}
            stroke="rgb(var(--ink-3))"
            strokeWidth="1"
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        )}

        <path d={area} fill={`url(#${gradientId})`} />
        <path
          d={line}
          fill="none"
          stroke="rgb(var(--forest))"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Markers: the peak and the latest month get a dot; the rest appear
            on hover. Each carries a surface ring so it stays legible. */}
        {points.map((p, i) => {
          const shown = i === peakIndex || i === lastIndex || i === hover
          if (!shown) return null
          return (
            <circle
              key={p.label}
              cx={x(i)}
              cy={y(p.value)}
              r={4.5}
              fill="rgb(var(--forest))"
              stroke="rgb(var(--surface))"
              strokeWidth="2"
            />
          )
        })}

        {/* Crosshair for the hovered column. */}
        {hover !== null && (
          <line
            x1={x(hover)}
            x2={x(hover)}
            y1={padT}
            y2={padT + innerH}
            stroke="rgb(var(--line-strong))"
            strokeWidth="1"
            vectorEffect="non-scaling-stroke"
          />
        )}

        {/* Generous invisible hit areas — bigger than the marks. */}
        {points.map((p, i) => (
          <rect
            key={`hit-${p.label}`}
            x={x(i) - innerW / (points.length * 2)}
            y={padT}
            width={innerW / points.length}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHover(i)}
          />
        ))}
      </svg>

      {/* Axis text lives in HTML, not SVG: it must not stretch with the
          non-uniform viewBox scale, and it inherits the type tokens. */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {ticks.map((tv) => (
          <span
            key={tv}
            className="tabular absolute -translate-y-1/2 text-2xs text-ink-3"
            style={{ left: 0, top: `${(y(tv) / H) * 100}%` }}
          >
            {compact(tv)}
          </span>
        ))}
      </div>
      </div>

      {/* Month labels + the value read-out for the active column. */}
      <div className="mt-1 flex" style={{ paddingLeft: `${(padL / W) * 100}%`, paddingRight: `${(padR / W) * 100}%` }}>
        {points.map((p, i) => (
          <button
            key={p.label}
            type="button"
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            className={cn(
              'flex-1 rounded py-1 text-center text-2xs font-medium transition-colors ring-focus-tight',
              i === activeIndex ? 'text-ink' : 'text-ink-3',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mt-2 flex items-baseline gap-2 border-t border-line pt-3">
        <span className="label">{points[activeIndex].label}</span>
        <span className="tabular font-display text-lg font-semibold text-ink">
          {points[activeIndex].display}
        </span>
        {referenceLabel && (
          <span className="ml-auto text-2xs text-ink-3">{referenceLabel}</span>
        )}
      </div>
    </div>
  )
}

/**
 * Attendance heat strip.
 *
 * A section's colour encodes a band (good / watch / low / unmarked) but the
 * percentage is always printed inside the cell, so nothing here is carried by
 * colour alone.
 */
export interface HeatCell {
  id: string
  label: string
  value: number | null
  detail?: string
  href?: string
}

export function bandFor(value: number | null): 'unmarked' | 'good' | 'watch' | 'low' {
  if (value === null) return 'unmarked'
  if (value >= 90) return 'good'
  if (value >= 80) return 'watch'
  return 'low'
}

/* Light mode uses the pastel washes; dark mode uses the semantic *-dim
   tokens instead, because a pale pastel at low opacity over a dark surface
   turns muddy rather than tinted. */
const BAND_STYLE: Record<ReturnType<typeof bandFor>, string> = {
  good: 'bg-mint/40 text-ink border-mint/60 hover:border-leaf/70 dark:bg-leaf-dim dark:border-leaf/30',
  watch: 'bg-butter/40 text-ink border-butter/70 hover:border-clay/60 dark:bg-clay-dim dark:border-clay/30',
  low: 'bg-blush/40 text-ink border-blush/70 hover:border-danger/60 dark:bg-danger-dim dark:border-danger/30',
  unmarked: 'bg-surface-2/60 text-ink-3 border-dashed border-line-strong hover:border-forest/40',
}

export function HeatGrid({
  cells,
  emptyLabel = '—',
  className,
}: {
  cells: HeatCell[]
  emptyLabel?: string
  className?: string
}) {
  return (
    <ul
      className={cn(
        'grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
        className,
      )}
    >
      {cells.map((c) => {
        const band = bandFor(c.value)
        const Tag = c.href ? 'a' : 'div'
        return (
          <li key={c.id}>
            <Tag
              {...(c.href ? { href: c.href } : {})}
              className={cn(
                'flex h-full flex-col justify-between gap-2 rounded-md border p-2.5 transition-all duration-200 ease-soft',
                c.href && 'ring-focus hover:-translate-y-[2px] hover:shadow-card',
                BAND_STYLE[band],
              )}
            >
              <div className="flex items-baseline justify-between gap-1">
                <span className="truncate text-[13px] font-semibold">{c.label}</span>
                <span className="tabular shrink-0 text-sm font-semibold">
                  {c.value === null ? emptyLabel : `${Math.round(c.value)}%`}
                </span>
              </div>
              {c.detail && <span className="truncate text-2xs">{c.detail}</span>}
            </Tag>
          </li>
        )
      })}
    </ul>
  )
}

/**
 * Horizontal comparison bars — used where a small set of named values needs
 * ranking rather than a trend (subject averages, class strength).
 */
export function BarList({
  items,
  className,
}: {
  items: { label: string; value: number; display: string; tone?: 'forest' | 'leaf' | 'clay' | 'danger' | 'info' }[]
  className?: string
}) {
  const max = Math.max(1, ...items.map((i) => i.value))
  return (
    <ul className={cn('flex flex-col gap-3', className)}>
      {items.map((item) => (
        <li key={item.label} className="grid grid-cols-[minmax(0,7rem)_1fr_auto] items-center gap-3">
          <span className="truncate text-[13px] text-ink-2">{item.label}</span>
          <span className="h-2.5 w-full overflow-hidden rounded-pill bg-surface-2">
            <span
              className={cn(
                'block h-full rounded-pill transition-[width] duration-700 ease-soft',
                item.tone === 'leaf' && 'bg-leaf',
                item.tone === 'clay' && 'bg-clay',
                item.tone === 'danger' && 'bg-danger',
                item.tone === 'info' && 'bg-info',
                (!item.tone || item.tone === 'forest') && 'bg-forest',
              )}
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </span>
          <span className="tabular text-[13px] font-semibold text-ink">{item.display}</span>
        </li>
      ))}
    </ul>
  )
}
