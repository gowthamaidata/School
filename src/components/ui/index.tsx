'use client'

import React from 'react'
import { cn } from '@/lib/utils'

/* ══════════════════════════════════════════════════════════
   UI PRIMITIVES — Palli design system

   Rules this file follows, so the product reads as one thing:
   · geometry is graded — `pill` for chips/toggles/icon buttons,
     `md` for inputs and rows, `lg` for cards, `xl` for panels
   · colour carries meaning; tone names map to semantics, not hues
   · motion is 150–350ms on the `soft` curve, transform/opacity only
   · every interactive element has a visible focus ring and a label
   ══════════════════════════════════════════════════════════ */

export type Tone = 'neutral' | 'forest' | 'clay' | 'danger' | 'info' | 'leaf'

/* ── Button ─────────────────────────────────────────────── */
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  /** Renders a spinner and blocks input without changing width. */
  loading?: boolean
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex select-none items-center justify-center gap-2 rounded-pill font-semibold',
        'ring-focus transition-all duration-200 ease-soft active:scale-[0.97]',
        'disabled:pointer-events-none disabled:opacity-45',
        size === 'sm' && 'h-8 px-3.5 text-[13px]',
        size === 'md' && 'h-10 px-5 text-sm',
        size === 'lg' && 'h-12 px-7 text-[15px]',
        variant === 'primary' && 'bg-forest text-white shadow-card hover:bg-forest-2 hover:shadow-lift',
        variant === 'secondary' && 'bg-surface-2 text-ink hover:bg-surface-3',
        variant === 'outline' && 'border border-line bg-surface text-ink hover:border-line-strong hover:bg-surface-2',
        variant === 'ghost' && 'text-ink-2 hover:bg-surface-2 hover:text-ink',
        variant === 'danger' && 'bg-danger text-white shadow-card hover:brightness-95 hover:shadow-lift',
        className,
      )}
      {...props}
    >
      {loading && (
        <span
          className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      )}
      {children}
    </button>
  )
}

/* ── Icon button ────────────────────────────────────────── */
export function IconButton({
  label,
  className,
  tone = 'neutral',
  size = 'md',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required — an icon-only control must announce itself. */
  label: string
  tone?: 'neutral' | 'danger'
  size?: 'sm' | 'md'
}) {
  return (
    <button
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-pill text-ink-3 ring-focus',
        'transition-colors duration-150 hover:bg-surface-2',
        tone === 'neutral' ? 'hover:text-ink' : 'hover:text-danger',
        size === 'sm' ? 'h-8 w-8' : 'h-9 w-9',
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
  interactive,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn('card shadow-card', interactive && 'card-interactive', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({
  title,
  hint,
  action,
  icon,
  className,
}: {
  title: React.ReactNode
  hint?: React.ReactNode
  action?: React.ReactNode
  icon?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5',
        className,
      )}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && (
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-pill bg-surface-2 text-ink-2">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="font-display text-[15px] font-semibold leading-tight text-ink">{title}</h2>
          {hint && <p className="mt-0.5 text-xs leading-snug text-ink-3">{hint}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/* ── Badge ──────────────────────────────────────────────── */
export function Badge({
  children,
  tone = 'neutral',
  dot,
  className,
}: {
  children: React.ReactNode
  tone?: Tone
  /** Adds a status dot — useful when the label alone is ambiguous. */
  dot?: boolean
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 text-2xs font-semibold uppercase tracking-[0.06em]',
        tone === 'neutral' && 'bg-surface-2 text-ink-2',
        tone === 'forest' && 'bg-forest-dim text-forest-ink',
        tone === 'leaf' && 'bg-leaf-dim text-leaf-ink',
        tone === 'clay' && 'bg-clay-dim text-clay-ink',
        tone === 'danger' && 'bg-danger-dim text-danger-ink',
        tone === 'info' && 'bg-info-dim text-info-ink',
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full',
            tone === 'neutral' && 'bg-ink-3',
            tone === 'forest' && 'bg-forest',
            tone === 'leaf' && 'bg-leaf',
            tone === 'clay' && 'bg-clay',
            tone === 'danger' && 'bg-danger',
            tone === 'info' && 'bg-info',
          )}
          aria-hidden
        />
      )}
      {children}
    </span>
  )
}

/* Tone → wash, used by tiles and tinted icon chips. */
export const toneWash: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-2',
  forest: 'bg-lavender/40 text-forest-ink',
  leaf: 'bg-mint/45 text-leaf-ink',
  clay: 'bg-peach/45 text-clay-ink',
  danger: 'bg-blush/45 text-danger-ink',
  info: 'bg-sky/40 text-info-ink',
}

/* ── Stat tile ──────────────────────────────────────────── */
export function Stat({
  label,
  value,
  sub,
  tone = 'neutral',
  icon,
  className,
  href,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  tone?: Tone
  icon?: React.ReactNode
  className?: string
  href?: string
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <span className="label">{label}</span>
        {icon && (
          <span
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-pill',
              toneWash[tone],
            )}
            aria-hidden
          >
            {icon}
          </span>
        )}
      </div>
      <div className="tabular mt-3 font-display text-metric font-semibold text-ink">{value}</div>
      {sub && <div className="mt-2 text-xs leading-snug text-ink-2">{sub}</div>}
    </>
  )

  const shell = cn('card relative overflow-hidden p-4 shadow-card sm:p-5', className)

  if (href) {
    return (
      <a href={href} className={cn(shell, 'card-interactive block ring-focus')}>
        {body}
      </a>
    )
  }
  return <div className={shell}>{body}</div>
}

/* ── Progress bar ───────────────────────────────────────── */
export function Progress({
  value,
  tone = 'forest',
  size = 'md',
  className,
  label,
}: {
  value: number
  tone?: Tone
  size?: 'sm' | 'md'
  className?: string
  /** Accessible name — falls back to a percentage read-out. */
  label?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-pill bg-surface-3',
        size === 'sm' ? 'h-1.5' : 'h-2',
        className,
      )}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          'h-full rounded-pill transition-[width] duration-700 ease-soft',
          tone === 'forest' && 'bg-forest',
          tone === 'leaf' && 'bg-leaf',
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
const fieldBase =
  'w-full rounded-md border border-line bg-surface text-sm text-ink ring-focus-tight transition-all duration-150 ' +
  'placeholder:text-ink-3 disabled:cursor-not-allowed disabled:opacity-50 ' +
  'focus-visible:border-forest/50 focus-visible:shadow-glow'

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(function Input({ className, invalid, ...props }, ref) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(fieldBase, 'h-10 px-3.5', invalid && 'border-danger/60', className)}
      {...props}
    />
  )
})

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        fieldBase,
        'px-3.5 py-2.5 leading-relaxed',
        invalid && 'border-danger/60',
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
        fieldBase,
        'h-10 cursor-pointer appearance-none px-3.5 pr-9',
        "bg-[url(\"data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%23797190' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M4 6l4 4 4-4'/%3E%3C/svg%3E\")] bg-[length:16px] bg-[right_0.7rem_center] bg-no-repeat",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  )
})

/** Search input with a leading icon, a clear button and an accessible name. */
export function SearchInput({
  value,
  onValueChange,
  placeholder,
  label = 'Search',
  className,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value: string
  onValueChange: (v: string) => void
  label?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20l-3.5-3.5" />
      </svg>
      <input
        type="search"
        value={value}
        aria-label={label}
        placeholder={placeholder}
        onChange={(e) => onValueChange(e.target.value)}
        className={cn(fieldBase, 'h-10 pl-10 pr-9 [&::-webkit-search-cancel-button]:hidden')}
        {...props}
      />
      {value && (
        <button
          type="button"
          onClick={() => onValueChange('')}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-pill text-ink-3 ring-focus-tight hover:bg-surface-2 hover:text-ink"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className,
}: {
  label: string
  hint?: string
  error?: string
  children: React.ReactNode
  htmlFor?: string
  className?: string
}) {
  const Wrapper = htmlFor ? 'div' : 'label'
  return (
    <Wrapper className={cn('block', className)}>
      {htmlFor ? (
        <label htmlFor={htmlFor} className="label mb-1.5 block">
          {label}
        </label>
      ) : (
        <span className="label mb-1.5 block">{label}</span>
      )}
      {children}
      {error ? (
        <span role="alert" className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16.5v.01" strokeLinecap="round" />
          </svg>
          {error}
        </span>
      ) : (
        hint && <span className="mt-1.5 block text-xs text-ink-3">{hint}</span>
      )}
    </Wrapper>
  )
}

/* ── Segmented control ──────────────────────────────────
   Replaces small dropdowns where the options are few and worth
   showing — filters read faster as visible choices than as a
   collapsed select. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  className,
  label,
}: {
  options: { value: T; label: React.ReactNode; count?: number }[]
  value: T
  onChange: (v: T) => void
  size?: 'sm' | 'md'
  className?: string
  label?: string
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        'inline-flex items-center gap-1 rounded-pill bg-surface-2 p-1',
        size === 'sm' ? 'text-xs' : 'text-[13px]',
        className,
      )}
    >
      {options.map((o) => {
        const active = o.value === value
        return (
          <button
            key={o.value}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-pill font-semibold ring-focus-tight transition-all duration-200 ease-soft',
              size === 'sm' ? 'h-7 px-3' : 'h-8 px-3.5',
              active
                ? 'bg-surface text-ink shadow-card'
                : 'text-ink-3 hover:text-ink',
            )}
          >
            {o.label}
            {typeof o.count === 'number' && (
              <span className="tabular text-2xs text-ink-3">
                {o.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ── Table ──────────────────────────────────────────────
   The table stays a table where a table is right — dense, scannable,
   comparable columns. Pages that read better as cards on a phone
   render `<DataList>` instead below the `sm` breakpoint. */
export function Table({
  children,
  className,
  caption,
}: {
  children: React.ReactNode
  className?: string
  caption?: string
}) {
  return (
    <div className={cn('thin-scroll w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse text-sm">
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  )
}

export function Th({
  children,
  className,
  align = 'left',
  scope = 'col',
}: {
  children?: React.ReactNode
  className?: string
  align?: 'left' | 'right' | 'center'
  scope?: 'col' | 'row'
}) {
  return (
    <th
      scope={scope}
      className={cn(
        'label whitespace-nowrap border-b border-line bg-surface-2/60 px-4 py-2.5 first:rounded-tl-md last:rounded-tr-md',
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
        'border-b border-line px-4 py-3 align-middle text-ink-2',
        align === 'right' && 'text-right',
        align === 'center' && 'text-center',
        className,
      )}
    >
      {children}
    </td>
  )
}

/* ── Pagination ─────────────────────────────────────────
   Used instead of a "showing the first N" cut-off, which silently hides
   records and leaves no way to reach them. */
export function Pagination({
  page,
  pageSize,
  total,
  onPage,
  labels,
}: {
  page: number
  pageSize: number
  total: number
  onPage: (p: number) => void
  labels: { previous: string; next: string; showing: (a: number, b: number, n: number) => string }
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null
  const from = page * pageSize + 1
  const to = Math.min(total, (page + 1) * pageSize)
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 sm:px-5">
      <span className="tabular text-xs text-ink-3">{labels.showing(from, to, total)}</span>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page === 0}
          onClick={() => onPage(page - 1)}
        >
          {labels.previous}
        </Button>
        <span className="tabular px-1 text-xs font-semibold text-ink-2">
          {page + 1} / {pages}
        </span>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= pages - 1}
          onClick={() => onPage(page + 1)}
        >
          {labels.next}
        </Button>
      </div>
    </div>
  )
}

/* ── Avatar ─────────────────────────────────────────────── */
export function Avatar({
  name,
  size = 36,
  className,
  ring,
}: {
  name: string
  size?: number
  className?: string
  ring?: boolean
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
        'inline-flex shrink-0 items-center justify-center rounded-pill font-semibold',
        ring && 'ring-2 ring-surface',
        className,
      )}
      style={{
        width: size,
        height: size,
        background: `hsl(${h} 46% 90%)`,
        color: `hsl(${h} 42% 30%)`,
        fontSize: Math.max(10, size * 0.36),
      }}
      aria-hidden
    >
      {letters}
    </span>
  )
}

/* ── Empty / error states ───────────────────────────────── */
export function Empty({
  title,
  hint,
  icon,
  action,
  className,
}: {
  title: string
  hint?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex animate-fade-up flex-col items-center justify-center px-6 py-14 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-pill bg-lavender/30 text-forest">
          {icon}
        </div>
      )}
      <p className="font-display text-[15px] font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-ink-3">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({
  title,
  hint,
  onRetry,
  retryLabel = 'Try again',
}: {
  title: string
  hint?: string
  onRetry?: () => void
  retryLabel?: string
}) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-pill bg-blush/40 text-danger">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5.5M12 16.5v.01" strokeLinecap="round" />
        </svg>
      </div>
      <p className="font-display text-[15px] font-semibold text-ink">{title}</p>
      {hint && <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-3">{hint}</p>}
      {onRetry && (
        <Button variant="outline" className="mt-5" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

/* ── Page header ────────────────────────────────────────── */
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'mb-5 flex animate-fade-up flex-wrap items-end justify-between gap-x-4 gap-y-3 sm:mb-6',
        className,
      )}
    >
      <div className="min-w-0">
        {eyebrow && <div className="label mb-1.5">{eyebrow}</div>}
        <h1 className="font-display text-[26px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink sm:text-[32px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-2">{description}</p>
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
    const id = setTimeout(onDismiss, 4200)
    return () => clearTimeout(id)
  }, [onDismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed inset-x-4 bottom-[calc(var(--tabbar)+0.75rem)] z-50 mx-auto flex max-w-md animate-slide-up items-center gap-3',
        'rounded-pill py-3 pl-4 pr-3 text-sm font-medium shadow-pop lg:inset-x-auto lg:bottom-6 lg:left-1/2 lg:-translate-x-1/2',
        tone === 'danger' ? 'bg-danger text-white' : 'bg-ink text-paper',
      )}
    >
      <span
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-pill',
          tone === 'danger' ? 'bg-white/20' : 'bg-white/15',
        )}
        aria-hidden
      >
        {tone === 'danger' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <path d="M12 7v6M12 16.5v.01" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce-check">
            <path d="M4 12.5l5 5L20 6.5" />
          </svg>
        )}
      </span>
      <span className="min-w-0 flex-1 leading-snug">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="shrink-0 rounded-pill p-1.5 opacity-70 ring-focus-tight transition-opacity hover:opacity-100"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

/* ── Modal ──────────────────────────────────────────────
   A bottom sheet on phones, a centred dialog from `sm` up. Focus is
   trapped, Escape closes, the page behind cannot scroll, and focus
   returns to whatever opened it. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  wide?: boolean
}) {
  const dialogRef = React.useRef<HTMLDivElement | null>(null)
  const lastFocusedRef = React.useRef<HTMLElement | null>(null)
  const titleId = React.useId()

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
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const raf = requestAnimationFrame(() => {
      const nodes = focusables()
      if (nodes[0]) nodes[0].focus()
      else dialogRef.current?.focus()
    })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      lastFocusedRef.current?.focus()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-ink/35 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'thin-scroll relative z-10 flex max-h-[88vh] w-full animate-pop-in flex-col overflow-hidden',
          'rounded-t-2xl border border-line bg-surface shadow-pop sm:rounded-2xl',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md',
        )}
      >
        {/* Grab handle — signals the sheet is dismissable on touch. */}
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-pill bg-line-strong sm:hidden" aria-hidden />
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-5 py-3.5">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-lg font-semibold text-ink">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-xs text-ink-3">{description}</p>}
          </div>
          <IconButton label="Close" size="sm" onClick={onClose} className="-mr-1.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </IconButton>
        </div>
        <div className="thin-scroll min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-line bg-surface-2/50 px-5 py-3.5 pb-safe">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

/* ── Skeleton ───────────────────────────────────────────── */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton-shimmer rounded-md', className)} aria-hidden />
}

/** A labelled loading region — announces itself instead of being silent. */
export function Loading({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite" aria-label={label}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  )
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
  busy,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'primary'
  busy?: boolean
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
          <Button
            variant={tone === 'danger' ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={busy}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-ink-2">{description}</p>
    </Modal>
  )
}

/* ── Animated number ────────────────────────────────────
   Counts from the previous value, not from zero, so a refresh reads
   as a change rather than a reload. Honours reduced-motion. */
export function CountUp({
  value,
  durationMs = 900,
  decimals = 0,
  className,
}: {
  value: number
  durationMs?: number
  decimals?: number
  className?: string
}) {
  const [display, setDisplay] = React.useState(value)
  const fromRef = React.useRef(0)

  React.useEffect(() => {
    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    const from = fromRef.current
    if (reduce || from === value) {
      setDisplay(value)
      fromRef.current = value
      return
    }
    const start = performance.now()
    let raf = 0
    function tick(now: number) {
      const p = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(from + (value - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
      else fromRef.current = value
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, durationMs])

  return (
    <span className={cn('tabular', className)}>
      {display.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
    </span>
  )
}

/* ── Circular progress ring ─────────────────────────────── */
export function ProgressRing({
  value,
  size = 56,
  stroke = 7,
  tone = 'forest',
  showValue = true,
  className,
}: {
  value: number
  size?: number
  stroke?: number
  tone?: Tone
  showValue?: boolean
  className?: string
}) {
  const clamped = Math.max(0, Math.min(100, value))
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (clamped / 100) * c
  const strokeClass =
    tone === 'forest'
      ? 'stroke-forest'
      : tone === 'leaf'
        ? 'stroke-leaf'
        : tone === 'clay'
          ? 'stroke-clay'
          : tone === 'danger'
            ? 'stroke-danger'
            : tone === 'info'
              ? 'stroke-info'
              : 'stroke-ink-3'
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`${Math.round(clamped)}%`}
      className={className}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgb(var(--surface-3))"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        className={cn('transition-[stroke-dashoffset] duration-1000 ease-soft', strokeClass)}
        style={{
          strokeDasharray: c,
          strokeDashoffset: offset,
          transformOrigin: '50% 50%',
          transform: 'rotate(-90deg)',
        }}
      />
      {showValue && (
        <text
          x="50%"
          y="50%"
          dominantBaseline="central"
          textAnchor="middle"
          className="fill-ink font-semibold tabular"
          style={{ fontSize: Math.max(10, size * 0.26) }}
        >
          {Math.round(clamped)}
        </text>
      )}
    </svg>
  )
}

/* ── Chart frame ────────────────────────────────────────
   Every chart in the app sits in one of these: a title, an optional
   legend, and — crucially — a screen-reader table of the same data,
   so a visualisation is never the only way to reach a number. */
export function ChartFrame({
  title,
  hint,
  legend,
  action,
  children,
  data,
  className,
}: {
  title: string
  hint?: string
  legend?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  /** Label/value pairs rendered as an off-screen table for assistive tech. */
  data?: { label: string; value: string }[]
  className?: string
}) {
  return (
    <section className={cn('card overflow-hidden shadow-card', className)}>
      <CardHeader title={title} hint={hint} action={action} />
      <div className="p-4 sm:p-5">
        {children}
        {legend && (
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-3 text-xs text-ink-2">
            {legend}
          </div>
        )}
        {data && data.length > 0 && (
          <table className="sr-only">
            <caption>{title}</caption>
            <tbody>
              {data.map((d) => (
                <tr key={d.label}>
                  <th scope="row">{d.label}</th>
                  <td>{d.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  )
}

export function LegendDot({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          'h-2.5 w-2.5 rounded-pill',
          tone === 'forest' && 'bg-forest',
          tone === 'leaf' && 'bg-leaf',
          tone === 'clay' && 'bg-clay',
          tone === 'danger' && 'bg-danger',
          tone === 'info' && 'bg-info',
          tone === 'neutral' && 'bg-ink-3',
        )}
        aria-hidden
      />
      {children}
    </span>
  )
}
