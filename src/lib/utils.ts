import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Indian numbering: ₹12,34,567 */
export function formatINR(amount: number, opts: { compact?: boolean } = {}): string {
  if (opts.compact) {
    if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`
    if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)} L`
    if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n)
}

export function formatDate(iso: string, style: 'short' | 'long' | 'day' = 'short'): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  if (style === 'long') {
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
  }
  if (style === 'day') {
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
  }
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/** Deterministic pastel avatar background derived from a string. */
export function avatarTint(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return `hsl(${h} 34% 88%)`
}

export function pct(numerator: number, denominator: number): number {
  if (!denominator) return 0
  return Math.round((numerator / denominator) * 1000) / 10
}

/** Grade bands used by most TN matriculation and CBSE schools. */
export function gradeFor(percentage: number): string {
  if (percentage >= 91) return 'A1'
  if (percentage >= 81) return 'A2'
  if (percentage >= 71) return 'B1'
  if (percentage >= 61) return 'B2'
  if (percentage >= 51) return 'C1'
  if (percentage >= 41) return 'C2'
  if (percentage >= 35) return 'D'
  return 'E'
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

/**
 * sfc32, seeded through splitmix32 — a small deterministic PRNG so the demo
 * data is byte-identical on every run and every machine.
 *
 * sfc32 rather than the more commonly pasted mulberry32: the seed data branches
 * on one draw and then takes a magnitude from the very next one, and mulberry32
 * has enough serial correlation that a high branch draw is reliably followed by
 * another high draw. That made every "chronic absentee" land on the exact top of
 * its band, so the whole alert list showed one identical percentage.
 */
export function seededRandom(seed: number) {
  let s = seed >>> 0
  const splitmix = () => {
    s = (s + 0x9e3779b9) | 0
    let z = s
    z = Math.imul(z ^ (z >>> 16), 0x21f0aaad)
    z = Math.imul(z ^ (z >>> 15), 0x735a2d97)
    return (z ^ (z >>> 15)) >>> 0
  }

  let a = splitmix()
  let b = splitmix()
  let c = splitmix()
  let d = splitmix()

  const next = () => {
    a >>>= 0
    b >>>= 0
    c >>>= 0
    d >>>= 0
    let t = (a + b) | 0
    a = b ^ (b >>> 9)
    b = (c + (c << 3)) | 0
    c = (c << 21) | (c >>> 11)
    d = (d + 1) | 0
    t = (t + d) | 0
    c = (c + t) | 0
    return (t >>> 0) / 4294967296
  }

  // Discard the first few outputs while the state mixes.
  for (let i = 0; i < 12; i++) next()
  return next
}
