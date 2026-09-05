'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BadgeIndianRupee, BookOpenCheck, CalendarCheck2, GraduationCap, LayoutDashboard,
  LogOut, Megaphone, Menu, Moon, Settings, Sun, Users, X, Languages, UserRound,
  type LucideIcon,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { usePrefs } from '@/lib/i18n/provider'
import type { TranslationKey } from '@/lib/i18n/dictionary'
import { useSession, type Capability } from '@/lib/auth/session'
import { IS_DEMO, SCHOOL } from '@/lib/data/repository'
import { Avatar, Badge } from '@/components/ui'

interface NavItem {
  href: string
  labelKey: TranslationKey
  icon: LucideIcon
  capability: Capability
}

const NAV: NavItem[] = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard, capability: 'view_dashboard' },
  { href: '/attendance', labelKey: 'nav.attendance', icon: CalendarCheck2, capability: 'mark_attendance' },
  { href: '/students', labelKey: 'nav.students', icon: Users, capability: 'view_all_students' },
  { href: '/fees', labelKey: 'nav.fees', icon: BadgeIndianRupee, capability: 'manage_fees' },
  { href: '/exams', labelKey: 'nav.exams', icon: BookOpenCheck, capability: 'enter_marks' },
  { href: '/communication', labelKey: 'nav.communication', icon: Megaphone, capability: 'send_announcements' },
  { href: '/staff', labelKey: 'nav.staff', icon: GraduationCap, capability: 'view_staff' },
]

const PARENT_NAV: NavItem[] = [
  { href: '/parent', labelKey: 'nav.myChild', icon: UserRound, capability: 'view_own_child' },
]

/**
 * Declared at module scope, not inside AppShell. A component defined in a
 * render body is a new component type every render, which remounts the whole
 * nav subtree and loses focus state.
 */
function NavLinks({
  items,
  pathname,
  label,
}: {
  items: NavItem[]
  pathname: string
  label: (key: TranslationKey) => string
}) {
  return (
    <nav className="flex flex-col gap-0.5 px-2">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + '/')
        const Icon = item.icon
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-2.5 rounded px-3 py-2 text-sm transition-colors ring-focus',
              active
                ? 'bg-forest-dim font-semibold text-forest'
                : 'text-ink-2 hover:bg-surface-2 hover:text-ink',
            )}
          >
            <Icon size={17} className="shrink-0" />
            <span className="truncate">{label(item.labelKey)}</span>
          </Link>
        )
      })}
    </nav>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut, can } = useSession()
  const { t, locale, setLocale, theme, setTheme } = usePrefs()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Route guard — bounce anyone without a session back to sign-in.
  useEffect(() => {
    if (!loading && !user) router.replace('/')
  }, [loading, user, router])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-forest" />
      </div>
    )
  }

  const items = (user.role === 'parent' ? PARENT_NAV : NAV).filter((i) => can(i.capability))

  const Sidebar = (
    <>
      {/* Brand */}
      <div className="border-b border-line px-4 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded bg-forest font-serif text-sm font-bold text-white">
            {SCHOOL.logo_text}
          </span>
          <div className="min-w-0">
            <div className="truncate font-serif text-[15px] font-bold leading-tight text-ink">
              {t('app.name')}
            </div>
            <div className="label-mono truncate">{SCHOOL.city}</div>
          </div>
        </div>
        {IS_DEMO && (
          <Badge tone="clay" className="mt-2.5">
            Demo data
          </Badge>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-3 thin-scroll">
        <div className="label-mono mb-1.5 px-5">Menu</div>
        <NavLinks items={items} pathname={pathname} label={t} />
      </div>

      {/* Footer controls */}
      <div className="border-t border-line p-2">
        <div className="mb-2 flex gap-1 px-1">
          <button
            onClick={() => setLocale(locale === 'en' ? 'ta' : 'en')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium text-ink-2 ring-focus hover:bg-surface-2 hover:text-ink"
            title={t('set.language')}
          >
            <Languages size={14} />
            {locale === 'en' ? 'தமிழ்' : 'EN'}
          </button>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="flex flex-1 items-center justify-center gap-1.5 rounded px-2 py-1.5 text-xs font-medium text-ink-2 ring-focus hover:bg-surface-2 hover:text-ink"
            title={t('set.theme')}
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            {theme === 'dark' ? t('set.themeLight') : t('set.themeDark')}
          </button>
          <Link
            href="/settings"
            className="flex items-center justify-center rounded px-2 py-1.5 text-ink-2 ring-focus hover:bg-surface-2 hover:text-ink"
            title={t('set.title')}
          >
            <Settings size={14} />
          </Link>
        </div>

        <div className="flex items-center gap-2 rounded bg-surface-2 px-2.5 py-2">
          <Avatar name={user.name} size={30} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold leading-tight text-ink">
              {user.name}
            </div>
            <div className="truncate text-2xs text-ink-3">{user.designation}</div>
          </div>
          <button
            onClick={signOut}
            className="rounded p-1.5 text-ink-3 ring-focus hover:bg-line hover:text-danger"
            title={t('nav.signOut')}
            aria-label={t('nav.signOut')}
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </>
  )

  return (
    <div className="relative z-10 flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface lg:flex">
        {Sidebar}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
          <aside className="animate-slide-in absolute inset-y-0 left-0 flex w-64 flex-col border-r border-line bg-surface">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-2 top-3 rounded p-1.5 text-ink-3 hover:bg-surface-2"
              aria-label={t('common.close')}
            >
              <X size={18} />
            </button>
            {Sidebar}
          </aside>
        </div>
      )}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-60">
        {/* Mobile top bar */}
        <header className="app-header sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 lg:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded p-1.5 text-ink-2 ring-focus hover:bg-surface-2"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <span className="flex h-7 w-7 items-center justify-center rounded bg-forest font-serif text-xs font-bold text-white">
            {SCHOOL.logo_text}
          </span>
          <span className="truncate font-serif text-base font-bold text-ink">
            {t('app.name')}
          </span>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setLocale(locale === 'en' ? 'ta' : 'en')}
              className="rounded px-2 py-1 text-xs font-semibold text-ink-2 ring-focus hover:bg-surface-2"
            >
              {locale === 'en' ? 'தமிழ்' : 'EN'}
            </button>
            <Avatar name={user.name} size={28} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 pb-24 sm:px-6 lg:py-8 lg:pb-10">
          {children}
        </main>

        {/* Mobile bottom tab bar — thumb-reachable, the way teachers actually hold a phone */}
        <nav className="no-print fixed inset-x-0 bottom-0 z-30 flex border-t border-line bg-surface lg:hidden">
          {items.slice(0, 5).map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-2xs font-medium transition-colors',
                  active ? 'text-forest' : 'text-ink-3',
                )}
              >
                <Icon size={19} />
                <span className="max-w-full truncate px-0.5">{t(item.labelKey)}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
