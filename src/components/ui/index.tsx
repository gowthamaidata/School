'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/* ══════════════════════════════════════════════════════════
   UI primitives — Mosaic Grid Architecture
   Hairline structure, no gradients, mono labels, flat surfaces.
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
        'inline-flex items-center justify-center gap-2 rounded font-medium ring-focus transition-colors',
        'disabled:opacity-45 disabled:pointer-events-none select-none',
        size === 'sm' && 'h-8 px-3 text-[13px]',
        size === 'md' && 'h-10 px-4 text-sm',
        size === 'lg' && 'h-12 px-6 text-[15px]',
        variant === 'primary' && 'bg-forest text-white hover:bg-forest-2',
        variant === 'secondary' && 'bg-surface-2 text-ink hover:bg-line',
        variant === 'outline' && 'hairline bg-surface text-ink hover:bg-surface-2',
        variant === 'ghost' && 'text-ink-2 hover:bg-surface-2 hover:text-ink',
        variant === 'danger' && 'bg-danger text-white hover:opacity-90',
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
    <div className={cn('card shadow-card', className)} {...props}>
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
        'inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-mono text-2xs font-medium uppercase tracking-wider',
        tone === 'neutral' && 'bg-surface-2 text-ink-2',
        tone === 'forest' && 'bg-forest-dim text-forest',
        tone === 'clay' && 'bg-clay-dim text-clay',
        tone === 'danger' && 'bg-danger-dim text-danger',
        tone === 'info' && 'bg-info-dim text-info',
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
  return (
    <div className={cn('card relative overflow-hidden p-4 shadow-card', className)}>
      <div
        className={cn(
          'absolute inset-y-0 left-0 w-[3px]',
          tone === 'forest' && 'bg-forest',
          tone === 'clay' && 'bg-clay',
          tone === 'danger' && 'bg-danger',
          tone === 'info' && 'bg-info',
          tone === 'neutral' && 'bg-line-strong',
        )}
      />
      <div className="flex items-start justify-between gap-2">
        <span className="label-mono">{label}</span>
        {icon && <span className="text-ink-3">{icon}</span>}
      </div>
      <div className="tabular mt-2 font-serif text-[26px] font-bold leading-none text-ink">
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
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-2', className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-full transition-[width] duration-500',
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
        'h-10 w-full rounded border border-line bg-surface px-3 text-sm text-ink ring-focus',
        'placeholder:text-ink-3 disabled:opacity-50',
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
        'w-full rounded border border-line bg-surface px-3 py-2 text-sm leading-relaxed text-ink ring-focus',
        'placeholder:text-ink-3 disabled:opacity-50',
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
        'h-10 w-full appearance-none rounded border border-line bg-surface px-3 pr-8 text-sm text-ink ring-focus',
        "bg-[url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%237d8f82' stroke-width='2'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")] bg-[length:16px] bg-[right_0.6rem_center] bg-no-repeat",
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
    <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {icon && <div className="mb-3 text-ink-3">{icon}</div>}
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
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <div className="label-mono mb-1">{eyebrow}</div>}
        <h1 className="font-serif text-2xl font-bold leading-tight text-ink sm:text-[28px]">
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
        'flex items-center gap-2 rounded-md px-4 py-3 text-sm font-medium shadow-pop',
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
  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'relative z-10 max-h-[88vh] w-full overflow-y-auto rounded-t-lg bg-surface shadow-pop',
          'thin-scroll animate-fade-up sm:rounded-lg',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md',
        )}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
          <h2 className="font-serif text-lg font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-ink-3 ring-focus hover:bg-surface-2 hover:text-ink"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4">{children}</div>
        {footer && (
          <div className="sticky bottom-0 flex justify-end gap-2 border-t border-line bg-surface px-4 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Skeleton ───────────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-surface-2', className)} />
}
