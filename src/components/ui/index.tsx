'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/* ══════════════════════════════════════════════════════════
   UI primitives — Soft Pastel Studio
   Rounded everything, airy diffused shadows, gentle lift/scale on
   hover & tap, mint/lavender/peach/sky/butter accents. Motion is
   short (150–350ms) and eases with a soft overshoot.
   ══════════════════════════════════════════════════════════ */

/* ── Button ─────────────────────────────────────────────── */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-pill font-semibold ring-focus transition-all duration-150',
        'active:scale-[0.97] hover:-translate-y-0.5',
        'disabled:opacity-45 disabled:pointer-events-none disabled:translate-y-0 select-none',
        size === 'sm' && 'h-8 px-3.5 text-[13px]',
        size === 'md' && 'h-10 px-5 text-sm',
        size === 'lg' && 'h-12 px-7 text-[15px]',
        variant === 'primary' && 'bg-forest text-white shadow-card hover:bg-forest-2 hover:shadow-lift',
        variant === 'secondary' && 'bg-surface-2 text-ink hover:bg-line',
        variant === 'outline' && 'hairline bg-surface text-ink hover:bg-surface-2',
        variant === 'ghost' && 'text-ink-2 hover:bg-surface-2 hover:text-ink hover:translate-y-0',
        variant === 'danger' && 'bg-danger text-white shadow-card hover:opacity-90 hover:shadow-lift',
        className,
      )}
      {...props}
    />
  )
}

/* ── Card ───────────────────────────────────────────────── */
export function Card({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('card shadow-card transition-shadow duration-200', className)} {...props}>
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  hint,
  action,
  className,
}: {
  title: string
  hint?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 border-b border-line px-4 py-3',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-sm font-semibold leading-tight text-ink">{title}</h2>
        {hint && <p className="mt-0.5 text-xs leading-snug text-ink-3">{hint}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ── Badge ──────────────────────────────────────────────── */
type Tone = 'neutral' | 'forest' | 'clay' | 'danger' | 'info'

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill px-2.5 py-0.5 text-2xs font-bold uppercase tracking-wider',
        tone === 'neutral' && 'bg-surface-2 text-ink-2',
        tone === 'forest' && 'bg-mint/50 text-forest-2',
        tone === 'clay' && 'bg-peach/60 text-clay',
        tone === 'danger' && 'bg-blush/60 text-danger',
        tone === 'info' && 'bg-sky/50 text-info',
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ── Stat tile ──────────────────────────────────────────── */
export function Stat({
  label,
  value,
  sub,
  tone = 'neutral',
  icon,
  className,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  tone?: Tone
  icon?: React.ReactNode
  className?: string
}) {
  const tint: Record<Tone, string> = {
    neutral: 'bg-surface-2',
    forest: 'bg-mint/35',
    clay: 'bg-peach/40',
    danger: 'bg-blush/40',
    info: 'bg-sky/35',
  }
  return (
    <div
      className={cn(
        'card relative overflow-hidden p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="label-mono">{label}</span>
        {icon && (
          <span className={cn('flex h-8 w-8 items-center justify-center rounded-full text-ink-2', tint[tone])}>
            {icon}
          </span>
        )}
      </div>
      <div className="tabular mt-2 font-display text-[28px] font-bold leading-none text-ink">
        {value}
      </div>
      {sub && <div className="mt-1.5 text-xs leading-snug text-ink-3">{sub}</div>}
    </div>
  )
}

/* ── Progress bar ───────────────────────────────────────── */
export function Progress({
  value,
  tone = 'forest',
  className,
}: {
  value: number
  tone?: Tone
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-pill bg-surface-2', className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-pill transition-[width] duration-700 ease-out',
          tone === 'forest' && 'bg-forest',
          tone === 'clay' && 'bg-clay',
          tone === 'danger' && 'bg-danger',
          tone === 'info' && 'bg-info',
          tone === 'neutral' && 'bg-ink-3',
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}

/* ── Form controls ──────────────────────────────────────── */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...props }, ref) {
  return (
    <input
      ref={ref}
      className={cn(
        'h-10 w-full rounded-md border border-line bg-surface px-3.5 text-sm text-ink ring-focus transition-colors',
        'placeholder:text-ink-3 disabled:opacity-50 focus-visible:border-forest/40',
        className,
      )}
      {...props}
    />
  )
})

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'w-full rounded-md border border-line bg-surface px-3.5 py-2.5 text-sm leading-relaxed text-ink ring-focus transition-colors',
        'placeholder:text-ink-3 disabled:opacity-50 focus-visible:border-forest/40',
        className,
      )}
      {...props}
    />
  )
})

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(
        'h-10 w-full appearance-none rounded-md border border-line bg-surface px-3.5 pr-8 text-sm text-ink ring-focus transition-colors focus-visible:border-forest/40',
        "bg-[url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23948eaa' stroke-width='2'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")] bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
})

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="label-mono mb-1.5 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-3">{hint}</span>}
    </label>
  )
}

/* ── Table ──────────────────────────────────────────────── */
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('thin-scroll w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  )
}

export function Th({
  children,
  className,
  align = 'left',
}: {
  children?: React.ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}) {
  return (
    <th
      className={cn(
        'label-mono whitespace-nowrap border-b border-line bg-surface-2 px-3 py-2',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        align === 'left' && 'text-left',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Td({
  children,
  className,
  align = 'left',
}: {
  children?: React.ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
}) {
  return (
    <td
      className={cn(
        'border-b border-line px-3 py-2.5 align-middle text-ink-2',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  )
}

/* ── Avatar ─────────────────────────────────────────────── */
export function Avatar({
  name,
  size = 36,
  className,
}: {
  name: string
  size?: number
  className?: string
}) {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full border border-line font-semibold text-ink',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `hsl(${h} 30% 88%)`,
        fontSize: size * 0.36,
      }}
      aria-hidden
    >
      {letters}
    </span>
  )
}

/* ── Empty state ────────────────────────────────────────── */
export function Empty({
  title,
  hint,
  icon,
}: {
  title: string
  hint?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center animate-fade-up">
      {icon && (
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-lavender/30 text-forest">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-ink-2">{title}</p>
      {hint && <p className="mt-1 max-w-xs text-xs text-ink-3">{hint}</p>}
    </div>
  )
}

/* ── Section heading ────────────────────────────────────── */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex animate-fade-up flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <div className="label-mono mb-1">{eyebrow}</div>}
        <h1 className="font-display text-2xl font-bold leading-tight text-ink sm:text-[30px]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-2">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ── Toast ──────────────────────────────────────────────── */
export function Toast({
  message,
  tone = 'forest',
  onDismiss,
}: {
  message: string
  tone?: Tone
  onDismiss?: () => void
}) {
  React.useEffect(() => {
    if (!onDismiss) return
    const id = setTimeout(onDismiss, 3600)
    return () => clearTimeout(id)
  }, [onDismiss])

  return (
    <div
      role="status"
      className={cn(
        'fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-fade-up md:bottom-6',
        'flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold shadow-pop',
        tone === 'forest' && 'bg-forest text-white',
        tone === 'danger' && 'bg-danger text-white',
        tone === 'clay' && 'bg-clay text-white',
        tone === 'info' && 'bg-info text-white',
        tone === 'neutral' && 'bg-ink text-paper',
      )}
    >
      {message}
    </div>
  )
}

/* ── Modal ──────────────────────────────────────────────── */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean
}) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null)
  const lastFocusedRef = React.useRef<HTMLElement | null>(null)

  React.useEffect(() => {
    if (!open) return
    lastFocusedRef.current = document.activeElement as HTMLElement | null

    const focusables = () =>
      Array.from(
        (dialogRef.current?.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? []) as NodeListOf<HTMLElement>,
      )

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const nodes = focusables()
      if (nodes.length === 0) {
        e.preventDefault()
        dialogRef.current?.focus()
        return
      }
      const first = nodes[0]
      const last = nodes[nodes.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => {
      const nodes = focusables()
      if (nodes[0]) nodes[0].focus()
      else dialogRef.current?.focus()
    })
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      lastFocusedRef.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-t-lg bg-surface shadow-pop',
          'glass thin-scroll animate-pop-in sm:rounded-lg',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md',
        )}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface/95 px-4 py-3 backdrop-blur-sm">
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-pill p-1.5 text-ink-3 ring-focus hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer && (
          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur-sm">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Skeleton ───────────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton-shimmer rounded-md', className)} />
}

/* ── Confirm dialog ─────────────────────────────────────── */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-2">{description}</p>
    </Modal>
  )
}

/* ── Animated number ────────────────────────────────────── */
export function CountUp({
  value,
  durationMs = 850,
  className,
}: {
  value: number
  durationMs?: number
  className?: string
}) {
  const [display, setDisplay] = React.useState(0)

  React.useEffect(() => {
    const start = performance.now()
    const from = 0
    const to = value
    let raf = 0

    function tick(now: number) {
      const p = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      const next = from + (to - from) * eased
      setDisplay(next)
      if (p < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, durationMs])

  return <span className={cn('tabular', className)}>{Math.round(display).toLocaleString('en-IN')}</span>
}

/* ── Circular progress ring ─────────────────────────────── */
export function ProgressRing({
  value,
  size = 56,
  stroke = 7,
  tone = 'forest',
}: {
  value: number
  size?: number
  stroke?: number
  tone?: Tone
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (clamped / 100) * c
  const strokeClass =
    tone === 'forest'
      ? 'stroke-forest'
      : tone === 'clay'
        ? 'stroke-clay'
        : tone === 'danger'
          ? 'stroke-danger'
          : tone === 'info'
            ? 'stroke-info'
            : 'stroke-ink-3'
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(clamped)}%`}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgb(var(--surface-2))"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        className={cn('origin-center -rotate-90 transition-[stroke-dashoffset] duration-700 ease-out', strokeClass)}
        style={{
          strokeDasharray: c,
          strokeDashoffset: offset,
          transformOrigin: '50% 50%',
          transform: 'rotate(-90deg)',
        }}
      />
      <text
        x="50%"
        y="50%"
        dominantBaseline="middle"
        textAnchor="middle"
        className="fill-ink text-[11px] font-semibold tabular"
      >
        {Math.round(clamped)}%
      </text>
    </svg>
  )
}
